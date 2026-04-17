<script setup lang="ts">
import type { ExhibitionCard } from '#types/exhibition'

interface Props {
  /**
   * When true, skip the internal <section> wrapper + header.
   * Use when a parent section already provides the editorial title & spacing.
   */
  embedded?: boolean
}
withDefaults(defineProps<Props>(), { embedded: false })

const { t } = useI18n()
const tr = useTranslated()
const config = useRuntimeConfig()

const { data: cards } = await useAsyncData('exhibitions-public', () =>
  $fetch<ExhibitionCard[]>('/api/exhibitions'),
{ default: () => [] as ExhibitionCard[] },
)

const jsonLd = computed(() => {
  const siteUrl = config.public.siteUrl
  return (cards.value ?? []).map(c => ({
    '@context': 'https://schema.org',
    '@type': 'ExhibitionEvent',
    'name': tr(c.title),
    'description': tr(c.description),
    'image': c.imageUrl.startsWith('http') ? c.imageUrl : `${siteUrl}${c.imageUrl}`,
    'startDate': c.startDate,
    'endDate': c.endDate,
    'performer': { '@type': 'Person', 'name': c.artist },
    'location': {
      '@type': 'Place',
      'name': c.galleryName,
      'address': { '@type': 'PostalAddress', 'addressLocality': 'Donostia / San Sebastián', 'addressCountry': 'ES' },
    },
    ...(c.externalUrl ? { url: c.externalUrl } : {}),
  }))
})

function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, '\\u003c')
}

useHead(() => ({
  script: jsonLd.value.map(obj => ({
    type: 'application/ld+json',
    innerHTML: safeJsonLd(obj),
  })),
}))
</script>

<template>
  <div
    v-if="embedded"
    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12"
  >
    <GalleryExhibitionCard
      v-for="card in cards"
      :key="card.id"
      :card="card"
      class="reveal-on-scroll"
    />
  </div>
  <section v-else class="py-24 md:py-32 px-6 md:px-12 bg-edition-dark">
    <div class="max-w-[1400px] mx-auto">
      <div class="reveal-on-scroll mb-16 max-w-2xl">
        <p class="text-xs uppercase tracking-[0.2em] text-white/40 font-mono mb-3">
          29 > 31.05.2026
        </p>
        <h2 class="font-serif text-4xl md:text-5xl text-white leading-tight mb-5" style="font-weight: 400; letter-spacing: -0.02em;">
          {{ t('home.exhibitionsTitle') }}
        </h2>
        <p class="text-white/60 leading-relaxed">{{ t('home.exhibitionsSubtitle') }}</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12">
        <GalleryExhibitionCard
          v-for="card in cards"
          :key="card.id"
          :card="card"
          class="reveal-on-scroll"
        />
      </div>
    </div>
  </section>
</template>
