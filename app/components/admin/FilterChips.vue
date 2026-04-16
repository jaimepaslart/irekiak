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
}

const props = defineProps<Props>()
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
    </div>
  </div>
</template>
