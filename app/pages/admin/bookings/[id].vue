<script setup lang="ts">
interface DetailPayload {
  booking: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
    numberOfPeople: number
    language: string
    specialNeeds: string | null
    status: 'confirmed' | 'cancelled' | 'waitlist'
    confirmToken: string
    acceptsMarketing: boolean
    createdAt: string
    slotId: string
  }
  slot: { id: string, date: string, startTime: string, endTime: string, language: string, maxParticipants: number, bookedCount: number }
  route: { id: string, nameEu: string, nameEs: string, nameFr: string, nameEn: string, color: string }
  audit: Array<{ id: string, timestamp: string, actor: string, action: string, metadata: unknown }>
  attendance: { bookingId: string, checkedInAt: string, checkedInBy: string, notes: string | null } | null
}

definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Admin · Détail réservation', robots: 'noindex, nofollow' })

const token = inject<Ref<string>>('adminToken')!
const route = useRoute()
const bookingId = computed(() => String(route.params.id))

const data = ref<DetailPayload | null>(null)
const loading = ref(true)
const errorMessage = ref<string | null>(null)
const editing = ref(false)
const saving = ref(false)

interface EditForm {
  firstName: string
  lastName: string
  email: string
  phone: string
  numberOfPeople: number
  specialNeeds: string
}
const form = reactive<EditForm>({
  firstName: '', lastName: '', email: '', phone: '', numberOfPeople: 1, specialNeeds: '',
})

async function load() {
  loading.value = true
  try {
    data.value = await $fetch<DetailPayload>(`/api/admin/bookings/${bookingId.value}`, {
      headers: { 'x-admin-token': token.value },
    })
    Object.assign(form, {
      firstName: data.value.booking.firstName,
      lastName: data.value.booking.lastName,
      email: data.value.booking.email,
      phone: data.value.booking.phone ?? '',
      numberOfPeople: data.value.booking.numberOfPeople,
      specialNeeds: data.value.booking.specialNeeds ?? '',
    })
  }
  catch (err: unknown) {
    errorMessage.value = (err as { statusMessage?: string })?.statusMessage ?? 'Failed to load'
  }
  finally { loading.value = false }
}

onMounted(() => { void load() })

async function save() {
  if (!data.value) return
  saving.value = true
  try {
    const body: Record<string, unknown> = {}
    const b = data.value.booking
    if (form.firstName !== b.firstName) body.firstName = form.firstName
    if (form.lastName !== b.lastName) body.lastName = form.lastName
    if (form.email !== b.email) body.email = form.email
    if ((form.phone || null) !== b.phone) body.phone = form.phone || null
    if (form.numberOfPeople !== b.numberOfPeople) body.numberOfPeople = form.numberOfPeople
    if ((form.specialNeeds || null) !== b.specialNeeds) body.specialNeeds = form.specialNeeds || null

    if (Object.keys(body).length === 0) {
      editing.value = false
      return
    }

    await $fetch(`/api/admin/bookings/${bookingId.value}/edit`, {
      method: 'PATCH',
      headers: { 'x-admin-token': token.value, 'Content-Type': 'application/json' },
      body,
    })
    editing.value = false
    await load()
  }
  catch (err: unknown) {
    alert((err as { statusMessage?: string })?.statusMessage ?? 'Save failed')
  }
  finally { saving.value = false }
}

async function resend() {
  try {
    await $fetch(`/api/admin/bookings/${bookingId.value}/resend`, {
      method: 'POST', headers: { 'x-admin-token': token.value },
    })
    alert('Email renvoyé au visiteur.')
    await load()
  }
  catch (err: unknown) {
    alert((err as { statusMessage?: string })?.statusMessage ?? 'Resend failed')
  }
}

async function cancel() {
  if (!confirm('Annuler cette réservation ? Le visiteur et les galeries seront notifiés.')) return
  try {
    await $fetch(`/api/admin/bookings/${bookingId.value}/cancel`, {
      method: 'POST', headers: { 'x-admin-token': token.value },
    })
    await load()
  }
  catch (err: unknown) {
    alert((err as { statusMessage?: string })?.statusMessage ?? 'Cancel failed')
  }
}

function statusClass(s: string) {
  if (s === 'confirmed') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  if (s === 'cancelled') return 'bg-red-500/20 text-red-300 border-red-500/30'
  return 'bg-white/10 text-white/70 border-white/20'
}
function actionColor(a: string): string {
  if (a.includes('cancel')) return 'text-red-300'
  if (a.includes('create')) return 'text-emerald-300'
  if (a.includes('email.failed')) return 'text-orange-300'
  if (a.includes('edit')) return 'text-blue-300'
  return 'text-white/70'
}
</script>

<template>
  <div>
    <NuxtLink to="/admin/bookings" class="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-6">
      ← Réservations
    </NuxtLink>

    <p v-if="loading" class="text-white/40">Chargement…</p>
    <p v-if="errorMessage" class="text-sm text-red-300">{{ errorMessage }}</p>

    <template v-if="data">
      <!-- Header -->
      <div class="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <div class="flex items-center gap-3 mb-1">
            <h1 class="m-0 text-2xl">{{ data.booking.firstName }} {{ data.booking.lastName }}</h1>
            <span class="inline-block text-xs px-3 py-1 rounded-full border uppercase" :class="statusClass(data.booking.status)">
              {{ data.booking.status }}
            </span>
          </div>
          <p class="text-sm text-white/50 font-mono">{{ data.booking.id }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button v-if="!editing && data.booking.status === 'confirmed'" type="button" class="text-xs px-4 py-2 border border-white/25 rounded-sm hover:bg-white/10" @click="editing = true">
            ✎ Éditer
          </button>
          <button v-if="data.booking.status === 'confirmed'" type="button" class="text-xs px-4 py-2 border border-white/25 rounded-sm hover:bg-white/10" @click="resend">
            ✉ Resend email
          </button>
          <button v-if="data.booking.status === 'confirmed'" type="button" class="text-xs px-4 py-2 border border-red-400/30 text-red-300 rounded-sm hover:bg-red-500/10" @click="cancel">
            ✗ Annuler
          </button>
        </div>
      </div>

      <!-- Info grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Booking info -->
        <section class="lg:col-span-2 bg-edition-dark border border-white/10 rounded-sm p-6">
          <h2 class="text-base font-semibold mb-4 flex items-center gap-2">
            <span class="w-1 h-4 rounded-full" :style="{ backgroundColor: data.route.color }" />
            Réservation
          </h2>

          <!-- View mode -->
          <dl v-if="!editing" class="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
            <div>
              <dt class="text-white/40 uppercase tracking-wider text-xs font-mono mb-1">Email</dt>
              <dd class="text-white break-all"><a :href="`mailto:${data.booking.email}`" class="hover:underline">{{ data.booking.email }}</a></dd>
            </div>
            <div v-if="data.booking.phone">
              <dt class="text-white/40 uppercase tracking-wider text-xs font-mono mb-1">Téléphone</dt>
              <dd class="text-white">{{ data.booking.phone }}</dd>
            </div>
            <div>
              <dt class="text-white/40 uppercase tracking-wider text-xs font-mono mb-1">Participants</dt>
              <dd class="text-white">{{ data.booking.numberOfPeople }}</dd>
            </div>
            <div>
              <dt class="text-white/40 uppercase tracking-wider text-xs font-mono mb-1">Langue</dt>
              <dd class="text-white uppercase font-mono">{{ data.booking.language }}</dd>
            </div>
            <div class="sm:col-span-2" v-if="data.booking.specialNeeds">
              <dt class="text-white/40 uppercase tracking-wider text-xs font-mono mb-1">Besoins spécifiques</dt>
              <dd class="text-white/90">{{ data.booking.specialNeeds }}</dd>
            </div>
            <div>
              <dt class="text-white/40 uppercase tracking-wider text-xs font-mono mb-1">Marketing opt-in</dt>
              <dd class="text-white">{{ data.booking.acceptsMarketing ? '✓' : '—' }}</dd>
            </div>
            <div>
              <dt class="text-white/40 uppercase tracking-wider text-xs font-mono mb-1">Créé le</dt>
              <dd class="text-white/70 font-mono text-xs">{{ data.booking.createdAt }}</dd>
            </div>
          </dl>

          <!-- Edit mode -->
          <form v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm" @submit.prevent="save">
            <label class="block">
              <span class="text-xs uppercase tracking-wider text-white/40 block mb-1">Prénom</span>
              <input v-model="form.firstName" class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
            </label>
            <label class="block">
              <span class="text-xs uppercase tracking-wider text-white/40 block mb-1">Nom</span>
              <input v-model="form.lastName" class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
            </label>
            <label class="block">
              <span class="text-xs uppercase tracking-wider text-white/40 block mb-1">Email</span>
              <input v-model="form.email" type="email" class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
            </label>
            <label class="block">
              <span class="text-xs uppercase tracking-wider text-white/40 block mb-1">Téléphone</span>
              <input v-model="form.phone" class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
            </label>
            <label class="block">
              <span class="text-xs uppercase tracking-wider text-white/40 block mb-1">Participants (max 4)</span>
              <input v-model.number="form.numberOfPeople" type="number" min="1" max="4" class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
            </label>
            <label class="block sm:col-span-2">
              <span class="text-xs uppercase tracking-wider text-white/40 block mb-1">Besoins spécifiques</span>
              <textarea v-model="form.specialNeeds" rows="3" maxlength="1000" class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white" />
            </label>
            <div class="sm:col-span-2 flex gap-3 justify-end mt-2">
              <button type="button" class="px-4 py-2 text-sm text-white/60 hover:text-white" :disabled="saving" @click="editing = false">Annuler</button>
              <button type="submit" class="px-5 py-2 text-sm font-medium bg-white text-[var(--color-edition)] rounded-sm hover:bg-white/90 disabled:opacity-50" :disabled="saving">
                {{ saving ? '…' : 'Enregistrer' }}
              </button>
            </div>
          </form>
        </section>

        <!-- Slot + route -->
        <section class="bg-edition-dark border border-white/10 rounded-sm p-6">
          <h2 class="text-base font-semibold mb-4">Créneau</h2>
          <dl class="space-y-3 text-sm">
            <div>
              <dt class="text-white/40 uppercase tracking-wider text-xs font-mono mb-1">Parcours</dt>
              <dd class="text-white">{{ data.route.nameEu }}</dd>
            </div>
            <div>
              <dt class="text-white/40 uppercase tracking-wider text-xs font-mono mb-1">Date</dt>
              <dd class="text-white font-mono">{{ data.slot.date }} · {{ data.slot.startTime }}—{{ data.slot.endTime }}</dd>
            </div>
            <div>
              <dt class="text-white/40 uppercase tracking-wider text-xs font-mono mb-1">Capacité</dt>
              <dd class="text-white">{{ data.slot.bookedCount }} / {{ data.slot.maxParticipants }}</dd>
            </div>
            <div>
              <dt class="text-white/40 uppercase tracking-wider text-xs font-mono mb-1">Check-in</dt>
              <dd>
                <span v-if="data.attendance" class="text-emerald-300">✓ {{ data.attendance.checkedInAt }}</span>
                <span v-else class="text-white/40">Non pointé</span>
              </dd>
            </div>
            <div class="pt-2">
              <NuxtLink :to="`/admin/checkin/${data.slot.id}`" class="text-xs px-3 py-1.5 border border-white/20 rounded-sm hover:bg-white/10 inline-block">
                → Voir check-in
              </NuxtLink>
            </div>
          </dl>
        </section>
      </div>

      <!-- Audit timeline -->
      <section class="mt-6 bg-edition-dark border border-white/10 rounded-sm p-6">
        <h2 class="text-base font-semibold mb-4">Historique</h2>
        <div v-if="data.audit.length === 0" class="text-sm text-white/40">Aucun événement.</div>
        <ol v-else class="space-y-2">
          <li v-for="e in data.audit" :key="e.id" class="flex items-start gap-3 text-sm border-b border-white/5 pb-2 last:border-0">
            <span class="text-xs text-white/40 font-mono shrink-0 w-36">{{ e.timestamp }}</span>
            <span class="text-xs uppercase tracking-wider font-mono text-white/50 shrink-0 w-16">{{ e.actor }}</span>
            <span class="font-mono text-xs shrink-0 w-48" :class="actionColor(e.action)">{{ e.action }}</span>
            <span v-if="e.metadata" class="text-xs text-white/40 font-mono truncate flex-1">{{ JSON.stringify(e.metadata) }}</span>
          </li>
        </ol>
      </section>
    </template>
  </div>
</template>
