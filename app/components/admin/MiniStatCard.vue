<script setup lang="ts">
interface Props {
  eyebrow: string
  value?: string | number
  subtitle?: string
  delay?: number
}

withDefaults(defineProps<Props>(), {
  value: undefined,
  subtitle: undefined,
  delay: 0,
})
</script>

<template>
  <div
    class="relative flex flex-col h-full border border-white/10 bg-[var(--color-edition-dark)] rounded-sm p-5 editorial-in hover-lift"
    :style="{ animationDelay: `${delay}ms` }"
  >
    <div class="eyebrow mb-3">{{ eyebrow }}</div>
    <div v-if="value !== undefined" class="font-serif text-3xl text-white tabular-nums leading-none" style="font-weight: 400; letter-spacing: -0.01em;">
      {{ value }}
    </div>
    <div v-if="subtitle" class="text-xs text-white/45 mt-2 tabular-nums">{{ subtitle }}</div>
    <div v-if="$slots.default" class="mt-auto pt-5">
      <slot />
    </div>
  </div>
</template>
