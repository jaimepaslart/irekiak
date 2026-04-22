import { eq, sql } from 'drizzle-orm'
import { db } from '../db'
import { appSettings } from '../db/schema'

const CACHE_MS = 30_000
interface CacheEntry { value: string, expiresAt: number }
const cache = new Map<string, CacheEntry>()

/**
 * Get a setting, returning the default if not set. Cached 30s.
 */
export function getSetting(key: string, defaultValue = ''): string {
  const cached = cache.get(key)
  const now = Date.now()
  if (cached && cached.expiresAt > now) return cached.value
  const row = db.select().from(appSettings).where(eq(appSettings.key, key)).get()
  const value = row?.value ?? defaultValue
  cache.set(key, { value, expiresAt: now + CACHE_MS })
  return value
}

export function getSettingBool(key: string, defaultValue = false): boolean {
  const v = getSetting(key, defaultValue ? '1' : '0')
  return v === '1' || v === 'true'
}

/**
 * Read a setting as JSON. Returns defaultValue if key is absent or value fails to parse.
 */
export function getSettingJson<T>(key: string, defaultValue: T): T {
  const raw = getSetting(key, '')
  if (!raw) return defaultValue
  try {
    return JSON.parse(raw) as T
  }
  catch {
    return defaultValue
  }
}

export function setSetting(key: string, value: string, actor: string): void {
  db.insert(appSettings)
    .values({ key, value, updatedBy: actor })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value, updatedBy: actor, updatedAt: sql`(datetime('now'))` },
    })
    .run()
  cache.delete(key)
}

/**
 * Read all settings at once (for admin UI).
 */
export function getAllSettings(): Record<string, string> {
  const rows = db.select().from(appSettings).all()
  const map: Record<string, string> = {}
  for (const r of rows) map[r.key] = r.value
  return map
}

export function invalidateSettingsCache(): void {
  cache.clear()
}
