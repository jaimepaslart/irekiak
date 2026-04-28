<script setup lang="ts">
import type { Gallery } from '#types/gallery'

type GalleryView = Gallery & { imageUrl: string }

const { t } = useI18n()
const localePath = useLocalePath()

const { data: galleries } = await useAsyncData<GalleryView[]>(
  'galleries-list',
  () => $fetch<GalleryView[]>('/api/galleries'),
  { default: () => [] as GalleryView[] },
)

usePageSeo('galleries')
useScrollReveal()
</script>

<template>
  <div class="max-w-[1200px] mx-auto px-6 md:px-12 py-24 pt-28">
    <h1 class="text-center mb-16">
      {{ t('nav.galleries') }}
    </h1>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      <GalleryCard
        v-for="gallery in galleries"
        :key="gallery.id"
        :gallery="gallery"
        class="reveal-on-scroll"
      />
    </div>
  </div>
</template>
