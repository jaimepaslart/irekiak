<script setup lang="ts">
interface Participant {
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

interface ParticipantsResponse {
  slot: SlotInfo
  participants: Participant[]
}

definePageMeta({ layout: 'galeriste', i18n: false })
useSeoMeta({ title: 'Irekiak · Check-in', robots: 'noindex, nofollow' })

const route = useRoute()
const router = useRouter()
const routeSlug = computed(() => String(route.params.route ?? ''))
const slotId = computed(() => String(route.params.slotId ?? ''))

const { t, locale } = useAdminT()
const { token, clearToken, authedFetch } = useGaleriste(routeSlug.value)

const slot = ref<SlotInfo | null>(null)
const participants = ref<Participant[]>([])
const loading = ref(true)
const errorMessage = ref<string | null>(null)
const accessDenied = ref(false)
const savingIds = ref<Set<string>>(new Set())

onMounted(() => {
  if (!token.value) {
    accessDenied.value = true
    loading.value = false
    return
  }
  void load()
})

async function load(): Promise<void> {
  loading.value = true
  errorMessage.value = null
  try {
    const res = await authedFetch<ParticipantsResponse>(
      `/api/galeristes/${routeSlug.value}/slots/${slotId.value}/participants`,
    )
    slot.value = res.slot
    participants.value = res.participants ?? []
  }
  catch (err: unknown) {
    const code = (err as { statusCode?: number })?.statusCode
    if (code === 401 || code === 403) {
      clearToken()
      accessDenied.value = true
    }
    else {
      errorMessage.value = t('galeriste.loading')
    }
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
    await authedFetch(
      `/api/galeristes/${routeSlug.value}/slots/${slotId.value}/attendance`,
      { method: 'POST', body: { bookingId, present } },
    )
    if (slot.value) {
      slot.value.attendedCount += present ? 1 : -1
    }
  }
  catch (err: unknown) {
    participants.value[idx]!.attended = previous
    const msg = (err as { statusMessage?: string })?.statusMessage ?? ''
    alert(`${t('galeriste.saveError')}: ${msg}`)
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

function backToList(): void {
  void router.push(`/galeristes/${routeSlug.value}`)
}
</script>

<template>
  <div>
    <button
      type="button"
      class="inline-flex items-center text-sm text-white/60 hover:text-white transition-colors mb-4"
      @click="backToList"
    >
      {{ t('galeriste.back') }}
    </button>

    <div v-if="accessDenied" class="text-center py-16">
      <h2 class="text-xl font-light mb-3">{{ t('galeriste.invalidLink') }}</h2>
      <p class="text-sm text-white/50 max-w-sm mx-auto">{{ t('galeriste.invalidLinkDesc') }}</p>
    </div>

    <template v-else>
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
            {{ t('galeriste.arrived', { count: attendedCount }).split(' ').slice(1).join(' ') }}
          </div>
        </div>

        <AdminEmptyState
          v-if="participants.length === 0"
          :title="t('galeriste.noParticipants')"
          :description="t('galeriste.noParticipantsDesc')"
          icon="📋"
        />

        <div v-else class="space-y-3">
          <GaleristeParticipantCard
            v-for="p in participants"
            :key="p.id"
            :participant="p"
            :saving="savingIds.has(p.id)"
            @toggle="toggleAttendance"
          />
        </div>
      </template>
    </template>
  </div>
</template>
