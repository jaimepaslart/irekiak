import type { TranslatedText, SupportedLocale } from '#types/common'

export function useTranslated() {
  const { locale } = useI18n()
  return (text: TranslatedText): string => {
    return text[locale.value as SupportedLocale] ?? text.eu
  }
}
