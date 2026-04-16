<script setup lang="ts">
interface ChipOption {
  value: string
  label: string
  count?: number
}

interface Props {
  modelValue: string
  options: ChipOption[]
  label?: string
  variant?: 'default' | 'gold'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
})
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function select(value: string): void {
  if (value !== props.modelValue) emit('update:modelValue', value)
}
</script>

<template>
  <div>
    <p
      v-if="label"
      class="text-xs uppercase tracking-wider text-white/40 font-mono mb-2"
    >
      {{ label }}
    </p>
    <div class="flex flex-wrap gap-2">
      <template v-if="variant === 'gold'">
        <button
          v-for="option in options"
          :key="option.value"
          type="button"
          :aria-pressed="modelValue === option.value"
          class="px-3 py-1.5 text-xs font-mono uppercase tracking-[0.14em] rounded-full border transition-colors"
          :class="modelValue === option.value
            ? 'bg-gold-soft text-gold border-gold-soft'
            : 'border-white/10 text-white/50 hover:text-white hover:border-white/25'"
          @click="select(option.value)"
        >
          {{ option.label }}<span
            v-if="option.count !== undefined"
            class="opacity-50 ml-1.5 tabular-nums"
          >{{ option.count }}</span>
        </button>
      </template>
      <template v-else>
        <button
          v-for="option in options"
          :key="option.value"
          type="button"
          :aria-pressed="modelValue === option.value"
          class="px-3 py-1.5 text-xs rounded-full border transition-colors"
          :class="modelValue === option.value
            ? 'bg-white text-[var(--color-edition)] border-white'
            : 'border-white/15 text-white/60 hover:text-white hover:bg-white/5'"
          @click="select(option.value)"
        >
          {{ option.label }}<span
            v-if="option.count !== undefined"
            class="opacity-50 ml-1"
          >{{ option.count }}</span>
        </button>
      </template>
    </div>
  </div>
</template>
