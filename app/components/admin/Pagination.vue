<script setup lang="ts">
interface Props {
  modelValue: number
  totalPages: number
  label: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

function prev() {
  if (props.modelValue > 1) emit('update:modelValue', props.modelValue - 1)
}
function next() {
  if (props.modelValue < props.totalPages) emit('update:modelValue', props.modelValue + 1)
}
</script>

<template>
  <div class="flex items-center gap-4">
    <button
      type="button"
      class="arrow-nudge-parent text-gold text-sm uppercase tracking-[0.18em] font-mono disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-gold"
      :disabled="modelValue <= 1"
      @click="prev"
    >
      <span class="arrow-nudge inline-block mr-1">←</span>
    </button>
    <span class="font-serif italic text-sm text-white/60 tabular-nums">
      {{ label }}
    </span>
    <button
      type="button"
      class="arrow-nudge-parent text-gold text-sm uppercase tracking-[0.18em] font-mono disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-gold"
      :disabled="modelValue >= totalPages"
      @click="next"
    >
      <span class="arrow-nudge inline-block ml-1">→</span>
    </button>
  </div>
</template>
