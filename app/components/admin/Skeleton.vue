<script setup lang="ts">
defineProps<{
  variant?: 'card' | 'row' | 'text' | 'badge' | 'stat'
  count?: number
}>()
</script>

<template>
  <template v-if="variant === 'stat'">
    <div v-for="n in (count ?? 4)" :key="n" class="bg-edition-dark border border-white/10 rounded-sm p-6 animate-pulse">
      <div class="h-3 w-20 bg-white/10 rounded mb-3"></div>
      <div class="h-8 w-16 bg-white/15 rounded"></div>
    </div>
  </template>
  <template v-else-if="variant === 'row'">
    <div v-for="n in (count ?? 5)" :key="n" class="border-t border-white/5 px-4 py-3 flex items-center gap-4 animate-pulse">
      <div class="h-3 w-12 bg-white/10 rounded"></div>
      <div class="h-3 w-32 bg-white/10 rounded"></div>
      <div class="h-3 w-24 bg-white/10 rounded"></div>
      <div class="h-3 w-20 bg-white/10 rounded ml-auto"></div>
    </div>
  </template>
  <template v-else-if="variant === 'card'">
    <div v-for="n in (count ?? 3)" :key="n" class="bg-edition-dark border border-white/10 rounded-sm p-5 animate-pulse">
      <div class="h-4 w-1/3 bg-white/10 rounded mb-3"></div>
      <div class="h-3 w-2/3 bg-white/10 rounded mb-2"></div>
      <div class="h-3 w-1/2 bg-white/10 rounded"></div>
    </div>
  </template>
  <template v-else-if="variant === 'badge'">
    <span class="inline-block h-5 w-16 bg-white/10 rounded-full animate-pulse"></span>
  </template>
  <template v-else>
    <div class="h-4 w-32 bg-white/10 rounded animate-pulse"></div>
  </template>
</template>
