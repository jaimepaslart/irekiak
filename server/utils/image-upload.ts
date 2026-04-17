import { createHash } from 'node:crypto'
import { existsSync, mkdirSync } from 'node:fs'
import { rename, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'
import { createError } from 'h3'

const UPLOADS_ROOT = process.env.UPLOADS_DIR || '.data/uploads'
const EXHIBITIONS_DIR = join(UPLOADS_ROOT, 'exhibitions')
const MAX_BYTES = 5 * 1024 * 1024
const ACCEPTED_FORMATS = new Set(['jpeg', 'png', 'webp'])

if (!existsSync(EXHIBITIONS_DIR)) mkdirSync(EXHIBITIONS_DIR, { recursive: true })

function safeFilename(name: string): boolean {
  return /^[A-Za-z0-9._-]+\.webp$/.test(name)
}

export async function saveExhibitionImage(
  buffer: Buffer,
  _mimetype: string | undefined,
  exhibitionId: string,
): Promise<{ filename: string }> {
  if (buffer.length === 0 || buffer.length > MAX_BYTES) {
    throw createError({ statusCode: 400, statusMessage: 'Image must be 1B–5MB' })
  }

  const pipeline = sharp(buffer)
  const meta = await pipeline.metadata().catch(() => null)
  if (!meta || !meta.format || !ACCEPTED_FORMATS.has(meta.format)) {
    throw createError({ statusCode: 400, statusMessage: 'Accepted formats: jpg, png, webp' })
  }

  const webp = await pipeline
    .rotate()
    .resize(1200, 1500, { fit: 'cover', position: 'centre' })
    .webp({ quality: 82 })
    .toBuffer()

  const hash = createHash('sha256').update(webp).digest('hex').slice(0, 10)
  const filename = `${exhibitionId}-${hash}.webp`
  const finalPath = join(EXHIBITIONS_DIR, filename)
  const tmpPath = `${finalPath}.tmp`
  await writeFile(tmpPath, webp)
  await rename(tmpPath, finalPath)
  return { filename }
}

export async function deleteExhibitionImage(filename: string | null | undefined): Promise<void> {
  if (!filename || !safeFilename(filename)) return
  try {
    await unlink(join(EXHIBITIONS_DIR, filename))
  }
  catch {
    // best effort — file may already be gone
  }
}

export function exhibitionImagePath(filename: string): string | null {
  if (!safeFilename(filename)) return null
  return join(EXHIBITIONS_DIR, filename)
}

export function isValidExhibitionFilename(filename: string): boolean {
  return safeFilename(filename)
}
