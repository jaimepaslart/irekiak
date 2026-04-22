<script setup lang="ts">
import type { TranslatedText } from '~~/types/announcement'

interface Props {
  modelValue: TranslatedText
  label: string
  help?: string
  rows?: number
  placeholder?: string
  maxlength?: number
}

const props = withDefaults(defineProps<Props>(), {
  rows: 3,
  maxlength: 2000,
  help: undefined,
  placeholder: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: TranslatedText]
}>()

type Lang = keyof TranslatedText

const active = ref<Lang>('es')
const textareaId = useId()

function update(lang: Lang, value: string) {
  emit('update:modelValue', { ...props.modelValue, [lang]: value })
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-baseline justify-between gap-3">
      <label :for="textareaId" class="font-serif text-lg text-white" style="font-weight: 400; letter-spacing: -0.005em;">
        {{ label }}
      </label>
      <AdminLanguageTabs v-model="active" :controls-id="textareaId" />
    </div>

    <textarea
      :id="textareaId"
      :value="modelValue[active]"
      :rows="rows"
      :maxlength="maxlength"
      :placeholder="placeholder"
      class="w-full px-4 py-3 text-sm bg-white/10 border border-white/15 rounded-sm text-white placeholder-white/30 focus:outline-none focus:border-white/40 transition-colors resize-y font-mono"
      @input="update(active, ($event.target as HTMLTextAreaElement).value)"
    />

    <div class="flex items-center justify-between text-[11px] font-mono text-white/35">
      <p v-if="help" class="italic font-serif text-xs text-white/45">
        {{ help }}
      </p>
      <span class="tabular-nums ml-auto">
        {{ modelValue[active].length }} / {{ maxlength }}
      </span>
    </div>
  </div>
</template>
