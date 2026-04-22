export interface TranslatedText {
  eu: string
  es: string
  fr: string
  en: string
}

export interface AnnouncementConfig {
  enabled: boolean
  eyebrow: TranslatedText
  title: TranslatedText
  /** Multi-paragraph body. Paragraphs are separated by a blank line (\n\n) at render time. */
  body: TranslatedText
}

export interface PublicSettings {
  announcement: AnnouncementConfig | null
}

const EMPTY_TRANSLATED: TranslatedText = { eu: '', es: '', fr: '', en: '' }

interface LegacyAnnouncement {
  enabled?: boolean
  eyebrow?: Partial<TranslatedText>
  title?: Partial<TranslatedText>
  body?: Partial<TranslatedText>
  paragraphs?: Partial<TranslatedText>[]
}

function fillTranslated(value: Partial<TranslatedText> | undefined): TranslatedText {
  return { ...EMPTY_TRANSLATED, ...(value ?? {}) }
}

/**
 * Accepts both the current format (`body: TranslatedText`) and the legacy one
 * (`paragraphs: TranslatedText[]`). Joins legacy paragraphs with a blank line
 * so they render identically to a freshly authored body. Tolerant to missing
 * locales so a half-filled DB row does not crash render.
 */
export function normalizeAnnouncement(raw: unknown): AnnouncementConfig {
  const input = (raw ?? {}) as LegacyAnnouncement

  let body: TranslatedText
  if (input.body) {
    body = fillTranslated(input.body)
  }
  else if (input.paragraphs && input.paragraphs.length > 0) {
    const langs: (keyof TranslatedText)[] = ['eu', 'es', 'fr', 'en']
    const joined = {} as TranslatedText
    for (const lang of langs) {
      joined[lang] = input.paragraphs
        .map(p => p?.[lang]?.trim() ?? '')
        .filter(Boolean)
        .join('\n\n')
    }
    body = joined
  }
  else {
    body = { ...EMPTY_TRANSLATED }
  }

  return {
    enabled: input.enabled ?? false,
    eyebrow: fillTranslated(input.eyebrow),
    title: fillTranslated(input.title),
    body,
  }
}
