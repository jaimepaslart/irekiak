<script setup lang="ts">
import type { Ref } from 'vue'
import type { ExhibitionCard } from '#types/exhibition'

interface OverrideRow {
  exhibitionId: string
  artistName: string | null
  titleEu: string | null
  titleEs: string | null
  titleFr: string | null
  titleEn: string | null
  descriptionEu: string | null
  descriptionEs: string | null
  descriptionFr: string | null
  descriptionEn: string | null
  externalUrl: string | null
  imageFilename: string | null
}

type Locale = 'eu' | 'es' | 'fr' | 'en'

definePageMeta({ layout: 'admin', i18n: false })
useSeoMeta({ title: 'Admin · Exhibition editor', robots: 'noindex, nofollow' })

const { t } = useAdminT()
const route = useRoute()
const router = useRouter()
const token = inject<Ref<string>>('adminToken')!

const id = computed(() => String(route.params.id ?? ''))
const card = ref<ExhibitionCard | null>(null)
const override = ref<OverrideRow | null>(null)
const loading = ref(true)
const errorMessage = ref<string | null>(null)
const saving = ref(false)
const uploading = ref(false)
const activeLocale = ref<Locale>('fr')
const feedback = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const dragActive = ref(false)

interface Form {
  artistName: string
  titleEu: string
  titleEs: string
  titleFr: string
  titleEn: string
  descriptionEu: string
  descriptionEs: string
  descriptionFr: string
  descriptionEn: string
  externalUrl: string
}

const form = reactive<Form>({
  artistName: '',
  titleEu: '',
  titleEs: '',
  titleFr: '',
  titleEn: '',
  descriptionEu: '',
  descriptionEs: '',
  descriptionFr: '',
  descriptionEn: '',
  externalUrl: '',
})

async function load() {
  loading.value = true
  errorMessage.value = null
  try {
    const res = await $fetch<{ card: ExhibitionCard, override: OverrideRow | null }>(
      `/api/admin/exhibitions/${id.value}`,
      { headers: { 'x-admin-token': token.value } },
    )
    card.value = res.card
    override.value = res.override
    form.artistName = res.override?.artistName ?? res.card.artist
    form.titleEu = res.override?.titleEu ?? res.card.title.eu
    form.titleEs = res.override?.titleEs ?? res.card.title.es
    form.titleFr = res.override?.titleFr ?? res.card.title.fr
    form.titleEn = res.override?.titleEn ?? res.card.title.en
    form.descriptionEu = res.override?.descriptionEu ?? res.card.description.eu
    form.descriptionEs = res.override?.descriptionEs ?? res.card.description.es
    form.descriptionFr = res.override?.descriptionFr ?? res.card.description.fr
    form.descriptionEn = res.override?.descriptionEn ?? res.card.description.en
    form.externalUrl = res.override?.externalUrl ?? res.card.externalUrl ?? ''
  }
  catch (err: unknown) {
    errorMessage.value = (err as { statusMessage?: string })?.statusMessage ?? t('exhibitions.loadFailed')
  }
  finally { loading.value = false }
}

onMounted(() => { void load() })

function showFeedback(msg: string) {
  feedback.value = msg
  window.setTimeout(() => {
    if (feedback.value === msg) feedback.value = null
  }, 3000)
}

async function save() {
  if (!card.value) return
  saving.value = true
  try {
    await $fetch(`/api/admin/exhibitions/${id.value}`, {
      method: 'POST',
      headers: { 'x-admin-token': token.value, 'Content-Type': 'application/json' },
      body: {
        artistName: form.artistName || null,
        titleEu: form.titleEu || null,
        titleEs: form.titleEs || null,
        titleFr: form.titleFr || null,
        titleEn: form.titleEn || null,
        descriptionEu: form.descriptionEu || null,
        descriptionEs: form.descriptionEs || null,
        descriptionFr: form.descriptionFr || null,
        descriptionEn: form.descriptionEn || null,
        externalUrl: form.externalUrl || null,
      },
    })
    showFeedback(t('exhibitions.feedback.saved'))
    await load()
  }
  catch (err: unknown) {
    const msg = (err as { statusMessage?: string })?.statusMessage ?? t('exhibitions.saveFailed')
    alert(msg)
  }
  finally { saving.value = false }
}

async function uploadFile(file: File) {
  if (!card.value) return
  uploading.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    await $fetch(`/api/admin/exhibitions/${id.value}/image`, {
      method: 'POST',
      headers: { 'x-admin-token': token.value },
      body: fd,
    })
    showFeedback(t('exhibitions.feedback.imageUploaded'))
    await load()
  }
  catch (err: unknown) {
    const msg = (err as { statusMessage?: string })?.statusMessage ?? t('exhibitions.feedback.imageFailed')
    alert(msg)
  }
  finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

async function removeImage() {
  if (!card.value) return
  uploading.value = true
  try {
    await $fetch(`/api/admin/exhibitions/${id.value}/image`, {
      method: 'DELETE',
      headers: { 'x-admin-token': token.value },
    })
    showFeedback(t('exhibitions.feedback.imageRemoved'))
    await load()
  }
  catch (err: unknown) {
    const msg = (err as { statusMessage?: string })?.statusMessage ?? t('exhibitions.feedback.imageFailed')
    alert(msg)
  }
  finally { uploading.value = false }
}

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) void uploadFile(file)
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  dragActive.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) void uploadFile(file)
}

function restoreTitle() { if (card.value) form[`title${capitalise(activeLocale.value)}` as keyof Form] = card.value.title[activeLocale.value] }
function restoreDescription() { if (card.value) form[`description${capitalise(activeLocale.value)}` as keyof Form] = card.value.description[activeLocale.value] }
function restoreArtist() { if (card.value) form.artistName = card.value.artist }
function restoreUrl() { if (card.value) form.externalUrl = card.value.externalUrl ?? '' }

function capitalise<T extends string>(s: T): Capitalize<T> {
  return (s.charAt(0).toUpperCase() + s.slice(1)) as Capitalize<T>
}

const titleKey = computed(() => `title${capitalise(activeLocale.value)}` as keyof Form)
const descriptionKey = computed(() => `description${capitalise(activeLocale.value)}` as keyof Form)

const previewParagraphs = computed(() => {
  const raw = form[descriptionKey.value] || ''
  return raw.split(/\n\n+/).map(p => p.trim()).filter(Boolean)
})
const previewTitle = computed(() => form[titleKey.value] || '')
</script>

<template>
  <div class="relative max-w-6xl mx-auto">
    <AdminGrain />

    <button
      type="button"
      class="relative inline-flex items-center text-xs text-white/50 hover:text-gold font-mono uppercase tracking-[0.18em] transition-colors mb-6 arrow-nudge-parent"
      @click="router.push('/admin/exhibitions')"
    >
      <span class="arrow-nudge-back mr-1">←</span> {{ t('exhibitions.actions.backToList') }}
    </button>

    <AdminHeroSection
      v-if="card"
      :eyebrow="t('exhibitions.cardEyebrow', { num: card.number, gallery: card.galleryName.toUpperCase() })"
      :title="t('exhibitions.editTitle')"
      :subtitle="t('exhibitions.editSubtitle')"
    />

    <p v-if="errorMessage" class="text-sm text-red-300 italic font-serif mb-6">
      {{ errorMessage }}
    </p>

    <div v-if="loading && !card" class="space-y-4">
      <AdminSkeleton variant="card" :count="3" />
    </div>

    <div v-else-if="card" class="grid grid-cols-1 lg:grid-cols-5 gap-8">
      <!-- Form -->
      <div class="lg:col-span-3 space-y-8">
        <!-- Image -->
        <section>
          <div class="eyebrow mb-3">{{ t('exhibitions.fieldImage') }}</div>
          <div
            class="relative overflow-hidden border rounded-sm transition-colors"
            :class="dragActive ? 'border-gold bg-gold-soft/20' : 'border-white/10 bg-[var(--color-edition-dark)]'"
            @dragover.prevent="dragActive = true"
            @dragleave.prevent="dragActive = false"
            @drop="onDrop"
          >
            <div class="flex gap-4 p-4">
              <div class="relative shrink-0 w-32 h-40 overflow-hidden rounded-sm bg-white/5">
                <img :src="card.imageUrl" :alt="card.artist" class="w-full h-full object-cover">
              </div>
              <div class="flex-1 min-w-0 flex flex-col justify-between">
                <p class="text-sm text-white/60 leading-relaxed">{{ t('exhibitions.dropzoneHint') }}</p>
                <p class="text-[11px] text-white/35 mt-2">{{ t('exhibitions.fieldImageHelp') }}</p>
                <div class="flex items-center gap-3 mt-4">
                  <label class="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-accent-gold)] text-[var(--color-edition)] text-xs uppercase tracking-[0.18em] font-medium rounded-sm cursor-pointer hover:bg-[var(--color-accent-gold)]/90 transition-colors">
                    <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" :disabled="uploading" @change="onFileChange">
                    {{ uploading ? t('exhibitions.actions.uploading') : t('exhibitions.actions.upload') }}
                  </label>
                  <button
                    v-if="override?.imageFilename"
                    type="button"
                    class="text-xs text-white/50 hover:text-red-300 font-mono uppercase tracking-[0.18em] transition-colors"
                    :disabled="uploading"
                    @click="removeImage"
                  >
                    {{ t('exhibitions.actions.removeImage') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Artist -->
        <section>
          <div class="flex items-center justify-between mb-3">
            <div class="eyebrow">{{ t('exhibitions.fieldArtist') }}</div>
            <button
              v-if="override?.artistName && override.artistName !== card.artist"
              type="button"
              class="text-[10px] text-white/40 hover:text-gold font-mono uppercase tracking-[0.18em] transition-colors"
              @click="restoreArtist"
            >
              {{ t('exhibitions.actions.restoreDefault') }}
            </button>
          </div>
          <input
            v-model="form.artistName"
            type="text"
            class="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-sm text-white text-sm transition-colors focus:outline-none focus:border-[var(--color-accent-gold)] focus:bg-white/[0.04]"
          >
          <p class="text-[11px] text-white/35 mt-2 italic">{{ t('exhibitions.fieldArtistHelp') }}</p>
        </section>

        <!-- Language tabs -->
        <section>
          <div class="flex flex-wrap items-center gap-1 mb-5 border-b border-white/10">
            <button
              v-for="loc in ['eu', 'es', 'fr', 'en'] as const"
              :key="loc"
              type="button"
              class="px-3 py-2 text-xs font-mono uppercase tracking-[0.18em] transition-colors border-b-2 -mb-px"
              :class="activeLocale === loc ? 'text-gold border-gold' : 'text-white/40 border-transparent hover:text-white/70'"
              @click="activeLocale = loc"
            >
              {{ t(`exhibitions.tabs.${loc}`) }}
            </button>
          </div>

          <div class="space-y-6">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="eyebrow">{{ t('exhibitions.fieldTitle') }}</span>
                <button
                  type="button"
                  class="text-[10px] text-white/40 hover:text-gold font-mono uppercase tracking-[0.18em] transition-colors"
                  @click="restoreTitle"
                >
                  {{ t('exhibitions.actions.restoreDefault') }}
                </button>
              </div>
              <input
                v-model="form[titleKey]"
                type="text"
                class="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-sm text-white text-sm transition-colors focus:outline-none focus:border-[var(--color-accent-gold)] focus:bg-white/[0.04]"
              >
            </div>
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="eyebrow">{{ t('exhibitions.fieldDescription') }}</span>
                <button
                  type="button"
                  class="text-[10px] text-white/40 hover:text-gold font-mono uppercase tracking-[0.18em] transition-colors"
                  @click="restoreDescription"
                >
                  {{ t('exhibitions.actions.restoreDefault') }}
                </button>
              </div>
              <textarea
                v-model="form[descriptionKey]"
                rows="10"
                class="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-sm text-white text-sm leading-relaxed transition-colors focus:outline-none focus:border-[var(--color-accent-gold)] focus:bg-white/[0.04] resize-y"
              />
              <p class="text-[11px] text-white/35 mt-2 italic">{{ t('exhibitions.fieldDescriptionHelp') }}</p>
            </div>
          </div>
        </section>

        <!-- URL -->
        <section>
          <div class="flex items-center justify-between mb-2">
            <span class="eyebrow">{{ t('exhibitions.fieldExternalUrl') }}</span>
            <button
              v-if="override?.externalUrl"
              type="button"
              class="text-[10px] text-white/40 hover:text-gold font-mono uppercase tracking-[0.18em] transition-colors"
              @click="restoreUrl"
            >
              {{ t('exhibitions.actions.restoreDefault') }}
            </button>
          </div>
          <input
            v-model="form.externalUrl"
            type="url"
            placeholder="https://"
            class="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-sm text-white text-sm transition-colors focus:outline-none focus:border-[var(--color-accent-gold)] focus:bg-white/[0.04]"
          >
          <p class="text-[11px] text-white/35 mt-2 italic">{{ t('exhibitions.fieldExternalUrlHelp') }}</p>
        </section>

        <!-- Actions -->
        <div class="sticky bottom-0 -mx-2 pt-4 pb-2 bg-gradient-to-t from-[var(--color-edition)] via-[var(--color-edition)]/95 to-transparent z-10">
          <div class="flex items-center gap-4 px-2">
            <button
              type="button"
              :disabled="saving"
              class="inline-flex items-center gap-2 px-5 py-3 bg-[var(--color-accent-gold)] text-[var(--color-edition)] text-xs uppercase tracking-[0.18em] font-medium rounded-sm hover:bg-[var(--color-accent-gold)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-gold"
              @click="save"
            >
              <span
                v-if="saving"
                class="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              />
              {{ saving ? t('exhibitions.actions.saving') : t('exhibitions.actions.save') }}
            </button>
            <p v-if="feedback" class="text-xs text-gold font-mono uppercase tracking-[0.18em]">{{ feedback }}</p>
          </div>
        </div>
      </div>

      <!-- Preview -->
      <aside class="lg:col-span-2">
        <div class="sticky top-24">
          <div class="eyebrow mb-3">{{ t('exhibitions.preview') }}</div>
          <article class="border border-white/10 bg-[var(--color-edition-dark)] rounded-sm overflow-hidden">
            <div class="relative w-full aspect-[4/5] overflow-hidden bg-white/5">
              <img :src="card.imageUrl" :alt="form.artistName || card.artist" class="w-full h-full object-cover">
            </div>
            <div class="p-5">
              <p class="eyebrow mb-2">
                {{ card.number }}. {{ card.galleryName.toUpperCase() }}
              </p>
              <h3 class="font-serif text-xl text-white mb-2" style="font-weight: 500;">
                {{ previewTitle }}
              </h3>
              <p class="text-gold font-medium text-sm mb-3">{{ form.artistName || card.artist }}</p>
              <div class="space-y-2 text-sm text-white/70 leading-relaxed">
                <p v-for="(p, i) in previewParagraphs" :key="i">{{ p }}</p>
                <p v-if="previewParagraphs.length === 0" class="italic text-white/30">—</p>
              </div>
              <p v-if="form.externalUrl" class="mt-4 text-xs text-gold font-mono uppercase tracking-[0.18em] truncate">
                {{ form.externalUrl }}
              </p>
            </div>
          </article>
        </div>
      </aside>
    </div>
  </div>
</template>
