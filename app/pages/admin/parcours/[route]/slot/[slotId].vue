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

const route = useRoute()
const router = useRouter()
const routeSlug = computed(() => String(route.params.route ?? ''))
const slotId = computed(() => String(route.params.slotId ?? ''))

const { t, localized, formatLongDate } = useAdminT()
const token = inject<Ref<string>>('adminToken')!

const expectedRoute = computed(() => findRouteBySlug(tourRoutes, routeSlug.value))

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

const routeName = computed(() => expectedRoute.value ? localized(expectedRoute.value.name) : '')
const longDate = computed(() => slot.value ? formatLongDate(slot.value.date) : '')

const totalParticipants = computed(() => participants.value.length)
const attendedCount = computed(() => participants.value.filter(p => p.attended).length)

const progressPct = computed(() => {
  if (totalParticipants.value === 0) return 0
  return Math.round((attendedCount.value / totalParticipants.value) * 100)
})

function backToRoute(): void {
  void router.push(`/admin/parcours/${routeSlug.value}`)
}
</script>

<template>
  <div class="relative max-w-4xl mx-auto">
    <div class="absolute inset-x-0 -top-10 -bottom-10 editorial-grain pointer-events-none opacity-60" aria-hidden="true"></div>

    <button
      type="button"
      class="relative inline-flex items-center text-xs text-white/50 hover:text-gold font-mono uppercase tracking-[0.18em] transition-colors mb-6 arrow-nudge-parent"
      @click="backToRoute"
    >
      <span class="arrow-nudge-back mr-1">←</span> {{ t('parcours.backToRoute') }}
    </button>

    <p v-if="errorMessage" class="relative text-sm text-red-300 mb-4">{{ errorMessage }}</p>

    <template v-if="loading && !slot">
      <div class="relative space-y-3">
        <AdminSkeleton variant="card" :count="6" />
      </div>
    </template>

    <template v-else-if="slot">
      <section class="relative mb-10 md:mb-12 editorial-in">
        <div class="eyebrow mb-4">
          {{ t('parcours.checkinEyebrow') }} · {{ routeName }}
        </div>
        <h1 class="font-serif text-3xl md:text-4xl text-white" style="font-weight: 400; letter-spacing: -0.01em; line-height: 1.1;">
          {{ longDate }}
        </h1>
        <p class="mt-2 flex items-baseline gap-3 text-white/70">
          <span class="font-serif text-2xl md:text-3xl tabular-nums" style="font-weight: 400;">{{ slot.startTime }}</span>
          <span class="text-white/35 text-sm tabular-nums">→ {{ slot.endTime }}</span>
          <span class="text-white/30 text-sm">·</span>
          <span class="text-xs text-white/50 uppercase tracking-wider font-mono">{{ slot.language.toUpperCase() }}</span>
        </p>
        <div class="mt-6 h-px w-24 bg-[var(--color-accent-gold)] opacity-50"></div>
      </section>

      <section
        class="relative mb-12 md:mb-14 editorial-in"
        :style="{ animationDelay: '120ms' }"
        aria-live="polite"
      >
        <div class="flex flex-col items-center text-center">
          <div class="flex items-baseline justify-center gap-2 mb-2">
            <span
              class="font-serif text-7xl md:text-8xl text-white tabular-nums leading-none transition-transform duration-300"
              style="font-weight: 400; letter-spacing: -0.03em;"
              :class="{ 'pulse-subtle': attendedCount > 0 && attendedCount < totalParticipants }"
            >
              {{ attendedCount }}
            </span>
            <span class="font-serif text-3xl md:text-4xl text-white/35 tabular-nums" style="font-weight: 400;">
              /{{ totalParticipants }}
            </span>
          </div>
          <p class="font-serif italic text-sm text-white/55 mb-5">{{ t('parcours.arrivedLabel') }}</p>
          <div class="w-full max-w-xs h-[3px] bg-white/10 overflow-hidden">
            <div
              class="h-full transition-[width] duration-700 ease-out"
              :style="{ width: `${progressPct}%`, backgroundColor: 'var(--color-accent-gold)' }"
            />
          </div>
        </div>
      </section>

      <AdminEmptyState
        v-if="participants.length === 0"
        :title="t('parcours.noParticipants')"
        :description="t('parcours.noParticipantsDesc')"
        icon="📋"
      />

      <div v-else class="relative space-y-4">
        <AdminParcoursParticipantCard
          v-for="(p, i) in participants"
          :key="p.id"
          :participant="p"
          :saving="savingIds.has(p.id)"
          :index="i"
          @toggle="toggleAttendance"
        />
      </div>
    </template>
  </div>
</template>
