/**
 * Cross-locale key audit for i18n/locales/*.json.
 * Exits 1 if any locale is missing keys present in the reference (eu).
 *
 * Usage: pnpm i18n:check
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const LOCALES_DIR = 'i18n/locales'
const REFERENCE = 'eu'

function flatten(obj: unknown, prefix = ''): Set<string> {
  const keys = new Set<string>()
  if (obj === null || typeof obj !== 'object') return keys
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      for (const sub of flatten(v, path)) keys.add(sub)
    }
    else {
      keys.add(path)
    }
  }
  return keys
}

const files = readdirSync(LOCALES_DIR).filter(f => f.endsWith('.json'))
const locales = new Map<string, Set<string>>()
for (const file of files) {
  const code = file.replace(/\.json$/, '')
  const raw = readFileSync(join(LOCALES_DIR, file), 'utf-8')
  locales.set(code, flatten(JSON.parse(raw)))
}

const reference = locales.get(REFERENCE)
if (!reference) {
  console.error(`[i18n:check] reference locale "${REFERENCE}" not found in ${LOCALES_DIR}`)
  process.exit(1)
}

let issues = 0
console.log(`[i18n:check] reference: ${REFERENCE} (${reference.size} keys)\n`)

for (const [code, keys] of locales) {
  if (code === REFERENCE) continue
  const missing = [...reference].filter(k => !keys.has(k))
  const extra = [...keys].filter(k => !reference.has(k))
  if (missing.length === 0 && extra.length === 0) {
    console.log(`✓ ${code} (${keys.size} keys, in sync)`)
    continue
  }
  issues++
  console.log(`✗ ${code} (${keys.size} keys)`)
  if (missing.length) console.log(`  missing (${missing.length}):`, missing.slice(0, 10).join(', ') + (missing.length > 10 ? `, …${missing.length - 10} more` : ''))
  if (extra.length) console.log(`  extra   (${extra.length}):`, extra.slice(0, 10).join(', ') + (extra.length > 10 ? `, …${extra.length - 10} more` : ''))
}

process.exit(issues > 0 ? 1 : 0)
