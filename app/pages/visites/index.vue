<script setup lang="ts">
import { tourRoutes } from '@data/tours'
import { galleries } from '@data/galleries'

const { t } = useI18n()
const localePath = useLocalePath()
const tr = useTranslated()

usePageSeo('tours')

function galleriesForRoute(galleryIds: string[]) {
  return galleries.filter(g => galleryIds.includes(g.id))
}
</script>

<template>
  <div class="max-w-[1200px] mx-auto px-6 md:px-12 py-24 pt-28">
    <!-- Title -->
    <div class="text-center mb-6">
      <h1>Bisita gidatuak / Visitas guiadas</h1>
    </div>

    <!-- Subtitle -->
    <p class="text-center text-white/70 mb-16 max-w-xl mx-auto">
      {{ t('common.free') }} &middot; 3 {{ t('tours.routes') }} &middot; {{ t('tours.maxGroup', { max: 12 }) }}
    </p>

    <!-- Route cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div
        v-for="route in tourRoutes"
        :key="route.id"
        class="border border-white/15 rounded-sm overflow-hidden
               transition-all duration-300 hover:border-white/30"
      >
        <!-- Color bar -->
        <div class="h-1 w-full" :style="{ backgroundColor: route.color }" />

        <div class="p-6">
          <!-- Route name -->
          <h3 class="text-lg font-semibold text-white mb-3">
            {{ tr(route.name) }}
          </h3>

          <!-- Description -->
          <p class="text-sm text-white/60 mb-5 line-clamp-3">
            {{ tr(route.description) }}
          </p>

          <!-- Gallery pills -->
          <div class="flex flex-wrap gap-2 mb-5">
            <span
              v-for="gallery in galleriesForRoute(route.galleryIds)"
              :key="gallery.id"
              class="inline-block px-2.5 py-1 text-xs text-white/70 border border-white/15 rounded-full"
            >
              {{ gallery.name }}
            </span>
          </div>

          <!-- Duration + distance -->
          <div class="flex gap-3 text-xs text-white/40 font-mono mb-6">
            <span>{{ tr(route.duration) }}</span>
            <span>&middot;</span>
            <span>{{ tr(route.distance) }}</span>
          </div>

          <!-- CTA button -->
          <NuxtLink
            :to="localePath(`/visites/${route.slug}`)"
            class="inline-block w-full text-center px-6 py-2.5 text-sm font-medium
                   bg-white text-[var(--color-edition)]
                   transition-all duration-300 hover:bg-white/90"
          >
            {{ t('common.register') }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
