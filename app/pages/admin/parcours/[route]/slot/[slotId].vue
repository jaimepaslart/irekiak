<script setup lang="ts">
import type { Ref } from 'vue'
import type { TourRoute } from '#types/tour'
import { tourRoutes as tourRoutesData } from '@data/tours'

const tourRoutes = tourRoutesData as TourRoute[]

definePageMeta({ layout: 'admin', i18n: false })
useSeoMeta({ title: 'Admin · Check-in', robots: 'noindex, nofollow' })

interface Participant {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  guests: number
  language: string
  specialNeeds: string | null
  confirmToken: string
  attended: boolean
  attendanceNotes: string | null
}

interface CheckinData {
  slot: {
    id: string
    date: string
    startTime: string
    endTime: string
    language: string
    maxParticipants: number
    bookedCount: number
  }
  route: {
    id: string
    nameEu: string
    nameEs: string
    nameFr: string
    nameEn: string
    color: string
  }
  participants: Participant[]
  totalGuests: number
  attendedCount: number
}

interface SlotInfo {
  id: string
  date: string
  startTime: string
  endTime: string
  language: string
  capacity: number
  booked: number
  attendedCount: number
}

interface ParticipantCardData {
  id: string
  firstName: string
  lastName: string
  phone: string | null
  numberOfPeople: number
  language: string
  specialNeeds: string | null
  attended: boolean
  attendanceNotes: string | null
}

const routeParam = useRoute()
const router = useRouter()
const routeSlug = computed(() => String(routeParam.params.route ?? ''))
const slotId = computed(() => String(routeParam.params.slotId ?? ''))

const { t, locale } = useAdminT()
const token = inject<Ref<string>>('adminToken')!

const expectedRoute = computed(() => {
  return tourRoutes.find(r => (r.slug || r.id.replace(/^route-/, '')) === routeSlug.value) ?? null
})

const slot = ref<SlotInfo | null>(null)
const participants = ref<ParticipantCardData[]>([])
const loading = ref(true)
const errorMessage = ref<string | null>(null)
const savingIds = ref<Set<string>>(new Set())

onMounted(() => {
  if (!expectedRoute.value) {
    throw createError({ statusCode: 404, statusMessage: 'Parcours not found' })
  }
  void load()
})

async function load(): Promise<void> {
  loading.value = true
  errorMessage.value = null
  try {
    const res = await $fetch<CheckinData>(
      `/api/admin/checkin/${slotId.value}`,
      { headers: { 'x-admin-token': token.value } },
    )
    // Cross-route guard : si le slot n'appartient pas au parcours attendu → 404
    if (expectedRoute.value && res.route.id !== expectedRoute.value.id) {
      throw createError({ statusCode: 404, statusMessage: 'Slot does not belong to this parcours' })
    }
    slot.value = {
      id: res.slot.id,
      date: res.slot.date,
      startTime: res.slot.startTime,
      endTime: res.slot.endTime,
      language: res.slot.language,
      capacity: res.slot.maxParticipants,
      booked: res.slot.bookedCount,
      attendedCount: res.attendedCount,
    }
    participants.value = res.participants.map(p => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      phone: p.phone,
      numberOfPeople: p.guests,
      language: p.language,
      specialNeeds: p.specialNeeds,
      attended: p.attended,
      attendanceNotes: p.attendanceNotes,
    }))
  }
  catch (err: unknown) {
    const code = (err as { statusCode?: number })?.statusCode
    if (code === 404) throw err as Error
    errorMessage.value = (err as { statusMessage?: string })?.statusMessage ?? t('checkin.loadFailed')
  }
  finally {
    loading.value = false
  }
}

async function toggleAttendance(bookingId: string, present: boolean): Promise<void> {
  const idx = participants.value.findIndex(p => p.id === bookingId)
  if (idx === -1) return
  const previous = participants.value[idx]!.attended
  participants.value[idx]!.attended = present
  savingIds.value.add(bookingId)
  try {
    await $fetch(
      `/api/admin/checkin/${slotId.value}/attendance`,
      {
        method: 'POST',
        headers: { 'x-admin-token': token.value, 'Content-Type': 'application/json' },
        body: { bookingId, present },
      },
    )
    if (slot.value) {
      slot.value.attendedCount += present ? 1 : -1
    }
  }
  catch (err: unknown) {
    participants.value[idx]!.attended = previous
    const msg = (err as { statusMessage?: string })?.statusMessage ?? ''
    alert(`${t('parcours.saveError')}: ${msg}`)
  }
  finally {
    savingIds.value.delete(bookingId)
  }
}

const slotTitle = computed(() => {
  if (!slot.value) return ''
  const d = new Date(`${slot.value.date}T00:00:00`)
  const intl = new Intl.DateTimeFormat(locale.value === 'es' ? 'es-ES' : 'fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const day = intl.format(d).replace(/^./, c => c.toUpperCase())
  return `${day} · ${slot.value.startTime} · ${slot.value.language.toUpperCase()}`
})

const totalParticipants = computed(() => participants.value.length)
const attendedCount = computed(() => participants.value.filter(p => p.attended).length)

function backToRoute(): void {
  void router.push(`/admin/parcours/${routeSlug.value}`)
}
</script>

<template>
  <div>
    <button
      type="button"
      class="inline-flex items-center text-sm text-white/60 hover:text-white transition-colors mb-4"
      @click="backToRoute"
    >
      {{ t('parcours.backToRoute') }}
    </button>

    <p v-if="errorMessage" class="text-sm text-red-300 mb-4">{{ errorMessage }}</p>

    <template v-if="loading && !slot">
      <div class="space-y-3">
        <AdminSkeleton variant="card" :count="6" />
      </div>
    </template>

    <template v-else-if="slot">
      <h2 class="text-lg font-light mb-2">{{ slotTitle }}</h2>

      <div class="my-6 text-center">
        <div class="inline-flex items-baseline gap-1">
          <span class="text-5xl font-light tabular-nums text-emerald-300">{{ attendedCount }}</span>
          <span class="text-3xl font-light tabular-nums text-white/40">/{{ totalParticipants }}</span>
        </div>
        <div class="text-xs uppercase tracking-wider text-white/50 font-mono mt-1">
          {{ t('parcours.arrived') }}
        </div>
      </div>

      <AdminEmptyState
        v-if="participants.length === 0"
        :title="t('parcours.noParticipants')"
        :description="t('parcours.noParticipantsDesc')"
        icon="📋"
      />

      <div v-else class="space-y-3">
        <AdminParcoursParticipantCard
          v-for="p in participants"
          :key="p.id"
          :participant="p"
          :saving="savingIds.has(p.id)"
          @toggle="toggleAttendance"
        />
      </div>
    </template>
  </div>
</template>
