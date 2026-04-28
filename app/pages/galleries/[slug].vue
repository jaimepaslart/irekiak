<script setup lang="ts">
import type { Gallery } from '#types/gallery'
import { exhibitions } from '@data/exhibitions'

type GalleryView = Gallery & { imageUrl: string, logoUrl: string | null }

const { t } = useI18n()
const localePath = useLocalePath()
const tr = useTranslated()
const route = useRoute()

const slug = computed(() => String(route.params.slug ?? ''))

// Reads gallery from /api/galleries/[slug] which applies admin overrides on top of
// data/galleries.ts. Prerendered at build (snapshot of overrides at build time).
const { data: gallery } = await useAsyncData<GalleryView | null>(
  () => `gallery-${slug.value}`,
  () => $fetch<GalleryView>(`/api/galleries/${slug.value}`).catch(() => null),
  { default: () => null },
)

const galleryExhibitions = computed(() =>
  gallery.value
    ? exhibitions.filter(e => e.galleryId === gallery.value!.id)
    : [],
)

usePageSeo('galleries')
useScrollReveal()
</script>

<template>
  <div v-if="gallery">
    <!-- Hero -->
    <section class="relative h-[60vh] min-h-[400px] w-full overflow-hidden">
      <NuxtImg
        :src="gallery.image"
        :alt="gallery.name"
        class="absolute inset-0 w-full h-full object-cover"
        format="webp"
        quality="80"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div class="absolute bottom-0 left-0 right-0 px-6 md:px-12 pb-12">
        <div class="max-w-[1200px] mx-auto">
          <NuxtLink
            :to="localePath('/galleries')"
            class="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors mb-6"
          >
            &larr; {{ t('nav.galleries') }}
          </NuxtLink>
          <h1>{{ gallery.name }}</h1>
        </div>
      </div>
    </section>

    <!-- Logo banner (only when the gallery has a logo) -->
    <section
      v-if="gallery.logoUrl"
      class="border-y border-white/10 bg-[var(--color-edition-dark)] py-14 md:py-20"
    >
      <div class="max-w-[1200px] mx-auto px-6 md:px-12 flex items-center justify-center">
        <img
          :src="gallery.logoUrl"
          :alt="`${gallery.name} logo`"
          class="h-24 md:h-36 w-auto object-contain max-w-[280px] md:max-w-[360px]"
        >
      </div>
    </section>

    <!-- Content -->
    <section class="max-w-[1200px] mx-auto px-6 md:px-12 py-16 md:py-24">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
        <!-- Left column: gallery info -->
        <div class="reveal-on-scroll space-y-8">
          <div>
            <p class="text-xs uppercase tracking-[0.2em] text-white/40 font-mono mb-3">
              {{ t('gallery.address') }}
            </p>
            <p class="text-white text-lg">{{ gallery.address }}</p>
            <p class="text-white/70 text-sm">{{ gallery.city }}</p>
          </div>

          <div>
            <p class="text-xs uppercase tracking-[0.2em] text-white/40 font-mono mb-3">
              {{ t('gallery.openingHours') }}
            </p>
            <p class="text-white/70">{{ tr(gallery.openingHours) }}</p>
          </div>

          <div v-if="gallery.website" class="space-y-3">
            <p class="text-xs uppercase tracking-[0.2em] text-white/40 font-mono mb-3">
              Website
            </p>
            <a
              :href="gallery.website"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 text-white hover:text-white/80 transition-colors text-sm border-b border-white/15 pb-0.5"
            >
              {{ gallery.website.replace('https://', '') }}
              <span class="text-white/40">&nearr;</span>
            </a>
          </div>

          <div v-if="gallery.instagram" class="space-y-3">
            <p class="text-xs uppercase tracking-[0.2em] text-white/40 font-mono mb-3">
              Instagram
            </p>
            <a
              :href="`https://instagram.com/${gallery.instagram.replace('@', '')}`"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 text-white hover:text-white/80 transition-colors text-sm border-b border-white/15 pb-0.5"
            >
              {{ gallery.instagram }}
              <span class="text-white/40">&nearr;</span>
            </a>
          </div>

          <div class="pt-4">
            <p class="text-white/70 leading-relaxed">{{ tr(gallery.description) }}</p>
          </div>
        </div>

        <!-- Right column: exhibitions -->
        <div class="space-y-10">
          <div
            v-for="(exhibition, idx) in galleryExhibitions"
            :key="exhibition.id"
            class="reveal-on-scroll"
            :class="`stagger-${idx + 1}`"
          >
            <p class="text-xs uppercase tracking-[0.2em] text-white/40 font-mono mb-4">
              {{ t('gallery.exhibitions') }}
            </p>

            <h2 class="mb-6">{{ tr(exhibition.title) }}</h2>

            <!-- Artists -->
            <div v-if="exhibition.artists.length" class="space-y-4 mb-8">
              <div
                v-for="artist in exhibition.artists"
                :key="artist.name"
                class="p-5 border border-white/15 rounded-sm"
              >
                <p class="text-white font-semibold text-lg mb-2">{{ artist.name }}</p>
                <p class="text-white/60 text-sm leading-relaxed">{{ tr(artist.bio) }}</p>
              </div>
            </div>

            <!-- Description -->
            <p class="text-white/70 leading-relaxed mb-6">
              {{ tr(exhibition.description) }}
            </p>

            <!-- Medium -->
            <div class="flex items-center gap-3">
              <span class="text-xs uppercase tracking-[0.2em] text-white/40 font-mono">
                {{ t('gallery.medium') }}
              </span>
              <span class="text-white/60 text-sm">{{ tr(exhibition.medium) }}</span>
            </div>
          </div>

          <div v-if="!galleryExhibitions.length" class="reveal-on-scroll">
            <p class="text-white/40 text-sm">{{ t('gallery.noExhibitions') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Back link -->
    <section class="max-w-[1200px] mx-auto px-6 md:px-12 pb-24">
      <div class="reveal-on-scroll border-t border-white/15 pt-10">
        <NuxtLink
          :to="localePath('/galleries')"
          class="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
        >
          &larr; {{ t('nav.galleries') }}
        </NuxtLink>
      </div>
    </section>
  </div>

  <!-- Gallery not found -->
  <div v-else class="max-w-[1200px] mx-auto px-6 md:px-12 py-24 pt-28">
    <div class="text-center py-20">
      <p class="text-white/40 text-lg mb-6">{{ t('gallery.notFound') }}</p>
      <NuxtLink
        :to="localePath('/galleries')"
        class="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        &larr; {{ t('nav.galleries') }}
      </NuxtLink>
    </div>
  </div>
</template>
