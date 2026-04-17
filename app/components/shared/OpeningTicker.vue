<script setup lang="ts">
import { currentEdition } from '@data/editions'

const dayLabelsFr: Record<string, string> = {
  friday: 'Ven',
  saturday: 'Sam',
  sunday: 'Dim',
}

const monthShort = 'MAI'

const tickerText = computed(() => {
  const parts = currentEdition.days.map((d) => {
    const label = dayLabelsFr[d.id] ?? d.id
    const dayNum = d.date.split('-')[2]
    return `${label} ${dayNum} ${monthShort} ${d.hours}`
  })
  return `++ ${parts.join(' | ')} ++`
})
</script>

<template>
  <div class="bg-white overflow-hidden whitespace-nowrap" aria-label="Opening hours">
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
