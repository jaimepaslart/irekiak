<script setup lang="ts">
interface Props {
  modelValue: boolean
  heading: string
  description?: string
  saving?: boolean
}

defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function toggle(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).checked)
}
</script>

<template>
  <div class="flex items-start justify-between gap-6">
    <div class="flex-1 min-w-0">
      <h2 class="font-serif text-2xl text-white" style="font-weight: 400; letter-spacing: -0.01em;">
        {{ heading }}
      </h2>
      <p
        v-if="description"
        class="font-serif italic text-sm text-white/55 mt-2"
      >
        {{ description }}
      </p>
    </div>
    <label class="relative inline-flex items-center cursor-pointer shrink-0 mt-2">
      <input
        :checked="modelValue"
        type="checkbox"
        class="sr-only peer"
        :disabled="saving"
        @change="toggle"
      >
      <div class="w-12 h-6 bg-white/10 peer-checked:bg-[var(--color-accent-gold)] rounded-full transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-accent-gold)]"></div>
      <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6 shadow-sm"></div>
    </label>
  </div>
</template>
