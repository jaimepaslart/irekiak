<script setup lang="ts">
import type { Gallery } from '#types/gallery'

defineProps<{
  galleries: Gallery[]
}>()

const localePath = useLocalePath()
</script>

<template>
  <div class="flex flex-wrap gap-3 justify-center">
    <NuxtLink
      v-for="gallery in galleries"
      :key="gallery.id"
      :to="localePath(`/galleries/${gallery.slug}`)"
      class="px-5 py-2.5 border border-white/40 text-xs uppercase tracking-widest text-white
             transition-all duration-300
             hover:bg-white hover:text-[var(--color-edition)] hover:border-white"
    >
      {{ gallery.name }}
    </NuxtLink>
  </div>
</template>
