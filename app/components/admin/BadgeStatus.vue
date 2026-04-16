<script setup lang="ts">
type Status = 'confirmed' | 'cancelled' | 'waitlist' | 'pending'

interface Props {
  status: Status
  label?: string
}

const props = defineProps<Props>()

const colorClass = computed(() => {
  switch (props.status) {
    case 'confirmed':
      return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
    case 'cancelled':
      return 'text-red-300 bg-red-500/10 border-red-500/30'
    case 'waitlist':
      return 'text-orange-300 bg-orange-500/10 border-orange-500/30'
    case 'pending':
      return 'text-white/70 bg-white/5 border-white/15'
    default:
      return 'text-white/70 bg-white/5 border-white/15'
  }
})

const displayLabel = computed(() => {
  if (props.label) return props.label
  return props.status.charAt(0).toUpperCase() + props.status.slice(1)
})
</script>

<template>
  <span
    class="inline-block text-xs px-2 py-0.5 rounded-full border font-mono uppercase tracking-wider"
    :class="colorClass"
  >
    {{ displayLabel }}
  </span>
</template>
