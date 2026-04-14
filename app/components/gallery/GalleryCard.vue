<script setup lang="ts">
import type { Gallery } from '#types/gallery'

defineProps<{
  gallery: Gallery
}>()

const tr = useTranslated()
const localePath = useLocalePath()
</script>

<template>
  <NuxtLink
    :to="localePath(`/galleries/${gallery.slug}`)"
    class="group block"
  >
    <div class="aspect-[4/5] overflow-hidden rounded-sm mb-4 border border-white/10 transition-all duration-400
                group-hover:scale-[1.03] group-hover:border-white/30">
      <img
        :src="gallery.image"
        :alt="gallery.name"
        loading="lazy"
        class="h-full w-full object-cover"
      >
    </div>

    <h3 class="text-sm font-medium text-white mb-1 group-hover:text-white transition-colors duration-200">
      {{ gallery.name }}
    </h3>
    <p class="text-xs text-white/50 line-clamp-2">
      {{ tr(gallery.description) }}
    </p>
  </NuxtLink>
</template>
