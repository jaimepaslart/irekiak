<script setup lang="ts">
const { t, locale } = useI18n()

const tickerText = computed(() => {
  // Re-read on locale change
  void locale.value
  const segments = [
    t('ticker.friday'),
    t('ticker.saturday'),
    t('ticker.sunday'),
    t('ticker.tagline'),
  ]
  return `++  ${segments.join('  ·  ')}  ++`
})
</script>

<template>
  <div class="bg-white overflow-hidden whitespace-nowrap" :aria-label="t('ticker.ariaLabel')">
    <div class="ticker-track inline-flex">
      <span v-for="i in 4" :key="i" class="inline-block px-8 text-xs font-mono tracking-wider text-[var(--color-edition)] py-2">
        {{ tickerText }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.ticker-track {
  animation: ticker 30s linear infinite;
}

.ticker-track:hover {
  animation-play-state: paused;
}

@keyframes ticker {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
</style>
