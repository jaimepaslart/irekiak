<script setup lang="ts">
import type { Ref } from 'vue'
import type { SupportedLocale } from '#types/common'
import type { GalleryContact, TranslatedText } from '#types/gallery'
import type { GalleryContactOverrideRow } from '~~/server/db/schema'

const LOCALES = ['eu', 'es', 'fr', 'en'] as const satisfies readonly SupportedLocale[]
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ACCEPTED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])

interface GalleryView {
  id: string
  slug: string
  name: string
  address: string
  city: string
  coordinates: { lat: number, lng: number }
  description: TranslatedText
  openingHours: TranslatedText
  website?: string
  instagram?: string
  imageUrl: string
  overridden: boolean
}

interface LoadResult {
  gallery: GalleryView
  defaults: GalleryView
  override: GalleryContactOverrideRow | null
  contact: GalleryContact | null
}

definePageMeta({ layout: 'admin', i18n: false })
useSeoMeta({ title: 'Admin · Gallery editor', robots: 'noindex, nofollow' })

const { t } = useAdminT()
const route = useRoute()
const router = useRouter()
const token = inject<Ref<string>>('adminToken')!

const id = computed(() => String(route.params.id ?? ''))
const view = ref<GalleryView | null>(null)
const defaults = ref<GalleryView | null>(null)
const override = ref<GalleryContactOverrideRow | null>(null)
const contact = ref<GalleryContact | null>(null)

const loading = ref(true)
const errorMessage = ref<string | null>(null)
const saving = ref(false)
const uploading = ref(false)
const activeLocale = ref<SupportedLocale>('fr')
const feedback = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const dragActive = ref(false)

interface Form {
  galleryName: string
  address: string
  city: string
  lat: number | null
  lng: number | null
  descriptionEu: string
  descriptionEs: string
  descriptionFr: string
  descriptionEn: string
  openingHoursEu: string
  openingHoursEs: string
  openingHoursFr: string
  openingHoursEn: string
  website: string
  instagram: string
  email: string
  contactName: string
  phone: string
  preferredLanguage: SupportedLocale
  notifyOnBooking: boolean
  receiveDailyDigest: boolean
}

const form = reactive<Form>({
  galleryName: '',
  address: '',
  city: '',
  lat: null,
  lng: null,
  descriptionEu: '',
  descriptionEs: '',
  descriptionFr: '',
  descriptionEn: '',
  openingHoursEu: '',
  openingHoursEs: '',
  openingHoursFr: '',
  openingHoursEn: '',
  website: '',
  instagram: '',
  email: '',
  contactName: '',
  phone: '',
  preferredLanguage: 'es',
  notifyOnBooking: false,
  receiveDailyDigest: false,
})

async function load() {
  loading.value = true
  errorMessage.value = null
  try {
    const res = await $fetch<LoadResult>(`/api/admin/galleries/${id.value}`, {
      headers: { 'x-admin-token': token.value },
    })
    view.value = res.gallery
    defaults.value = res.defaults
    override.value = res.override
    contact.value = res.contact

    form.galleryName = res.gallery.name
    form.address = res.gallery.address
    form.city = res.gallery.city
    form.lat = res.gallery.coordinates.lat
    form.lng = res.gallery.coordinates.lng
    form.descriptionEu = res.gallery.description.eu
    form.descriptionEs = res.gallery.description.es
    form.descriptionFr = res.gallery.description.fr
    form.descriptionEn = res.gallery.description.en
    form.openingHoursEu = res.gallery.openingHours.eu
    form.openingHoursEs = res.gallery.openingHours.es
    form.openingHoursFr = res.gallery.openingHours.fr
    form.openingHoursEn = res.gallery.openingHours.en
    form.website = res.gallery.website ?? ''
    form.instagram = res.gallery.instagram ?? ''

    form.email = res.contact?.email ?? ''
    form.contactName = res.contact?.name ?? ''
    form.phone = res.contact?.phone ?? ''
    form.preferredLanguage = res.contact?.preferredLanguage ?? 'es'
    form.notifyOnBooking = res.contact?.notifyOnBooking ?? false
    form.receiveDailyDigest = res.contact?.receiveDailyDigest ?? false
  }
  catch (err: unknown) {
    errorMessage.value = (err as { statusMessage?: string })?.statusMessage ?? t('galleries.loadFailed')
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

function describeError(err: unknown, fallbackKey: string): string {
  const e = err as { statusCode?: number, statusMessage?: string } | undefined
  const code = e?.statusCode
  const raw = e?.statusMessage?.trim()
  if (code === 401 || code === 403) return t('galleries.feedback.unauthorized')
  if (code === 413) return t('galleries.feedback.imageTooLargeForServer')
  if (raw) return raw
  if (code) return t('galleries.feedback.serverError', { code })
  return t(fallbackKey)
}

// Returns the trimmed form value, or null if it matches the default (= no override).
function diffOrNull(formValue: string, defaultValue: string | null | undefined): string | null {
  const v = formValue.trim()
  const d = (defaultValue ?? '').trim()
  if (v === '') return null
  if (v === d) return null
  return v
}

function numDiffOrNull(formValue: number | null, defaultValue: number): number | null {
  if (formValue === null || !Number.isFinite(formValue)) return null
  return formValue === defaultValue ? null : formValue
}

async function save() {
  if (!view.value || !defaults.value) return
  const d = defaults.value
  saving.value = true
  try {
    await $fetch(`/api/admin/galleries/${id.value}`, {
      method: 'POST',
      headers: { 'x-admin-token': token.value, 'Content-Type': 'application/json' },
      body: {
        galleryName: diffOrNull(form.galleryName, d.name),
        address: diffOrNull(form.address, d.address),
        city: diffOrNull(form.city, d.city),
        lat: numDiffOrNull(form.lat, d.coordinates.lat),
        lng: numDiffOrNull(form.lng, d.coordinates.lng),
        descriptionEu: diffOrNull(form.descriptionEu, d.description.eu),
        descriptionEs: diffOrNull(form.descriptionEs, d.description.es),
        descriptionFr: diffOrNull(form.descriptionFr, d.description.fr),
        descriptionEn: diffOrNull(form.descriptionEn, d.description.en),
        openingHoursEu: diffOrNull(form.openingHoursEu, d.openingHours.eu),
        openingHoursEs: diffOrNull(form.openingHoursEs, d.openingHours.es),
        openingHoursFr: diffOrNull(form.openingHoursFr, d.openingHours.fr),
        openingHoursEn: diffOrNull(form.openingHoursEn, d.openingHours.en),
        website: diffOrNull(form.website, d.website),
        instagram: diffOrNull(form.instagram, d.instagram),
        email: form.email.trim() || null,
        contactName: form.contactName.trim() || null,
        phone: form.phone.trim() || null,
        preferredLanguage: form.preferredLanguage,
        notifyOnBooking: form.notifyOnBooking,
        receiveDailyDigest: form.receiveDailyDigest,
      },
    })
    showFeedback(t('galleries.feedback.saved'))
    await load()
  }
  catch (err: unknown) {
    alert(describeError(err, 'galleries.saveFailed'))
  }
  finally { saving.value = false }
}

async function uploadFile(file: File) {
  if (!view.value) return
  if (!ACCEPTED_IMAGE_MIME.has(file.type)) {
    alert(t('galleries.feedback.imageBadFormat'))
    if (fileInput.value) fileInput.value.value = ''
    return
  }
  if (file.size > MAX_IMAGE_BYTES) {
    alert(t('galleries.feedback.imageTooLarge'))
    if (fileInput.value) fileInput.value.value = ''
    return
  }
  uploading.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    await $fetch(`/api/admin/galleries/${id.value}/image`, {
      method: 'POST',
      headers: { 'x-admin-token': token.value },
      body: fd,
    })
    showFeedback(t('galleries.feedback.imageUploaded'))
    await load()
  }
  catch (err: unknown) {
    alert(describeError(err, 'galleries.feedback.imageFailed'))
  }
  finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

async function removeImage() {
  if (!view.value) return
  uploading.value = true
  try {
    await $fetch(`/api/admin/galleries/${id.value}/image`, {
      method: 'DELETE',
      headers: { 'x-admin-token': token.value },
    })
    showFeedback(t('galleries.feedback.imageRemoved'))
    await load()
  }
  catch (err: unknown) {
    alert(describeError(err, 'galleries.feedback.imageFailed'))
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

const descriptionKey = computed<keyof Form>(() => `description${activeLocale.value.charAt(0).toUpperCase()}${activeLocale.value.slice(1)}` as keyof Form)
const hoursKey = computed<keyof Form>(() => `openingHours${activeLocale.value.charAt(0).toUpperCase()}${activeLocale.value.slice(1)}` as keyof Form)

function descDefault(): string {
  return defaults.value?.description[activeLocale.value] ?? ''
}
function hoursDefault(): string {
  return defaults.value?.openingHours[activeLocale.value] ?? ''
}

function restoreField(field: keyof Form, value: string | number | boolean) {
  ;(form as unknown as Record<string, unknown>)[field as string] = value
}
</script>

<template>
  <div class="relative max-w-5xl mx-auto">
    <AdminGrain />

    <button
      type="button"
      class="relative inline-flex items-center text-xs text-white/50 hover:text-gold font-mono uppercase tracking-[0.18em] transition-colors mb-6 arrow-nudge-parent"
      @click="router.push('/admin/galleries')"
    >
      <span class="arrow-nudge-back mr-1">←</span> {{ t('galleries.actions.backToList') }}
    </button>

    <AdminHeroSection
      v-if="view"
      :eyebrow="`${view.id} · ${view.name.toUpperCase()}`"
      :title="t('galleries.editTitle')"
      :subtitle="t('galleries.editSubtitle')"
    />

    <p v-if="errorMessage" class="text-sm text-red-300 italic font-serif mb-6">
      {{ errorMessage }}
    </p>

    <div v-if="loading && !view" class="space-y-4">
      <AdminSkeleton variant="card" :count="3" />
    </div>

    <div v-else-if="view" class="space-y-10">
      <!-- IMAGE -->
      <section>
        <div class="eyebrow mb-3">{{ t('galleries.sectionImage') }}</div>
        <div
          class="relative overflow-hidden border rounded-sm transition-colors"
          :class="dragActive ? 'border-gold bg-gold-soft/20' : 'border-white/10 bg-[var(--color-edition-dark)]'"
          @dragover.prevent="dragActive = true"
          @dragleave.prevent="dragActive = false"
          @drop="onDrop"
        >
          <div class="flex gap-4 p-4">
            <div class="relative shrink-0 w-40 h-32 overflow-hidden rounded-sm bg-white/5">
              <img :src="view.imageUrl" :alt="view.name" class="w-full h-full object-cover">
            </div>
            <div class="flex-1 min-w-0 flex flex-col justify-between">
              <p class="text-sm text-white/60 leading-relaxed">{{ t('galleries.dropzoneHint') }}</p>
              <p class="text-[11px] text-white/35 mt-2">{{ t('galleries.fieldImageHelp') }}</p>
              <div class="flex items-center gap-3 mt-4">
                <label class="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-accent-gold)] text-[var(--color-edition)] text-xs uppercase tracking-[0.18em] font-medium rounded-sm cursor-pointer hover:bg-[var(--color-accent-gold)]/90 transition-colors">
                  <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" :disabled="uploading" @change="onFileChange">
                  {{ uploading ? t('galleries.actions.uploading') : t('galleries.actions.upload') }}
                </label>
                <button
                  v-if="override?.imageFilename"
                  type="button"
                  class="text-xs text-white/50 hover:text-red-300 font-mono uppercase tracking-[0.18em] transition-colors"
                  :disabled="uploading"
                  @click="removeImage"
                >
                  {{ t('galleries.actions.removeImage') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- IDENTITY -->
      <section>
        <div class="eyebrow mb-3">{{ t('galleries.sectionIdentity') }}</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label class="block">
            <span class="block text-xs text-white/60 mb-1">{{ t('galleries.fieldGalleryName') }}</span>
            <input
              v-model="form.galleryName"
              type="text"
              class="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-sm text-white text-sm focus:outline-none focus:border-[var(--color-accent-gold)]"
            >
          </label>
          <label class="block">
            <span class="block text-xs text-white/60 mb-1">{{ t('galleries.fieldCity') }}</span>
            <input
              v-model="form.city"
              type="text"
              class="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-sm text-white text-sm focus:outline-none focus:border-[var(--color-accent-gold)]"
            >
          </label>
          <label class="block md:col-span-2">
            <span class="block text-xs text-white/60 mb-1">{{ t('galleries.fieldAddress') }}</span>
            <input
              v-model="form.address"
              type="text"
              class="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-sm text-white text-sm focus:outline-none focus:border-[var(--color-accent-gold)]"
            >
          </label>
          <label class="block">
            <span class="block text-xs text-white/60 mb-1">{{ t('galleries.fieldLat') }}</span>
            <input
              v-model.number="form.lat"
              type="number"
              step="0.000001"
              min="-90"
              max="90"
              class="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-sm text-white text-sm font-mono focus:outline-none focus:border-[var(--color-accent-gold)]"
            >
          </label>
          <label class="block">
            <span class="block text-xs text-white/60 mb-1">{{ t('galleries.fieldLng') }}</span>
            <input
              v-model.number="form.lng"
              type="number"
              step="0.000001"
              min="-180"
              max="180"
              class="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-sm text-white text-sm font-mono focus:outline-none focus:border-[var(--color-accent-gold)]"
            >
          </label>
          <label class="block">
            <span class="block text-xs text-white/60 mb-1">{{ t('galleries.fieldWebsite') }}</span>
            <input
              v-model="form.website"
              type="url"
              placeholder="https://"
              class="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-sm text-white text-sm focus:outline-none focus:border-[var(--color-accent-gold)] placeholder:text-white/25"
            >
          </label>
          <label class="block">
            <span class="block text-xs text-white/60 mb-1">{{ t('galleries.fieldInstagram') }}</span>
            <input
              v-model="form.instagram"
              type="url"
              placeholder="https://instagram.com/…"
              class="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-sm text-white text-sm focus:outline-none focus:border-[var(--color-accent-gold)] placeholder:text-white/25"
            >
          </label>
        </div>
      </section>

      <!-- LANGUAGE TABS shared by description + hours -->
      <div class="flex flex-wrap items-center gap-1 border-b border-white/10">
        <button
          v-for="loc in LOCALES"
          :key="loc"
          type="button"
          class="px-3 py-2 text-xs font-mono uppercase tracking-[0.18em] transition-colors border-b-2 -mb-px"
          :class="activeLocale === loc ? 'text-gold border-gold' : 'text-white/40 border-transparent hover:text-white/70'"
          @click="activeLocale = loc"
        >
          {{ t(`galleries.tabs.${loc}`) }}
        </button>
      </div>

      <!-- DESCRIPTION -->
      <section>
        <div class="flex items-center justify-between mb-2">
          <span class="eyebrow">{{ t('galleries.sectionDescription') }}</span>
          <button
            v-if="String(form[descriptionKey] ?? '').trim() !== descDefault().trim()"
            type="button"
            class="text-[10px] text-white/40 hover:text-gold font-mono uppercase tracking-[0.18em] transition-colors"
            @click="restoreField(descriptionKey, descDefault())"
          >
            {{ t('galleries.actions.restoreDefault') }}
          </button>
        </div>
        <textarea
          v-model="form[descriptionKey] as string"
          rows="6"
          class="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-sm text-white text-sm leading-relaxed focus:outline-none focus:border-[var(--color-accent-gold)] resize-y"
        />
        <p class="text-[11px] text-white/35 mt-2 italic">{{ t('galleries.fieldDescriptionHelp') }}</p>
      </section>

      <!-- OPENING HOURS -->
      <section>
        <div class="flex items-center justify-between mb-2">
          <span class="eyebrow">{{ t('galleries.sectionHours') }}</span>
          <button
            v-if="String(form[hoursKey] ?? '').trim() !== hoursDefault().trim()"
            type="button"
            class="text-[10px] text-white/40 hover:text-gold font-mono uppercase tracking-[0.18em] transition-colors"
            @click="restoreField(hoursKey, hoursDefault())"
          >
            {{ t('galleries.actions.restoreDefault') }}
          </button>
        </div>
        <textarea
          v-model="form[hoursKey] as string"
          rows="3"
          class="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-sm text-white text-sm leading-relaxed focus:outline-none focus:border-[var(--color-accent-gold)] resize-y"
        />
        <p class="text-[11px] text-white/35 mt-2 italic">{{ t('galleries.fieldOpeningHoursHelp') }}</p>
      </section>

      <!-- CONTACT -->
      <section>
        <div class="eyebrow mb-3">{{ t('galleries.sectionContact') }}</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label class="block md:col-span-2">
            <span class="block text-xs text-white/60 mb-1">{{ t('galleries.fieldEmail') }}</span>
            <input
              v-model="form.email"
              type="email"
              autocomplete="off"
              class="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-sm text-white text-sm focus:outline-none focus:border-[var(--color-accent-gold)]"
            >
          </label>
          <label class="block">
            <span class="block text-xs text-white/60 mb-1">{{ t('galleries.fieldContactName') }}</span>
            <input
              v-model="form.contactName"
              type="text"
              class="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-sm text-white text-sm focus:outline-none focus:border-[var(--color-accent-gold)]"
            >
          </label>
          <label class="block">
            <span class="block text-xs text-white/60 mb-1">{{ t('galleries.fieldPhone') }}</span>
            <input
              v-model="form.phone"
              type="tel"
              class="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-sm text-white text-sm focus:outline-none focus:border-[var(--color-accent-gold)]"
            >
          </label>
          <label class="block">
            <span class="block text-xs text-white/60 mb-1">{{ t('galleries.fieldLanguage') }}</span>
            <select
              v-model="form.preferredLanguage"
              class="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-sm text-white text-sm focus:outline-none focus:border-[var(--color-accent-gold)]"
            >
              <option v-for="loc in LOCALES" :key="loc" :value="loc">{{ t(`galleries.tabs.${loc}`) }}</option>
            </select>
          </label>
          <div class="flex items-center gap-3">
            <input id="gal-notify" v-model="form.notifyOnBooking" type="checkbox" class="w-4 h-4 accent-[var(--color-accent-gold)]">
            <label for="gal-notify" class="text-sm text-white/70 cursor-pointer">{{ t('galleries.notifyOnBooking') }}</label>
          </div>
          <div class="flex items-center gap-3">
            <input id="gal-digest" v-model="form.receiveDailyDigest" type="checkbox" class="w-4 h-4 accent-[var(--color-accent-gold)]">
            <label for="gal-digest" class="text-sm text-white/70 cursor-pointer">{{ t('galleries.receiveDailyDigest') }}</label>
          </div>
        </div>
      </section>

      <!-- ACTIONS -->
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
            {{ saving ? t('galleries.actions.saving') : t('galleries.actions.save') }}
          </button>
          <p v-if="feedback" class="text-xs text-gold font-mono uppercase tracking-[0.18em]">{{ feedback }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
