<script setup lang="ts">
interface Slot {
  id: string
  routeId: string
  date: string
  startTime: string
  endTime: string
  language: string
  maxParticipants: number
  remaining: number
}

definePageMeta({ layout: 'admin', i18n: false })

const { t } = useAdminT()
const { year } = useEdition()
const nextYear = computed(() => year.value + 1)

useSeoMeta({ title: () => t('bookings.seoTitleNew'), robots: 'noindex, nofollow' })

const token = inject<Ref<string>>('adminToken')!

const slots = ref<Slot[]>([])
const loading = ref(true)
const submitting = ref(false)
const errorMessage = ref<string | null>(null)
const successBookingId = ref<string | null>(null)

interface Form {
  tourSlotId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  numberOfPeople: number
  language: 'eu' | 'es' | 'fr' | 'en'
  specialNeeds: string
  bypassCapacity: boolean
  notify: boolean
  notifyGalleries: boolean
  acceptsMarketing: boolean
}
const form = reactive<Form>({
  tourSlotId: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  numberOfPeople: 1,
  language: 'es',
  specialNeeds: '',
  bypassCapacity: false,
  notify: true,
  notifyGalleries: true,
  acceptsMarketing: false,
})

onMounted(async () => {
  try {
    slots.value = await $fetch<Slot[]>('/api/bookings/availability')
  }
  catch (err: unknown) {
    errorMessage.value = (err as { statusMessage?: string })?.statusMessage ?? t('bookings.loadFailed')
  }
  finally { loading.value = false }
})

async function submit() {
  submitting.value = true
  errorMessage.value = null
  try {
    const res = await $fetch<{ ok: boolean, bookingId: string, confirmToken: string }>('/api/admin/bookings', {
      method: 'POST',
      headers: { 'x-admin-token': token.value, 'Content-Type': 'application/json' },
      body: {
        tourSlotId: form.tourSlotId,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        numberOfPeople: form.numberOfPeople,
        language: form.language,
        specialNeeds: form.specialNeeds.trim() || undefined,
        bypassCapacity: form.bypassCapacity,
        notify: form.notify,
        notifyGalleries: form.notifyGalleries,
        acceptsMarketing: form.acceptsMarketing,
      },
    })
    successBookingId.value = res.bookingId
  }
  catch (err: unknown) {
    const e = err as { statusMessage?: string, data?: { remaining?: number } }
    errorMessage.value = e?.statusMessage ?? t('bookings.submitFailed')
    if (e?.data?.remaining !== undefined) {
      errorMessage.value += t('bookings.remainingPlacesHint', { remaining: e.data.remaining })
    }
  }
  finally { submitting.value = false }
}

function resetForm() {
  successBookingId.value = null
  Object.assign(form, { firstName: '', lastName: '', email: '', phone: '', specialNeeds: '' })
}
</script>

<template>
  <div>
    <NuxtLink to="/admin/bookings" class="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-6">
      {{ t('bookings.newBack') }}
    </NuxtLink>

    <AdminPageHeader :title="t('bookings.newTitle')" :subtitle="t('bookings.newSubtitle')" />

    <div v-if="successBookingId" class="bg-emerald-500/10 border border-emerald-500/30 rounded-sm p-6 max-w-2xl">
      <p class="text-emerald-300 mb-3">{{ t('bookings.createSuccess') }}</p>
      <p class="text-sm text-white/70 font-mono mb-4">{{ successBookingId }}</p>
      <div class="flex gap-3">
        <AdminBaseButton variant="primary" as="nuxt-link" :to="`/admin/bookings/${successBookingId}`">
          {{ t('bookings.viewBooking') }}
        </AdminBaseButton>
        <AdminBaseButton variant="secondary" type="button" @click="resetForm">
          {{ t('bookings.createAnother') }}
        </AdminBaseButton>
      </div>
    </div>

    <form v-else class="bg-edition-dark border border-white/10 rounded-sm p-6 max-w-3xl space-y-5" @submit.prevent="submit">
      <label class="block">
        <span class="text-xs uppercase tracking-wider text-white/40 block mb-2">{{ t('bookings.fieldSlotRequired') }}</span>
        <select v-model="form.tourSlotId" required class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
          <option value="">{{ t('bookings.fieldSlotPlaceholder') }}</option>
          <option v-for="s in slots" :key="s.id" :value="s.id">
            {{ s.date }} · {{ s.startTime }} · {{ s.language.toUpperCase() }} · {{ routeSlugFromId(s.routeId) }} ({{ s.remaining }}/{{ s.maxParticipants }})
          </option>
        </select>
      </label>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label class="block">
          <span class="text-xs uppercase tracking-wider text-white/40 block mb-2">{{ t('bookings.fieldFirstNameRequired') }}</span>
          <input v-model="form.firstName" required class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
        </label>
        <label class="block">
          <span class="text-xs uppercase tracking-wider text-white/40 block mb-2">{{ t('bookings.fieldLastNameRequired') }}</span>
          <input v-model="form.lastName" required class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
        </label>
        <label class="block">
          <span class="text-xs uppercase tracking-wider text-white/40 block mb-2">{{ t('bookings.fieldEmailRequired') }}</span>
          <input v-model="form.email" type="email" required class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
        </label>
        <label class="block">
          <span class="text-xs uppercase tracking-wider text-white/40 block mb-2">{{ t('bookings.fieldPhone') }}</span>
          <input v-model="form.phone" class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
        </label>
        <label class="block">
          <span class="text-xs uppercase tracking-wider text-white/40 block mb-2">{{ t('bookings.fieldParticipantsRequired') }}</span>
          <input v-model.number="form.numberOfPeople" type="number" min="1" max="12" required class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
        </label>
        <label class="block">
          <span class="text-xs uppercase tracking-wider text-white/40 block mb-2">{{ t('bookings.fieldLanguage') }}</span>
          <select v-model="form.language" class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
            <option value="eu">Euskara</option>
            <option value="es">Español</option>
          </select>
        </label>
      </div>

      <label class="block">
        <span class="text-xs uppercase tracking-wider text-white/40 block mb-2">{{ t('bookings.fieldSpecialNeeds') }}</span>
        <textarea v-model="form.specialNeeds" rows="2" maxlength="1000" class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white" />
      </label>

      <fieldset class="border border-white/10 rounded-sm p-4 space-y-3">
        <legend class="text-xs uppercase tracking-wider text-white/40 px-2 font-mono">{{ t('bookings.optionsAdmin') }}</legend>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="form.notify" type="checkbox" class="accent-white">
          {{ t('bookings.fieldSendEmailVisitor') }}
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="form.notifyGalleries" type="checkbox" class="accent-white">
          {{ t('bookings.fieldNotifyGalleries') }}
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="form.bypassCapacity" type="checkbox" class="accent-white">
          {{ t('bookings.fieldBypassCapacity') }}
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="form.acceptsMarketing" type="checkbox" class="accent-white">
          {{ t('bookings.fieldMarketingOptIn', { year: nextYear }) }}
        </label>
      </fieldset>

      <p v-if="errorMessage" class="text-sm text-red-300">{{ errorMessage }}</p>

      <div class="flex gap-3 justify-end">
        <AdminBaseButton variant="ghost" as="nuxt-link" to="/admin/bookings">
          {{ t('common.cancel') }}
        </AdminBaseButton>
        <AdminBaseButton variant="primary" type="submit" :disabled="submitting" :loading="submitting">
          {{ submitting ? t('bookings.submitCreating') : t('bookings.submitCreate') }}
        </AdminBaseButton>
      </div>
    </form>
  </div>
</template>
