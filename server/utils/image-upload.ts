import { createHash } from 'node:crypto'
import { existsSync, mkdirSync } from 'node:fs'
import { rename, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'
import { createError } from 'h3'
import DOMPurify from 'isomorphic-dompurify'

const UPLOADS_ROOT = process.env.UPLOADS_DIR || '.data/uploads'
const EXHIBITIONS_DIR = join(UPLOADS_ROOT, 'exhibitions')
const GALLERIES_DIR = join(UPLOADS_ROOT, 'galleries')
const MAX_BYTES = 5 * 1024 * 1024
const MAX_SVG_BYTES = 200 * 1024
const ACCEPTED_FORMATS = new Set(['jpeg', 'png', 'webp'])
const SVG_HEADER_RE = /^﻿?\s*(?:<\?xml[^?]*\?>\s*)?(?:<!DOCTYPE[^>]*>\s*)?(?:<!--[\s\S]*?-->\s*)*<svg/i

for (const dir of [EXHIBITIONS_DIR, GALLERIES_DIR]) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

// Webp-only filenames (used for the rasterised pipeline output).
function safeWebpFilename(name: string): boolean {
  return /^[A-Za-z0-9._-]+\.webp$/.test(name)
}

// Webp or svg — the gallery store accepts both for logos served as-is.
function safeImageFilename(name: string): boolean {
  return /^[A-Za-z0-9._-]+\.(?:webp|svg)$/.test(name)
}

interface ProcessOptions {
  maxDimension?: number
  quality?: number
}

async function processAndStore(
  buffer: Buffer,
  targetDir: string,
  filenamePrefix: string,
  opts: ProcessOptions = {},
): Promise<{ filename: string }> {
  if (buffer.length === 0 || buffer.length > MAX_BYTES) {
    throw createError({ statusCode: 400, statusMessage: 'Image must be 1B–5MB' })
  }
  const pipeline = sharp(buffer)
  const meta = await pipeline.metadata().catch(() => null)
  if (!meta || !meta.format || !ACCEPTED_FORMATS.has(meta.format)) {
    throw createError({ statusCode: 400, statusMessage: 'Accepted formats: jpg, png, webp' })
  }

  const dim = opts.maxDimension ?? 1600
  // Preserve PNG transparency: lossless when alpha is present (logos), lossy
  // otherwise (photos). sharp drops the alpha channel under lossy webp.
  const webpOpts: sharp.WebpOptions = meta.hasAlpha
    ? { lossless: true, alphaQuality: 100 }
    : { quality: opts.quality ?? 82 }

  const webp = await pipeline
    .rotate()
    .resize(dim, dim, { fit: 'inside', withoutEnlargement: true })
    .webp(webpOpts)
    .toBuffer()

  const hash = createHash('sha256').update(webp).digest('hex').slice(0, 10)
  const filename = `${filenamePrefix}-${hash}.webp`
  await atomicWrite(join(targetDir, filename), webp)
  return { filename }
}

async function bestEffortDelete(targetDir: string, filename: string | null | undefined): Promise<void> {
  if (!filename || !safeImageFilename(filename)) return
  try { await unlink(join(targetDir, filename)) }
  catch { /* file may already be gone */ }
}

async function atomicWrite(finalPath: string, data: Buffer | string): Promise<void> {
  const tmpPath = `${finalPath}.tmp`
  await writeFile(tmpPath, data as Parameters<typeof writeFile>[1])
  await rename(tmpPath, finalPath)
}

// Stored SVGs must be sanitised: served as `image/svg+xml`, they execute script
// when opened as a navigation target (unlike <img>-embedded SVGs).
async function sanitiseAndStoreSvg(
  buffer: Buffer,
  targetDir: string,
  filenamePrefix: string,
): Promise<{ filename: string }> {
  if (buffer.length === 0 || buffer.length > MAX_SVG_BYTES) {
    throw createError({ statusCode: 400, statusMessage: 'SVG must be 1B–200KB' })
  }
  const raw = buffer.toString('utf-8')
  if (!SVG_HEADER_RE.test(raw)) {
    throw createError({ statusCode: 400, statusMessage: 'Not a valid SVG' })
  }
  // ALLOWED_URI_REGEXP restricts <use href>, xlink:href to same-document fragments
  // only (`#…`). Without this restriction, the SVG could fetch external resources
  // even though DOMPurify already blocks `javascript:` and `data:` schemes.
  const cleaned = DOMPurify.sanitize(raw, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ALLOWED_URI_REGEXP: /^#/,
  }).trim()
  if (!cleaned || !/<svg/i.test(cleaned)) {
    throw createError({ statusCode: 400, statusMessage: 'SVG rejected by sanitiser' })
  }
  const hash = createHash('sha256').update(cleaned).digest('hex').slice(0, 10)
  const filename = `${filenamePrefix}-${hash}.svg`
  await atomicWrite(join(targetDir, filename), cleaned)
  return { filename }
}

// --- Exhibitions ---

export function saveExhibitionImage(
  buffer: Buffer,
  _mimetype: string | undefined,
  exhibitionId: string,
): Promise<{ filename: string }> {
  return processAndStore(buffer, EXHIBITIONS_DIR, exhibitionId)
}

export function deleteExhibitionImage(filename: string | null | undefined): Promise<void> {
  return bestEffortDelete(EXHIBITIONS_DIR, filename)
}

export function exhibitionImagePath(filename: string): string | null {
  if (!safeWebpFilename(filename)) return null
  return join(EXHIBITIONS_DIR, filename)
}

export function isValidExhibitionFilename(filename: string): boolean {
  return safeWebpFilename(filename)
}

// --- Galleries ---

export function saveGalleryImage(
  buffer: Buffer,
  _mimetype: string | undefined,
  galleryId: string,
): Promise<{ filename: string }> {
  return processAndStore(buffer, GALLERIES_DIR, galleryId)
}

export function deleteGalleryImage(filename: string | null | undefined): Promise<void> {
  return bestEffortDelete(GALLERIES_DIR, filename)
}

export function galleryImagePath(filename: string): string | null {
  if (!safeImageFilename(filename)) return null
  return join(GALLERIES_DIR, filename)
}

export function isValidGalleryFilename(filename: string): boolean {
  return safeImageFilename(filename)
}

// Logos: smaller (600px), lossless if PNG transparent so the alpha survives the
// webp conversion. Stored alongside hero images, distinguished by the `-logo-`
// segment in the filename.
export function saveGalleryLogo(
  buffer: Buffer,
  _mimetype: string | undefined,
  galleryId: string,
): Promise<{ filename: string }> {
  return processAndStore(buffer, GALLERIES_DIR, `${galleryId}-logo`, { maxDimension: 600 })
}

export function deleteGalleryLogo(filename: string | null | undefined): Promise<void> {
  return bestEffortDelete(GALLERIES_DIR, filename)
}

export function saveGallerySvgLogo(buffer: Buffer, galleryId: string): Promise<{ filename: string }> {
  return sanitiseAndStoreSvg(buffer, GALLERIES_DIR, `${galleryId}-logo`)
}
