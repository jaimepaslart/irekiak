<script setup lang="ts">
const partners = [
  'DAGGE',
  'Tabakalera',
  'DonostiKultura',
  'Donostia / San Sebastián',
  'San Telmo Museoa',
  'Kursaal',
  'Kutxa Fundazioa',
]
</script>

<template>
  <div class="flex flex-wrap items-center justify-center gap-8 md:gap-12">
    <span
      v-for="partner in partners"
      :key="partner"
      class="text-xs uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors duration-300"
    >
      {{ partner }}
    </span>
  </div>
</template>
