<script setup lang="ts">
const { t, locale } = useI18n()
const route = useRoute()

const SITE_URL = 'https://irekiak.eus'
const OG_IMAGE = `${SITE_URL}/images/og/irekiak-og-default.jpg`

const canonical = computed(() => `${SITE_URL}${route.path}`)
const ogLocale = computed(() => ({ eu: 'eu_ES', es: 'es_ES', fr: 'fr_FR', en: 'en_US' }[locale.value] ?? 'eu_ES'))

useHead({
  link: [
    { rel: 'canonical', href: canonical },
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
