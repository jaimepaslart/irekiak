<script setup lang="ts">
type Lang = 'eu' | 'es' | 'fr' | 'en'

definePageMeta({ layout: 'admin', i18n: false })
useSeoMeta({ title: 'Admin · Blast email', robots: 'noindex, nofollow' })

const { t } = useAdminT()
const token = inject<Ref<string>>('adminToken')!

const langs: Lang[] = ['eu', 'es', 'fr', 'en']
const langLabels: Record<Lang, string> = { eu: 'EU', es: 'ES', fr: 'FR', en: 'EN' }

const scopeType = ref<'all' | 'date' | 'slot'>('all')
const scopeDate = ref<'2026-05-30' | '2026-05-31'>('2026-05-30')
const scopeSlotId = ref('')

const subjectByLang = reactive<Record<Lang, string>>({ eu: '', es: '', fr: '', en: '' })
const messageByLang = reactive<Record<Lang, string>>({ eu: '', es: '', fr: '', en: '' })

const subjectTab = ref<Lang>('fr')
const messageTab = ref<Lang>('fr')

const sending = ref(false)
const result = ref<{ ok: boolean, recipients: number, sent: number, failed: number } | null>(null)
const errorMessage = ref<string | null>(null)

const frRequired = computed(() => subjectByLang.fr.trim().length > 0 && messageByLang.fr.trim().length > 0)

function tabState(value: string, lang: Lang): string {
  if (lang === 'fr') return t('blast.tabFallback')
  return value.trim().length > 0 ? t('blast.tabFilled') : t('blast.tabEmpty')
}

function buildPayloadDict(source: Record<Lang, string>): Record<Lang, string | undefined> & { fr: string } {
  const payload: Record<Lang, string | undefined> & { fr: string } = { eu: undefined, es: undefined, fr: source.fr.trim(), en: undefined }
  for (const l of ['eu', 'es', 'en'] as const) {
    const v = source[l].trim()
    if (v.length > 0) payload[l] = v
  }
  return payload
}

async function send() {
  if (!frRequired.value) {
    errorMessage.value = subjectByLang.fr.trim().length === 0 ? t('blast.subjectMissingFr') : t('blast.messageMissingFr')
    return
  }
  if (!confirm(t('blast.submitConfirmTitle'))) return
  sending.value = true
  errorMessage.value = null
  result.value = null
  try {
    const scope = scopeType.value === 'all'
      ? { type: 'all' }
      : scopeType.value === 'date'
        ? { type: 'date', date: scopeDate.value }
        : { type: 'slot', slotId: scopeSlotId.value }
    result.value = await $fetch<{ ok: boolean, recipients: number, sent: number, failed: number }>('/api/admin/blast', {
      method: 'POST',
      headers: { 'x-admin-token': token.value, 'Content-Type': 'application/json' },
      body: {
        scope,
        subject: buildPayloadDict(subjectByLang),
        message: buildPayloadDict(messageByLang),
      },
    })
  }
  catch (err: unknown) {
    errorMessage.value = (err as { statusMessage?: string })?.statusMessage ?? t('common.error')
  }
  finally { sending.value = false }
}
</script>

<template>
  <div>
    <AdminPageHeader :title="t('blast.title')" :subtitle="t('blast.subtitle')" />

    <form class="max-w-2xl bg-edition-dark border border-white/10 rounded-sm p-6 space-y-5" @submit.prevent="send">
      <div>
        <label class="text-xs uppercase tracking-wider text-white/40 block mb-2">{{ t('blast.scopeLabel') }}</label>
        <div class="flex gap-3 mb-3">
          <label class="flex items-center gap-2 text-sm">
            <input v-model="scopeType" type="radio" value="all" class="accent-white">
            {{ t('blast.scopeAll') }}
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input v-model="scopeType" type="radio" value="date" class="accent-white">
            {{ t('blast.scopeDate') }}
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input v-model="scopeType" type="radio" value="slot" class="accent-white">
            {{ t('blast.scopeSlot') }}
          </label>
        </div>
        <select v-if="scopeType === 'date'" v-model="scopeDate" class="bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white text-sm">
          <option value="2026-05-30">{{ t('blast.scopeDateOptionSat') }}</option>
          <option value="2026-05-31">{{ t('blast.scopeDateOptionSun') }}</option>
        </select>
        <input v-if="scopeType === 'slot'" v-model="scopeSlotId" :placeholder="t('blast.scopeSlotPlaceholder')" class="bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white text-sm w-full">
      </div>

      <div>
        <span class="text-xs uppercase tracking-wider text-white/40 block mb-2">{{ t('blast.subjectLabel') }} *</span>
        <div class="flex border-b border-white/10 mb-3">
          <button
            v-for="l in langs"
            :key="`subject-tab-${l}`"
            type="button"
            class="px-4 py-2 text-xs font-mono uppercase tracking-wider border-b-2 -mb-px transition-colors hover:text-white hover:bg-white/5"
            :class="subjectTab === l ? 'border-white text-white' : 'border-transparent text-white/50'"
            @click="subjectTab = l"
          >
            {{ langLabels[l] }}
            <span class="ml-1 text-[10px] text-white/40 normal-case">({{ tabState(subjectByLang[l], l) }})</span>
          </button>
        </div>
        <input
          v-for="l in langs"
          v-show="subjectTab === l"
          :key="`subject-input-${l}`"
          v-model="subjectByLang[l]"
          type="text"
          maxlength="200"
          :required="l === 'fr'"
          class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white"
        >
      </div>

      <div>
        <span class="text-xs uppercase tracking-wider text-white/40 block mb-2">{{ t('blast.messageLabel') }} *</span>
        <div class="flex border-b border-white/10 mb-3">
          <button
            v-for="l in langs"
            :key="`message-tab-${l}`"
            type="button"
            class="px-4 py-2 text-xs font-mono uppercase tracking-wider border-b-2 -mb-px transition-colors hover:text-white hover:bg-white/5"
            :class="messageTab === l ? 'border-white text-white' : 'border-transparent text-white/50'"
            @click="messageTab = l"
          >
            {{ langLabels[l] }}
            <span class="ml-1 text-[10px] text-white/40 normal-case">({{ tabState(messageByLang[l], l) }})</span>
          </button>
        </div>
        <textarea
          v-for="l in langs"
          v-show="messageTab === l"
          :key="`message-textarea-${l}`"
          v-model="messageByLang[l]"
          rows="10"
          maxlength="5000"
          :required="l === 'fr'"
          :placeholder="l === 'fr' ? t('blast.messagePlaceholder') : ''"
          class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white font-mono text-sm"
        />
        <p class="text-xs text-white/40 mt-2">{{ t('blast.languageTabHint') }}</p>
        <p class="text-xs text-white/40 mt-1">{{ t('blast.formatHint') }}</p>
      </div>

      <p v-if="errorMessage" class="text-sm text-red-300">{{ errorMessage }}</p>
      <div v-if="result" class="bg-emerald-500/10 border border-emerald-500/30 rounded-sm p-4 text-sm">
        {{ t('blast.successMessage', { sent: result.sent, failed: result.failed }) }}
      </div>

      <div class="flex gap-3 justify-end">
        <AdminBaseButton type="submit" :loading="sending" :disabled="!frRequired">
          {{ t('blast.submitSend') }}
        </AdminBaseButton>
      </div>
    </form>
  </div>
</template>
