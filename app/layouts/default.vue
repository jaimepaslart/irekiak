<script setup lang="ts">
const { t, locale } = useI18n()
const route = useRoute()
const localeHead = useLocaleHead({ dir: true, lang: true, seo: true })

const SITE_URL = 'https://irekiak.eus'
const OG_IMAGE = `${SITE_URL}/logo-big.webp`

const canonical = computed(() => `${SITE_URL}${route.path}`)
const ogLocale = computed(() => ({ eu: 'eu_ES', es: 'es_ES', fr: 'fr_FR', en: 'en_US' }[locale.value] ?? 'eu_ES'))

useHead({
  htmlAttrs: {
    lang: () => localeHead.value.htmlAttrs?.lang,
    dir: () => localeHead.value.htmlAttrs?.dir,
  },
  link: [
    { rel: 'canonical', href: canonical },
    ...(localeHead.value.link ?? []),
  ],
  meta: [
    ...(localeHead.value.meta ?? []),
  ],
})

useSeoMeta({
  ogUrl: canonical,
  ogType: 'website',
  ogImage: OG_IMAGE,
  ogLocale,
  twitterCard: 'summary_large_image',
  twitterImage: OG_IMAGE,
})
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-[var(--color-edition)]"
    >
      {{ t('a11y.skipToContent') }}
    </a>

    <LayoutAppHeader />

    <main id="main-content" class="flex-1">
      <slot />
    </main>

    <LayoutAppFooter />
  </div>
</template>
