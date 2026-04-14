<script setup lang="ts">
const { t } = useI18n()

const tickerText = '++ Ven 12 SEPT 17:00-20:00 | Sam 13 SEPT 11:00-19:00 | Dim 14 SEPT 11:00-14:00 | Tabakalera : Jeu-Dim 11:00-13:00, 16:00-20:00 | Kursaal : Ven-Lun 20:30 ++'
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
