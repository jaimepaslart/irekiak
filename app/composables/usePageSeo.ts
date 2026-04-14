export function usePageSeo(key: string) {
  const { t } = useI18n()
  const title = t(`seo.${key}.title`)
  const description = t(`seo.${key}.description`)
  useSeoMeta({ title, description, ogTitle: title, ogDescription: description })
}
