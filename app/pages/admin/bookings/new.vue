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

definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Admin · Nouvelle réservation', robots: 'noindex, nofollow' })

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
    errorMessage.value = (err as { statusMessage?: string })?.statusMessage ?? 'Failed to load slots'
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
    errorMessage.value = e?.statusMessage ?? 'Failed'
    if (e?.data?.remaining !== undefined) {
      errorMessage.value += ` (reste ${e.data.remaining} places, cochez "Bypass capacity" pour forcer)`
    }
  }
  finally { submitting.value = false }
}
</script>

<template>
  <div>
    <NuxtLink to="/admin/bookings" class="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-6">← Réservations</NuxtLink>

    <h1 class="m-0 text-2xl mb-2">Nouvelle réservation</h1>
    <p class="text-sm text-white/50 mb-8">Création manuelle (phone-in, walk-in, etc.)</p>

    <!-- Success -->
    <div v-if="successBookingId" class="bg-emerald-500/10 border border-emerald-500/30 rounded-sm p-6 max-w-2xl">
      <p class="text-emerald-300 mb-3">✓ Réservation créée avec succès.</p>
      <p class="text-sm text-white/70 font-mono mb-4">{{ successBookingId }}</p>
      <div class="flex gap-3">
        <NuxtLink :to="`/admin/bookings/${successBookingId}`" class="px-4 py-2 text-sm bg-white text-[var(--color-edition)] rounded-sm hover:bg-white/90">Voir la réservation</NuxtLink>
        <button type="button" class="px-4 py-2 text-sm border border-white/20 rounded-sm hover:bg-white/10" @click="successBookingId = null; Object.assign(form, { firstName: '', lastName: '', email: '', phone: '', specialNeeds: '' })">Créer une autre</button>
      </div>
    </div>

    <!-- Form -->
    <form v-else class="bg-edition-dark border border-white/10 rounded-sm p-6 max-w-3xl space-y-5" @submit.prevent="submit">
      <p v-if="loading" class="text-white/40">Chargement des créneaux…</p>

      <!-- Slot -->
      <label class="block">
        <span class="text-xs uppercase tracking-wider text-white/40 block mb-2">Créneau *</span>
        <select v-model="form.tourSlotId" required class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
          <option value="">— Choisir —</option>
          <option v-for="s in slots" :key="s.id" :value="s.id">
            {{ s.date }} · {{ s.startTime }} · {{ s.language.toUpperCase() }} · {{ s.routeId.replace('route-', '') }} ({{ s.remaining }}/{{ s.maxParticipants }})
          </option>
        </select>
      </label>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label class="block">
          <span class="text-xs uppercase tracking-wider text-white/40 block mb-2">Prénom *</span>
          <input v-model="form.firstName" required class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
        </label>
        <label class="block">
          <span class="text-xs uppercase tracking-wider text-white/40 block mb-2">Nom *</span>
          <input v-model="form.lastName" required class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
        </label>
        <label class="block">
          <span class="text-xs uppercase tracking-wider text-white/40 block mb-2">Email *</span>
          <input v-model="form.email" type="email" required class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
        </label>
        <label class="block">
          <span class="text-xs uppercase tracking-wider text-white/40 block mb-2">Téléphone</span>
          <input v-model="form.phone" class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
        </label>
        <label class="block">
          <span class="text-xs uppercase tracking-wider text-white/40 block mb-2">Participants *</span>
          <input v-model.number="form.numberOfPeople" type="number" min="1" max="12" required class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
        </label>
        <label class="block">
          <span class="text-xs uppercase tracking-wider text-white/40 block mb-2">Langue</span>
          <select v-model="form.language" class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
            <option value="eu">Euskara</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </label>
      </div>

      <label class="block">
        <span class="text-xs uppercase tracking-wider text-white/40 block mb-2">Besoins spécifiques</span>
        <textarea v-model="form.specialNeeds" rows="2" maxlength="1000" class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white" />
      </label>

      <!-- Options admin -->
      <fieldset class="border border-white/10 rounded-sm p-4 space-y-3">
        <legend class="text-xs uppercase tracking-wider text-white/40 px-2 font-mono">Options admin</legend>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="form.notify" type="checkbox" class="accent-white">
          Envoyer email de confirmation au visiteur
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="form.notifyGalleries" type="checkbox" class="accent-white">
          Notifier les galeries du parcours
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="form.bypassCapacity" type="checkbox" class="accent-white">
          Bypass capacité (si plein)
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="form.acceptsMarketing" type="checkbox" class="accent-white">
          Opt-in marketing (édition 2027)
        </label>
      </fieldset>

      <p v-if="errorMessage" class="text-sm text-red-300">{{ errorMessage }}</p>

      <div class="flex gap-3 justify-end">
        <NuxtLink to="/admin/bookings" class="px-4 py-2 text-sm text-white/60 hover:text-white">Annuler</NuxtLink>
        <button type="submit" class="px-6 py-2 text-sm font-medium bg-white text-[var(--color-edition)] rounded-sm hover:bg-white/90 disabled:opacity-50" :disabled="submitting">
          {{ submitting ? '…' : 'Créer la réservation' }}
        </button>
      </div>
    </form>
  </div>
</template>
