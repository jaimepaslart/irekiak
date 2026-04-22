<script setup lang="ts">
import type { AnnouncementConfig, TranslatedText } from '~~/types/announcement'
import { renderBodyParagraphs } from '~/utils/announcement-render'
import { renderInlineBold } from '~/utils/markdown-inline'

interface Props {
  modelValue: AnnouncementConfig
  saving?: boolean
  saveSuccess?: boolean
  saveError?: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: AnnouncementConfig]
  'save': []
}>()

const { t } = useAdminT()

type Lang = keyof TranslatedText

const previewLang = ref<Lang>('es')
const previewId = useId()

function patch(partial: Partial<AnnouncementConfig>) {
  emit('update:modelValue', { ...props.modelValue, ...partial })
}

const previewTitle = computed(() => renderInlineBold(props.modelValue.title[previewLang.value] ?? ''))
const previewEyebrow = computed(() => props.modelValue.eyebrow[previewLang.value] ?? '')
const previewParagraphs = computed(() =>
  renderBodyParagraphs(props.modelValue.body, previewLang.value),
)

const enabledBinding = computed<boolean>({
  get: () => props.modelValue.enabled,
  set: (v: boolean) => patch({ enabled: v }),
})

const eyebrowBinding = computed<TranslatedText>({
  get: () => props.modelValue.eyebrow,
  set: v => patch({ eyebrow: v }),
})

const titleBinding = computed<TranslatedText>({
  get: () => props.modelValue.title,
  set: v => patch({ title: v }),
})

const bodyBinding = computed<TranslatedText>({
  get: () => props.modelValue.body,
  set: v => patch({ body: v }),
})
</script>

<template>
  <div class="space-y-8">
    <AdminToggleSetting
      v-model="enabledBinding"
      :heading="t('settings.announcementEnabled')"
      :description="t('settings.announcementEnabledDesc')"
    />

    <div class="pt-6 border-t border-white/5 space-y-7">
      <AdminI18nTextarea
        v-model="eyebrowBinding"
        :label="t('settings.announcementEyebrow')"
        :rows="1"
        :maxlength="80"
      />

      <AdminI18nTextarea
        v-model="titleBinding"
        :label="t('settings.announcementTitle')"
        :rows="2"
        :maxlength="160"
      />

      <AdminI18nTextarea
        v-model="bodyBinding"
        :label="t('settings.announcementBody')"
        :rows="14"
        :maxlength="4000"
        :help="t('settings.announcementBodyHelp')"
      />
    </div>

    <div class="pt-6 border-t border-white/5">
      <div class="flex items-baseline justify-between mb-4 gap-3">
        <p class="eyebrow">
          {{ t('settings.announcementPreviewEyebrow') }}
        </p>
        <AdminLanguageTabs v-model="previewLang" :controls-id="previewId" />
      </div>

      <div :id="previewId" class="rounded-sm border border-white/10 bg-[var(--color-edition-dark)] p-6 md:p-8">
        <p class="text-[11px] uppercase tracking-[0.22em] text-[var(--color-accent-gold)] font-mono font-semibold mb-5">
          {{ previewEyebrow || '—' }}
        </p>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <h3 class="text-2xl md:text-3xl text-white font-semibold leading-tight mb-6" style="letter-spacing: -0.01em;" v-html="previewTitle || '—'" />
        <div class="space-y-4 text-sm text-white/70 leading-relaxed">
          <!-- eslint-disable-next-line vue/no-v-html -->
          <p v-for="(html, i) in previewParagraphs" :key="i" v-html="html" />
          <p v-if="previewParagraphs.length === 0" class="italic text-white/30">
            —
          </p>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-end gap-4">
      <p v-if="saveSuccess" class="text-sm text-emerald-300/90 italic font-serif">
        ✓ {{ t('settings.announcementSaveSuccess') }}
      </p>
      <p v-else-if="saveError" class="text-sm text-red-300/90 italic font-serif">
        {{ saveError }}
      </p>
      <button
        type="button"
        :disabled="saving"
        class="inline-flex items-center gap-2 px-5 py-3 bg-[var(--color-accent-gold)] text-[var(--color-edition)] text-xs uppercase tracking-[0.18em] font-medium rounded-sm hover:bg-[var(--color-accent-gold)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-gold"
        @click="emit('save')"
      >
        <span
          v-if="saving"
          class="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"
          aria-hidden="true"
        />
        {{ t('common.save') }}
      </button>
    </div>
  </div>
</template>
