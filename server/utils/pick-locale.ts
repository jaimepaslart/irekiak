export type Language = 'eu' | 'es' | 'fr' | 'en'

/**
 * Picks the localized `name*` column of a tourRoute row based on language.
 * Falls back to English if language is unknown.
 */
export function pickRouteName(
  route: { nameEu: string, nameEs: string, nameFr: string, nameEn: string },
  lang: Language | string,
): string {
  if (lang === 'eu') return route.nameEu
  if (lang === 'es') return route.nameEs
  if (lang === 'fr') return route.nameFr
  return route.nameEn
}

export function isLanguage(value: string): value is Language {
  return value === 'eu' || value === 'es' || value === 'fr' || value === 'en'
}

export function coerceLanguage(value: string, fallback: Language = 'en'): Language {
  return isLanguage(value) ? value : fallback
}
