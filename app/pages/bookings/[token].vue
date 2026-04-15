<script setup lang="ts">
interface BookingPayload {
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
    createdAt: string
  }
  slot: {
    id: string
    date: string
    startTime: string
    endTime: string
    language: string
    maxParticipants: number
  }
  route: {
    id: string
    slug: string
    name: { eu: string, es: string, fr: string, en: string }
    color: string
    durationMinutes: number
    distanceMeters: number
  }
}

const { t } = useI18n()
const tr = useTranslated()
const localePath = useLocalePath()
const routeParam = useRoute()
const token = computed(() => String(routeParam.params.token))

definePageMeta({
  layout: 'default',
})

useSeoMeta({
  title: 'Irekiak — Ma réservation',
  robots: 'noindex, nofollow',
})

const { data, pending, error, refresh } = await useFetch<BookingPayload>(
  () => `/api/bookings/${token.value}`,
  { key: `booking-${token.value}`, lazy: true, default: () => null as unknown as BookingPayload },
)

const cancelling = ref(false)
const cancelError = ref<string | null>(null)
const cancelConfirmOpen = ref(false)

async function confirmCancel() {
  cancelling.value = true
  cancelError.value = null
  try {
    await $fetch(`/api/bookings/${token.value}`, { method: 'DELETE' })
    await refresh()
    cancelConfirmOpen.value = false
  }
  catch (err: unknown) {
    cancelError.value = (err as { statusMessage?: string })?.statusMessage ?? 'Cancel failed'
  }
  finally {
    cancelling.value = false
  }
}

const statusBadgeClass = computed(() => {
  const s = data.value?.booking?.status
  if (s === 'confirmed') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  if (s === 'cancelled') return 'bg-red-500/20 text-red-300 border-red-500/30'
  return 'bg-white/10 text-white/70 border-white/20'
})

function durationLabel(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h${m ? ` ${m}min` : ''}` : `${m}min`
}

function distanceLabel(meters: number) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1).replace('.0', '')} km`
  return `${meters} m`
}
</script>

<template>
  <div class="max-w-[900px] mx-auto px-6 md:px-12 py-24 pt-28">
    <NuxtLink :to="localePath('/')" class="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-8">
      &larr; {{ t('nav.home') || 'Accueil' }}
    </NuxtLink>

    <div v-if="pending" class="text-white/50 text-center py-20">
      {{ t('common.loading') || 'Chargement…' }}
    </div>

    <div v-else-if="error || !data" class="text-center py-20">
      <p class="text-white/70 mb-4">{{ t('booking.notFound') || 'Réservation introuvable.' }}</p>
      <NuxtLink :to="localePath('/visites')" class="inline-block px-6 py-2.5 text-sm bg-white text-[var(--color-edition)] hover:bg-white/90 transition-colors">
        {{ t('nav.tours') || 'Visites guidées' }}
      </NuxtLink>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="mb-10">
        <div class="h-1 w-24 rounded-full mb-6" :style="{ backgroundColor: data.route.color }" />
        <div class="flex flex-wrap items-center gap-3 mb-3">
          <h1 class="m-0">{{ tr(data.route.name) }}</h1>
          <span
            class="inline-block text-[11px] font-medium px-3 py-1 rounded-full border uppercase tracking-wider"
            :class="statusBadgeClass"
          >
            {{ data.booking.status }}
          </span>
        </div>
        <div class="flex gap-3 text-sm text-white/50 font-mono">
          <span>{{ durationLabel(data.route.durationMinutes) }}</span>
          <span>&middot;</span>
          <span>{{ distanceLabel(data.route.distanceMeters) }}</span>
        </div>
      </div>

      <!-- Details card -->
      <section class="bg-edition-dark p-6 md:p-10 rounded-sm mb-6">
        <h2 class="text-xl font-semibold text-white mb-6">
          {{ t('booking.bookingDetails') || 'Détails de la réservation' }}
        </h2>

        <dl class="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-10 text-sm">
          <div>
            <dt class="text-white/40 uppercase tracking-wider text-xs font-mono mb-1">{{ t('booking.date') || 'Date' }}</dt>
            <dd class="text-white font-medium">{{ data.slot.date }}</dd>
          </div>
          <div>
            <dt class="text-white/40 uppercase tracking-wider text-xs font-mono mb-1">{{ t('booking.time') || 'Horaire' }}</dt>
            <dd class="text-white font-medium font-mono">{{ data.slot.startTime }} — {{ data.slot.endTime }}</dd>
          </div>
          <div>
            <dt class="text-white/40 uppercase tracking-wider text-xs font-mono mb-1">{{ t('booking.name') || 'Nom' }}</dt>
            <dd class="text-white font-medium">{{ data.booking.firstName }} {{ data.booking.lastName }}</dd>
          </div>
          <div>
            <dt class="text-white/40 uppercase tracking-wider text-xs font-mono mb-1">{{ t('booking.email') || 'Email' }}</dt>
            <dd class="text-white font-medium break-all">{{ data.booking.email }}</dd>
          </div>
          <div v-if="data.booking.phone">
            <dt class="text-white/40 uppercase tracking-wider text-xs font-mono mb-1">{{ t('booking.phone') || 'Téléphone' }}</dt>
            <dd class="text-white font-medium">{{ data.booking.phone }}</dd>
          </div>
          <div>
            <dt class="text-white/40 uppercase tracking-wider text-xs font-mono mb-1">{{ t('booking.guests') || 'Participants' }}</dt>
            <dd class="text-white font-medium">{{ data.booking.numberOfPeople }}</dd>
          </div>
          <div>
            <dt class="text-white/40 uppercase tracking-wider text-xs font-mono mb-1">{{ t('booking.language') || 'Langue' }}</dt>
            <dd class="text-white font-medium uppercase">{{ data.booking.language }}</dd>
          </div>
          <div class="md:col-span-2" v-if="data.booking.specialNeeds">
            <dt class="text-white/40 uppercase tracking-wider text-xs font-mono mb-1">{{ t('booking.specialNeeds') || 'Besoins spécifiques' }}</dt>
            <dd class="text-white/90">{{ data.booking.specialNeeds }}</dd>
          </div>
          <div class="md:col-span-2">
            <dt class="text-white/40 uppercase tracking-wider text-xs font-mono mb-1">{{ t('booking.reference') || 'Référence' }}</dt>
            <dd class="text-white/80 font-mono text-xs break-all">{{ data.booking.id }}</dd>
          </div>
        </dl>
      </section>

      <!-- Actions -->
      <section v-if="data.booking.status === 'confirmed'" class="flex flex-wrap items-center gap-3">
        <a
          :href="`/api/bookings/${data.booking.confirmToken}/ics`"
          class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium border border-white/25 text-white hover:bg-white/10 transition-colors rounded-sm"
        >
          {{ t('booking.addToCalendar') || 'Ajouter au calendrier' }}
        </a>
        <button
          type="button"
          class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium border border-red-500/40 text-red-300 hover:bg-red-500/10 transition-colors rounded-sm"
          @click="cancelConfirmOpen = true"
        >
          {{ t('booking.cancel') || 'Annuler ma réservation' }}
        </button>
      </section>

      <div
        v-else-if="data.booking.status === 'cancelled'"
        class="bg-red-500/10 border border-red-500/30 rounded-sm p-5 text-sm text-red-200"
      >
        {{ t('booking.alreadyCancelled') || 'Cette réservation a été annulée.' }}
      </div>

      <!-- Cancel confirm modal -->
      <Transition name="fade">
        <div
          v-if="cancelConfirmOpen"
          class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm px-6"
          @click.self="cancelConfirmOpen = false"
        >
          <div class="max-w-md w-full bg-[var(--color-edition)] border border-white/15 rounded-sm p-6 md:p-8">
            <h3 class="text-lg font-semibold text-white mb-3">
              {{ t('booking.cancelConfirmTitle') || 'Confirmer l\'annulation' }}
            </h3>
            <p class="text-sm text-white/70 mb-6 leading-relaxed">
              {{ t('booking.cancelConfirmBody') || 'Ta place sera libérée pour d\'autres visiteurs. Cette action est irréversible.' }}
            </p>
            <p v-if="cancelError" class="text-sm text-red-300 mb-4">{{ cancelError }}</p>
            <div class="flex flex-wrap gap-3 justify-end">
              <button
                type="button"
                class="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
                :disabled="cancelling"
                @click="cancelConfirmOpen = false"
              >
                {{ t('common.cancel') || 'Annuler' }}
              </button>
              <button
                type="button"
                class="px-5 py-2 text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors rounded-sm disabled:opacity-50"
                :disabled="cancelling"
                @click="confirmCancel"
              >
                {{ cancelling ? (t('common.loading') || '…') : (t('booking.confirmCancel') || 'Confirmer l\'annulation') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </template>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 200ms ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
