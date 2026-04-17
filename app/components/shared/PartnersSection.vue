<script setup lang="ts">
interface Props {
  layout?: 'row' | 'stack'
}
withDefaults(defineProps<Props>(), { layout: 'row' })

const partners = [
  'DAGGE',
  'Tabakalera',
  'DonostiKultura',
  'Donostia / San Sebastián',
  'San Telmo Museoa',
  'Kutxa Fundazioa',
]
</script>

<template>
  <div
    :class="layout === 'stack'
      ? 'flex flex-col items-start gap-3'
      : 'flex flex-wrap items-center justify-center gap-8 md:gap-12'"
  >
    <span
      v-for="partner in partners"
      :key="partner"
      class="text-xs uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors duration-300"
    >
      {{ partner }}
    </span>
  </div>
</template>
