<script setup lang="ts">
interface Props {
  label: string
  value: string | number
  subtitle?: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
})

const valueColorClass = computed(() => {
  switch (props.variant) {
    case 'success':
      return 'text-emerald-300'
    case 'warning':
      return 'text-orange-300'
    case 'danger':
      return 'text-red-300'
    default:
      return 'text-white'
  }
})
</script>

<template>
  <div class="bg-[var(--color-edition-dark)] border border-white/10 rounded-sm p-6">
    <div class="text-xs text-white/50 tracking-wider font-mono mb-2 uppercase">
      {{ label }}
    </div>
    <div class="text-3xl font-light" :class="valueColorClass">
      {{ value }}
    </div>
    <div v-if="subtitle" class="text-xs text-white/40 mt-2">
      {{ subtitle }}
    </div>
  </div>
</template>
