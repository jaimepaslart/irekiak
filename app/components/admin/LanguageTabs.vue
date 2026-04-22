<script setup lang="ts">
import type { TranslatedText } from '~~/types/announcement'

interface Props {
  modelValue: keyof TranslatedText
  controlsId?: string
}

defineProps<Props>()
defineEmits<{
  'update:modelValue': [value: keyof TranslatedText]
}>()

const langs: { code: keyof TranslatedText, label: string }[] = [
  { code: 'eu', label: 'EU' },
  { code: 'es', label: 'ES' },
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
]
</script>

<template>
  <div
    class="inline-flex items-center gap-1 bg-white/5 rounded-full p-1"
    role="tablist"
  >
    <button
      v-for="l in langs"
      :key="l.code"
      type="button"
      role="tab"
      :aria-selected="modelValue === l.code"
      :aria-controls="controlsId"
      class="px-3 py-1 text-[11px] font-mono uppercase tracking-widest rounded-full transition-colors"
      :class="modelValue === l.code
        ? 'bg-[var(--color-accent-gold)] text-[var(--color-edition)]'
        : 'text-white/50 hover:text-white/80'"
      @click="$emit('update:modelValue', l.code)"
    >
      {{ l.label }}
    </button>
  </div>
</template>
