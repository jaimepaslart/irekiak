<script setup lang="ts">
interface Props {
  eyebrow: string
  label: string
  value: number
  unit?: string
  progress?: number
  progressLabel?: string
  caption?: string
}

const props = withDefaults(defineProps<Props>(), {
  unit: '%',
  progress: undefined,
  progressLabel: undefined,
  caption: undefined,
})

const progressClamped = computed(() => {
  if (props.progress === undefined) return 0
  return Math.max(0, Math.min(100, props.progress))
})

const barTone = computed(() => {
  const p = progressClamped.value
  if (p >= 80) return 'var(--color-accent-gold)'
  if (p >= 40) return 'var(--color-accent-gold)'
  return 'var(--color-accent-gold)'
})
</script>

<template>
  <div class="relative overflow-hidden border border-white/10 bg-[var(--color-edition-dark)] rounded-sm p-7 md:p-8 editorial-in">
    <div class="absolute inset-y-0 left-0 w-[3px] bg-gold-soft"></div>
    <div class="eyebrow mb-4">
      {{ eyebrow }}
    </div>
    <div class="flex items-baseline gap-1 mb-1">
      <span class="font-serif text-5xl md:text-6xl text-white tabular-nums leading-none" style="font-weight: 400; letter-spacing: -0.02em;">
        {{ value }}
      </span>
      <span v-if="unit" class="text-xl md:text-2xl text-white/60 font-serif" style="font-weight: 400;">{{ unit }}</span>
    </div>
    <div class="text-sm text-white/60 mb-5">{{ label }}</div>

    <div v-if="progress !== undefined" class="space-y-2">
      <div class="h-[3px] w-full bg-white/10 overflow-hidden relative">
        <div
          class="h-full transition-[width] duration-700 ease-out"
          :style="{ width: `${progressClamped}%`, backgroundColor: barTone }"
        />
      </div>
      <div v-if="progressLabel" class="text-[11px] tabular-nums text-white/40 uppercase tracking-wider font-mono">
        {{ progressLabel }}
      </div>
    </div>
    <div v-if="caption" class="text-[11px] text-white/40 mt-3 italic font-serif">{{ caption }}</div>
  </div>
</template>
