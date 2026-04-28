import { createHash } from 'node:crypto'
import { existsSync, mkdirSync } from 'node:fs'
import { rename, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'
import { createError } from 'h3'

const UPLOADS_ROOT = process.env.UPLOADS_DIR || '.data/uploads'
const EXHIBITIONS_DIR = join(UPLOADS_ROOT, 'exhibitions')
const GALLERIES_DIR = join(UPLOADS_ROOT, 'galleries')
const MAX_BYTES = 5 * 1024 * 1024
const ACCEPTED_FORMATS = new Set(['jpeg', 'png', 'webp'])

for (const dir of [EXHIBITIONS_DIR, GALLERIES_DIR]) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function safeFilename(name: string): boolean {
  return /^[A-Za-z0-9._-]+\.webp$/.test(name)
}

interface ProcessOptions {
  maxDimension?: number
  // When true, force lossless. When 'auto', uses lossless only if alpha is present.
  lossless?: boolean | 'auto'
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
  const wantsLossless = opts.lossless === true || (opts.lossless === 'auto' && meta.hasAlpha === true)
  const webpOpts: sharp.WebpOptions = wantsLossless
    ? { lossless: true, alphaQuality: 100 }
    : { quality: opts.quality ?? 82 }

  const webp = await pipeline
    .rotate()
    .resize(dim, dim, { fit: 'inside', withoutEnlargement: true })
    .webp(webpOpts)
    .toBuffer()

  const hash = createHash('sha256').update(webp).digest('hex').slice(0, 10)
  const filename = `${filenamePrefix}-${hash}.webp`
  const finalPath = join(targetDir, filename)
  const tmpPath = `${finalPath}.tmp`
  await writeFile(tmpPath, webp)
  await rename(tmpPath, finalPath)
  return { filename }
}

async function bestEffortDelete(targetDir: string, filename: string | null | undefined): Promise<void> {
  if (!filename || !safeFilename(filename)) return
  try { await unlink(join(targetDir, filename)) }
  catch { /* file may already be gone */ }
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
  if (!safeFilename(filename)) return null
  return join(EXHIBITIONS_DIR, filename)
}

export function isValidExhibitionFilename(filename: string): boolean {
  return safeFilename(filename)
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
  if (!safeFilename(filename)) return null
  return join(GALLERIES_DIR, filename)
}

export function isValidGalleryFilename(filename: string): boolean {
  return safeFilename(filename)
}

// Logos: smaller (600px), lossless if PNG transparent so the alpha survives the
// webp conversion. Stored alongside hero images, distinguished by the `-logo-`
// segment in the filename.
export function saveGalleryLogo(
  buffer: Buffer,
  _mimetype: string | undefined,
  galleryId: string,
): Promise<{ filename: string }> {
  return processAndStore(buffer, GALLERIES_DIR, `${galleryId}-logo`, {
    maxDimension: 600,
    lossless: 'auto',
  })
}

export function deleteGalleryLogo(filename: string | null | undefined): Promise<void> {
  return bestEffortDelete(GALLERIES_DIR, filename)
}
