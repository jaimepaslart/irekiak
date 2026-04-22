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
  paragraphs: TranslatedText[]
}

export interface PublicSettings {
  announcement: AnnouncementConfig | null
}
