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
const confirmOpen = ref(false)

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

function requestSend(): void {
  if (!frRequired.value) {
    errorMessage.value = subjectByLang.fr.trim().length === 0 ? t('blast.subjectMissingFr') : t('blast.messageMissingFr')
    return
  }
  errorMessage.value = null
  confirmOpen.value = true
}

async function send() {
  confirmOpen.value = false
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

interface ScopeOption {
  value: 'all' | 'date' | 'slot'
  eyebrow: string
  label: string
  hint: string
}

const scopeOptions = computed<ScopeOption[]>(() => [
  { value: 'all', eyebrow: 'A · TOUS', label: t('blast.scopeAll'), hint: t('blast.scopeAllHint') },
  { value: 'date', eyebrow: 'B · DATE', label: t('blast.scopeDate'), hint: t('blast.scopeDateHint') },
  { value: 'slot', eyebrow: 'C · CRÉNEAU', label: t('blast.scopeSlot'), hint: t('blast.scopeSlotHint') },
])
</script>

<template>
  <div class="relative">
    <div class="absolute inset-x-0 -top-10 -bottom-10 editorial-grain pointer-events-none opacity-60" aria-hidden="true"></div>

    <section class="relative mb-10 md:mb-12 editorial-in">
      <div class="eyebrow mb-4">{{ t('blast.eyebrow') }}</div>
      <h1 class="font-serif text-3xl md:text-4xl text-white" style="font-weight: 400; letter-spacing: -0.01em; line-height: 1.1;">
        {{ t('blast.title') }}
      </h1>
      <p class="mt-2 text-sm text-white/55 italic font-serif">
        {{ t('blast.heroSubtitle') }}
      </p>
      <div class="mt-6 h-px w-16 bg-[var(--color-accent-gold)] opacity-80"></div>
    </section>

    <form class="relative max-w-3xl space-y-10" @submit.prevent="requestSend">
      <section class="editorial-in" style="animation-delay: 60ms;">
        <div class="eyebrow mb-4">{{ t('blast.scopeTitle') }}</div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label
            v-for="opt in scopeOptions"
            :key="opt.value"
            class="group relative block cursor-pointer border rounded-sm px-4 py-4 transition-colors focus-within:border-gold"
            :class="scopeType === opt.value
              ? 'border-gold bg-gold-soft'
              : 'border-white/10 hover:border-white/25 hover:bg-white/[0.02]'"
          >
            <input
              v-model="scopeType"
              type="radio"
              :value="opt.value"
              class="sr-only"
            >
            <div class="eyebrow mb-2" :class="scopeType === opt.value ? 'text-gold' : 'text-white/40'">
              {{ opt.eyebrow }}
            </div>
            <div
              class="font-serif text-lg mb-1"
              :class="scopeType === opt.value ? 'text-white' : 'text-white/80'"
              style="font-weight: 400; letter-spacing: -0.01em;"
            >
              {{ opt.label }}
            </div>
            <div class="text-xs italic font-serif text-white/45 leading-snug">
              {{ opt.hint }}
            </div>
          </label>
        </div>

        <div v-if="scopeType === 'date'" class="mt-5">
          <select
            v-model="scopeDate"
            class="w-full md:w-auto bg-transparent border border-white/15 rounded-sm px-3 py-2 text-white text-sm focus:outline-none focus:border-gold transition-colors"
          >
            <option value="2026-05-30">{{ t('blast.scopeDateOptionSat') }}</option>
            <option value="2026-05-31">{{ t('blast.scopeDateOptionSun') }}</option>
          </select>
        </div>
        <div v-if="scopeType === 'slot'" class="mt-5">
          <input
            v-model="scopeSlotId"
            :placeholder="t('blast.scopeSlotPlaceholder')"
            class="w-full bg-transparent border border-white/15 rounded-sm px-3 py-2 text-white text-sm placeholder:italic placeholder:font-serif placeholder:text-white/30 focus:outline-none focus:border-gold transition-colors"
          >
        </div>
      </section>

      <section class="editorial-in" style="animation-delay: 120ms;">
        <div class="eyebrow mb-4">{{ t('blast.subjectTitle') }} <span class="text-gold ml-1">*</span></div>
        <div class="flex border-b border-white/10 mb-4">
          <button
            v-for="l in langs"
            :key="`subject-tab-${l}`"
            type="button"
            class="px-4 py-2 text-xs font-mono uppercase tracking-[0.18em] border-b-2 -mb-px transition-colors focus-gold"
            :class="subjectTab === l
              ? 'border-[var(--color-accent-gold)] text-gold'
              : 'border-transparent text-white/40 hover:text-white'"
            @click="subjectTab = l"
          >
            {{ langLabels[l] }}
            <span class="ml-1 text-[10px] italic font-serif normal-case tracking-normal text-white/40">
              ({{ tabState(subjectByLang[l], l) }})
            </span>
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
          class="w-full bg-transparent border border-white/15 rounded-sm px-3 py-3 text-white placeholder:italic placeholder:font-serif placeholder:text-white/30 focus:outline-none focus:border-gold transition-colors"
        >
      </section>

      <section class="editorial-in" style="animation-delay: 180ms;">
        <div class="eyebrow mb-4">{{ t('blast.messageTitle') }} <span class="text-gold ml-1">*</span></div>
        <div class="flex border-b border-white/10 mb-4">
          <button
            v-for="l in langs"
            :key="`message-tab-${l}`"
            type="button"
            class="px-4 py-2 text-xs font-mono uppercase tracking-[0.18em] border-b-2 -mb-px transition-colors focus-gold"
            :class="messageTab === l
              ? 'border-[var(--color-accent-gold)] text-gold'
              : 'border-transparent text-white/40 hover:text-white'"
            @click="messageTab = l"
          >
            {{ langLabels[l] }}
            <span class="ml-1 text-[10px] italic font-serif normal-case tracking-normal text-white/40">
              ({{ tabState(messageByLang[l], l) }})
            </span>
          </button>
        </div>
        <textarea
          v-for="l in langs"
          v-show="messageTab === l"
          :key="`message-textarea-${l}`"
          v-model="messageByLang[l]"
          rows="6"
          maxlength="5000"
          :required="l === 'fr'"
          :placeholder="l === 'fr' ? t('blast.messagePlaceholder') : ''"
          class="w-full bg-transparent border border-white/15 rounded-sm px-3 py-3 text-white font-serif text-[15px] leading-relaxed placeholder:italic placeholder:font-serif placeholder:text-white/30 focus:outline-none focus:border-gold transition-colors resize-y"
        />
        <p class="mt-3 text-sm italic font-serif text-white/40 flex items-start gap-2">
          <span class="text-gold shrink-0 mt-0.5" aria-hidden="true">◆</span>
          <span>{{ t('blast.languageTabHint') }}</span>
        </p>
        <p class="mt-2 text-sm italic font-serif text-white/40 flex items-start gap-2">
          <span class="text-gold shrink-0 mt-0.5" aria-hidden="true">◆</span>
          <span>{{ t('blast.formatHint') }}</span>
        </p>
      </section>

      <div v-if="errorMessage || result" class="editorial-in">
        <p v-if="errorMessage" class="text-sm italic font-serif text-red-300">{{ errorMessage }}</p>
        <p v-if="result" class="text-sm italic font-serif text-emerald-300">
          {{ t('blast.successMessage', { sent: result.sent, failed: result.failed }) }}
        </p>
      </div>

      <div class="flex justify-end editorial-in" style="animation-delay: 240ms;">
        <button
          type="submit"
          :disabled="!frRequired || sending"
          class="inline-flex items-center gap-2 px-8 py-3 bg-[var(--color-accent-gold)] text-[var(--color-edition)] font-medium text-sm uppercase tracking-[0.18em] rounded-sm hover:bg-[var(--color-accent-gold)]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-gold"
        >
          <span
            v-if="sending"
            class="inline-block w-4 h-4 border border-current border-t-transparent rounded-full animate-spin"
            aria-hidden="true"
          />
          {{ t('blast.submitSend') }}
        </button>
      </div>
    </form>

    <Transition name="fade">
      <div
        v-if="confirmOpen"
        class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm px-6"
        @click.self="confirmOpen = false"
      >
        <div class="max-w-md w-full bg-[var(--color-edition)] border border-white/15 rounded-sm p-8 editorial-in">
          <div class="eyebrow mb-3">{{ t('blast.eyebrow') }}</div>
          <h2 class="font-serif text-2xl text-white mb-2" style="font-weight: 400; letter-spacing: -0.01em;">
            {{ t('blast.submitConfirmTitle') }}
          </h2>
          <p class="text-sm italic font-serif text-white/60 mb-8">
            {{ t('blast.submitConfirmDesc', { count: '…' }) }}
          </p>
          <div class="flex justify-end gap-3">
            <button
              type="button"
              class="px-5 py-2.5 text-sm text-white/60 hover:text-white uppercase tracking-[0.18em] font-mono transition-colors focus-gold"
              @click="confirmOpen = false"
            >
              {{ t('blast.submitConfirmNo') }}
            </button>
            <button
              type="button"
              class="px-6 py-2.5 bg-[var(--color-accent-gold)] text-[var(--color-edition)] font-medium text-sm uppercase tracking-[0.18em] rounded-sm hover:bg-[var(--color-accent-gold)]/90 transition-colors focus-gold"
              @click="send"
            >
              {{ t('blast.submitConfirmYes') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 200ms ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
