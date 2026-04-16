<script setup lang="ts">
interface AdminBookingRow {
  id: string
  createdAt: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  guests: number
  language: string
  status: 'confirmed' | 'cancelled' | 'waitlist'
  confirmToken: string
  slotDate: string
  slotStartTime: string
  routeId: string
  routeNameEu: string
}

interface StatsPayload {
  totals: { bookingsCount: number, cancelledCount: number, guests: number, capacity: number, booked: number, avgFillRate: number }
  byDate: Record<string, number>
  byRoute: Record<string, number>
  byLanguage: Record<string, number>
  fillRate: Array<{ slotId: string, date: string, startTime: string, routeId: string, language: string, booked: number, max: number, rate: number }>
  recentBookings: AdminBookingRow[]
}

interface AvailabilitySlot {
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
const { dates, year } = useEdition()
const router = useRouter()

useSeoMeta({ title: () => t('bookings.seoTitleList'), robots: 'noindex, nofollow' })

const token = inject<Ref<string>>('adminToken')!

const rawBookings = ref<AdminBookingRow[]>([])
const stats = ref<StatsPayload | null>(null)
const loading = ref(true)
const errorMessage = ref<string | null>(null)

type StatusFilter = 'all' | 'confirmed' | 'cancelled' | 'waitlist'
const statusFilter = ref<StatusFilter>('all')
const dateFilter = ref<string>('all')
const routeFilter = ref<string>('all')
const searchQuery = ref<string>('')
const currentPage = ref(1)
const pageSize = 20

const todayIso = new Date().toISOString().split('T')[0]!

const filteredBookings = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return rawBookings.value.filter((b) => {
    if (statusFilter.value === 'confirmed' && b.status !== 'confirmed') return false
    if (statusFilter.value === 'cancelled' && b.status !== 'cancelled') return false
    if (statusFilter.value === 'waitlist' && b.status !== 'waitlist') return false
    if (dateFilter.value !== 'all' && b.slotDate !== dateFilter.value) return false
    if (routeFilter.value !== 'all' && b.routeId !== routeFilter.value) return false
    if (q) {
      const hay = `${b.firstName} ${b.lastName} ${b.email} ${b.id} ${b.phone ?? ''} ${b.routeId} ${b.language}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredBookings.value.length / pageSize)))
const pagedBookings = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredBookings.value.slice(start, start + pageSize)
})

const editionDates = computed(() => dates.value)

const confirmedCount = computed(() =>
  rawBookings.value.filter(b => b.status === 'confirmed').length,
)

const heroSubtitle = computed(() => {
  const count = confirmedCount.value
  if (count === 0) return t('bookings.heroSubtitleEmpty', { year: year.value })
  if (count === 1) return t('bookings.heroSubtitleOne', { count, year: year.value })
  return t('bookings.heroSubtitleMany', { count, year: year.value })
})

function formatDateChip(iso: string): string {
  const day = iso.slice(8, 10)
  const month = parseInt(iso.slice(5, 7), 10)
  const months = ['', 'jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc']
  return `${parseInt(day, 10)} ${months[month] ?? ''}`
}

const statusChipOptions = computed(() => [
  { value: 'all', label: t('bookings.filterChipAll'), count: rawBookings.value.length },
  { value: 'confirmed', label: t('bookings.filterChipConfirmed'), count: rawBookings.value.filter(b => b.status === 'confirmed').length },
  { value: 'cancelled', label: t('bookings.filterChipCancelled'), count: rawBookings.value.filter(b => b.status === 'cancelled').length },
  { value: 'waitlist', label: t('bookings.filterChipWaitlist'), count: rawBookings.value.filter(b => b.status === 'waitlist').length },
])

const dateChipOptions = computed(() => {
  const opts = [{ value: 'all', label: t('bookings.filterChipAllDates'), count: rawBookings.value.length }]
  for (const d of editionDates.value) {
    opts.push({
      value: d,
      label: formatDateChip(d),
      count: rawBookings.value.filter(b => b.slotDate === d).length,
    })
  }
  return opts
})

const routeChipOptions = computed(() => {
  const counts = new Map<string, number>()
  for (const b of rawBookings.value) counts.set(b.routeId, (counts.get(b.routeId) ?? 0) + 1)
  const opts: Array<{ value: string, label: string, count: number }> = [
    { value: 'all', label: t('bookings.filterChipAllRoutes'), count: rawBookings.value.length },
  ]
  for (const [routeId, count] of counts) {
    opts.push({ value: routeId, label: abbrevRoute(routeId), count })
  }
  return opts
})

function abbrevRoute(routeId: string): string {
  const parts = routeSlugFromId(routeId).split('-')
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('+')
}

function formatSlotDate(iso: string): string {
  const day = parseInt(iso.slice(8, 10), 10)
  const month = parseInt(iso.slice(5, 7), 10)
  const months = ['', 'jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc']
  return `${day} ${months[month] ?? ''}`
}

watch([statusFilter, dateFilter, routeFilter, searchQuery], () => {
  currentPage.value = 1
})

onMounted(() => { void loadAll() })

async function loadAll() {
  loading.value = true
  errorMessage.value = null
  try {
    const [b, s] = await Promise.all([
      $fetch<AdminBookingRow[]>('/api/admin/bookings', { headers: { 'x-admin-token': token.value } }),
      $fetch<StatsPayload>('/api/admin/stats', { headers: { 'x-admin-token': token.value } }),
    ])
    rawBookings.value = b
    stats.value = s
  }
  catch (err: unknown) {
    errorMessage.value = (err as { statusMessage?: string })?.statusMessage ?? t('bookings.loadFailed')
  }
  finally { loading.value = false }
}

function exportCsv() {
  const header = ['id', 'created_at', 'status', 'first_name', 'last_name', 'email', 'phone', 'guests', 'language', 'date', 'start_time', 'route']
  const rows = filteredBookings.value.map(b => [
    b.id, b.createdAt, b.status, b.firstName, b.lastName, b.email, b.phone ?? '',
    String(b.guests), b.language, b.slotDate, b.slotStartTime, b.routeNameEu,
  ])
  const csv = [header, ...rows].map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `irekiak-bookings-${todayIso}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function statusBadgeStatus(s: 'confirmed' | 'cancelled' | 'waitlist'): 'confirmed' | 'cancelled' | 'waitlist' {
  return s
}
function statusBadgeLabel(s: 'confirmed' | 'cancelled' | 'waitlist'): string {
  if (s === 'confirmed') return t('bookings.statusConfirmed')
  if (s === 'cancelled') return t('bookings.statusCancelled')
  return t('bookings.statusWaitlist')
}

function goToDetail(id: string): void {
  void router.push(`/admin/bookings/${id}`)
}

const newOpen = ref(false)
const newSubmitting = ref(false)
const newError = ref<string | null>(null)
const newSuccess = ref<string | null>(null)
const slots = ref<AvailabilitySlot[]>([])
const slotsLoading = ref(false)

interface NewForm {
  tourSlotId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  numberOfPeople: number
  language: 'eu' | 'es' | 'fr' | 'en'
  bypassCapacity: boolean
  notify: boolean
  notifyGalleries: boolean
}
const newForm = reactive<NewForm>({
  tourSlotId: '', firstName: '', lastName: '', email: '', phone: '',
  numberOfPeople: 1, language: 'es',
  bypassCapacity: false, notify: true, notifyGalleries: true,
})

async function openNewDrawer() {
  newError.value = null
  newSuccess.value = null
  Object.assign(newForm, {
    tourSlotId: '', firstName: '', lastName: '', email: '', phone: '',
    numberOfPeople: 1, language: 'es',
    bypassCapacity: false, notify: true, notifyGalleries: true,
  })
  newOpen.value = true
  if (slots.value.length === 0) {
    slotsLoading.value = true
    try {
      slots.value = await $fetch<AvailabilitySlot[]>('/api/bookings/availability')
    }
    catch (err: unknown) {
      newError.value = (err as { statusMessage?: string })?.statusMessage ?? t('bookings.loadFailed')
    }
    finally { slotsLoading.value = false }
  }
}

async function submitNew() {
  newSubmitting.value = true
  newError.value = null
  newSuccess.value = null
  try {
    const res = await $fetch<{ ok: boolean, bookingId: string }>('/api/admin/bookings', {
      method: 'POST',
      headers: { 'x-admin-token': token.value, 'Content-Type': 'application/json' },
      body: {
        tourSlotId: newForm.tourSlotId,
        firstName: newForm.firstName.trim(),
        lastName: newForm.lastName.trim(),
        email: newForm.email.trim(),
        phone: newForm.phone.trim() || undefined,
        numberOfPeople: newForm.numberOfPeople,
        language: newForm.language,
        bypassCapacity: newForm.bypassCapacity,
        notify: newForm.notify,
        notifyGalleries: newForm.notifyGalleries,
        acceptsMarketing: false,
      },
    })
    newSuccess.value = res.bookingId
    newOpen.value = false
    await loadAll()
  }
  catch (err: unknown) {
    const e = err as { statusMessage?: string, data?: { remaining?: number } }
    newError.value = e?.statusMessage ?? t('bookings.submitFailed')
    if (e?.data?.remaining !== undefined) {
      newError.value += t('bookings.remainingPlacesHint', { remaining: e.data.remaining })
    }
  }
  finally { newSubmitting.value = false }
}
</script>

<template>
  <div class="relative max-w-5xl mx-auto">
    <AdminGrain />

    <AdminHeroSection
      :eyebrow="t('bookings.heroEyebrow', { year })"
      :title="t('bookings.title')"
      :subtitle="heroSubtitle"
      title-size="lg"
    >
      <template #actions>
        <AdminBaseButton variant="secondary" type="button" @click="loadAll">
          {{ t('bookings.refresh') }}
        </AdminBaseButton>
        <AdminBaseButton variant="secondary" type="button" @click="exportCsv">
          {{ t('bookings.csvExport') }}
        </AdminBaseButton>
        <AdminBaseButton variant="primary" type="button" @click="openNewDrawer">
          {{ t('bookings.new') }}
        </AdminBaseButton>
      </template>
    </AdminHeroSection>

    <p v-if="errorMessage" class="text-sm text-red-300 mb-6">{{ errorMessage }}</p>
    <p v-if="newSuccess" class="text-sm text-emerald-300 mb-6">{{ t('bookings.createSuccess') }} ({{ newSuccess }})</p>

    <div v-if="loading && !stats" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
      <AdminSkeleton variant="stat" :count="3" />
    </div>

    <div v-if="stats" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
      <AdminMiniStatCard
        :eyebrow="t('bookings.statsBookings')"
        :value="stats.totals.bookingsCount"
        :subtitle="t('bookings.statsCancelled', { count: stats.totals.cancelledCount })"
        :delay="80"
      />
      <AdminMiniStatCard
        :eyebrow="t('bookings.statsParticipants')"
        :value="stats.totals.guests"
        :subtitle="t('bookings.statsCapacityOf', { capacity: stats.totals.capacity })"
        :delay="140"
      />
      <AdminMiniStatCard
        :eyebrow="t('bookings.statsFillRate')"
        :value="`${stats.totals.avgFillRate}%`"
        :delay="200"
      />
    </div>

    <div class="relative mb-8 max-w-2xl mx-auto">
      <input
        v-model="searchQuery"
        type="search"
        :placeholder="t('bookings.searchPlaceholder')"
        class="w-full block bg-transparent border-b border-white/15 rounded-none text-base px-0 py-3 text-white placeholder:italic placeholder:font-serif placeholder:text-white/35 focus:outline-none focus:border-[var(--color-accent-gold)] transition-colors"
      >
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
      <div>
        <p class="eyebrow mb-3">{{ t('bookings.filterByStatus') }}</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="option in statusChipOptions"
            :key="option.value"
            type="button"
            :aria-pressed="statusFilter === option.value"
            class="px-3 py-1.5 text-xs font-mono uppercase tracking-[0.14em] rounded-full border transition-colors"
            :class="statusFilter === option.value
              ? 'bg-gold-soft text-gold border-gold-soft'
              : 'border-white/10 text-white/50 hover:text-white hover:border-white/25'"
            @click="statusFilter = option.value as StatusFilter"
          >
            {{ option.label }}<span v-if="option.count !== undefined" class="opacity-50 ml-1.5 tabular-nums">{{ option.count }}</span>
          </button>
        </div>
      </div>
      <div>
        <p class="eyebrow mb-3">{{ t('bookings.filterByDate') }}</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="option in dateChipOptions"
            :key="option.value"
            type="button"
            :aria-pressed="dateFilter === option.value"
            class="px-3 py-1.5 text-xs font-mono uppercase tracking-[0.14em] rounded-full border transition-colors"
            :class="dateFilter === option.value
              ? 'bg-gold-soft text-gold border-gold-soft'
              : 'border-white/10 text-white/50 hover:text-white hover:border-white/25'"
            @click="dateFilter = option.value"
          >
            {{ option.label }}<span v-if="option.count !== undefined" class="opacity-50 ml-1.5 tabular-nums">{{ option.count }}</span>
          </button>
        </div>
      </div>
      <div v-if="routeChipOptions.length > 1">
        <p class="eyebrow mb-3">{{ t('bookings.filterByRoute') }}</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="option in routeChipOptions"
            :key="option.value"
            type="button"
            :aria-pressed="routeFilter === option.value"
            class="px-3 py-1.5 text-xs font-mono uppercase tracking-[0.14em] rounded-full border transition-colors"
            :class="routeFilter === option.value
              ? 'bg-gold-soft text-gold border-gold-soft'
              : 'border-white/10 text-white/50 hover:text-white hover:border-white/25'"
            @click="routeFilter = option.value"
          >
            {{ option.label }}<span v-if="option.count !== undefined" class="opacity-50 ml-1.5 tabular-nums">{{ option.count }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="relative border border-white/10 bg-[var(--color-edition-dark)] rounded-sm overflow-hidden editorial-in" :style="{ animationDelay: '260ms' }">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left border-b border-white/10">
              <th class="px-5 py-4 eyebrow font-normal">{{ t('bookings.columnVisitor') }}</th>
              <th class="px-5 py-4 eyebrow font-normal">{{ t('bookings.columnSlot') }}</th>
              <th class="px-5 py-4 eyebrow font-normal">{{ t('bookings.columnStatus') }}</th>
              <th class="px-5 py-4 eyebrow font-normal text-right">{{ t('bookings.columnParticipants') }}</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="loading && rawBookings.length === 0">
              <tr v-for="n in 8" :key="`skeleton-${n}`" class="border-t border-white/[0.05] animate-pulse">
                <td class="px-5 py-4"><div class="h-3 w-40 bg-white/10 rounded" /></td>
                <td class="px-5 py-4"><div class="h-3 w-44 bg-white/10 rounded" /></td>
                <td class="px-5 py-4"><div class="h-5 w-24 bg-white/10 rounded-full" /></td>
                <td class="px-5 py-4"><div class="h-3 w-6 bg-white/10 rounded ml-auto" /></td>
              </tr>
            </template>
            <tr v-else-if="filteredBookings.length === 0">
              <td colspan="4" class="px-0 py-0">
                <AdminEmptyState :title="t('bookings.emptyState')" :description="t('bookings.emptyStateDesc')">
                  <template #action>
                    <AdminBaseButton variant="primary" type="button" @click="openNewDrawer">
                      {{ t('bookings.emptyStateCta') }}
                    </AdminBaseButton>
                  </template>
                </AdminEmptyState>
              </td>
            </tr>
            <tr
              v-for="b in pagedBookings"
              :key="b.id"
              class="border-t border-white/[0.05] hover:bg-white/[0.02] transition-colors cursor-pointer focus-gold"
              tabindex="0"
              @click="goToDetail(b.id)"
              @keydown.enter="goToDetail(b.id)"
              @keydown.space.prevent="goToDetail(b.id)"
            >
              <td class="px-5 py-4">
                <div class="font-serif text-base text-white leading-snug" style="font-weight: 400;">
                  {{ b.firstName }} {{ b.lastName }}
                </div>
                <div class="text-xs text-white/45 italic font-serif truncate max-w-[240px] mt-0.5">
                  {{ b.email }}
                </div>
              </td>
              <td class="px-5 py-4 text-xs text-white/70 tabular-nums">
                <span class="text-white/85">{{ formatSlotDate(b.slotDate) }}</span>
                <span class="text-white/30 mx-1.5">·</span>
                <span>{{ b.slotStartTime }}</span>
                <span class="text-white/30 mx-1.5">·</span>
                <span class="font-mono uppercase tracking-wider text-white/50 text-[11px]">{{ abbrevRoute(b.routeId) }}</span>
              </td>
              <td class="px-5 py-4">
                <AdminBadgeStatus :status="statusBadgeStatus(b.status)" :label="statusBadgeLabel(b.status)" />
              </td>
              <td class="px-5 py-4 text-right tabular-nums font-serif text-white/85">{{ b.guests }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="filteredBookings.length > pageSize" class="flex items-center justify-between px-5 py-4 border-t border-white/10 text-xs text-white/55 font-mono">
        <span class="tabular-nums">{{ t('bookings.paginationRange', { start: (currentPage - 1) * pageSize + 1, end: Math.min(currentPage * pageSize, filteredBookings.length), total: filteredBookings.length }) }}</span>
        <div class="flex items-center gap-2">
          <AdminBaseButton variant="secondary" :disabled="currentPage <= 1" @click="currentPage--">←</AdminBaseButton>
          <span class="tabular-nums">{{ t('bookings.paginationOf', { current: currentPage, total: totalPages }) }}</span>
          <AdminBaseButton variant="secondary" :disabled="currentPage >= totalPages" @click="currentPage++">→</AdminBaseButton>
        </div>
      </div>
    </div>

    <AdminDrawer v-model="newOpen" :title="t('bookings.newDrawerTitle')">
      <form class="space-y-4 text-sm" @submit.prevent="submitNew">
        <label class="block">
          <span class="text-xs uppercase tracking-wider text-white/40 block mb-1 font-mono">{{ t('bookings.fieldSlotRequired') }}</span>
          <select v-model="newForm.tourSlotId" required :disabled="slotsLoading" class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
            <option value="">{{ slotsLoading ? t('bookings.loadingSlots') : t('bookings.fieldSlotPlaceholder') }}</option>
            <option v-for="s in slots" :key="s.id" :value="s.id">
              {{ formatSlotDate(s.date) }} · {{ s.startTime }} · {{ s.language.toUpperCase() }} · {{ abbrevRoute(s.routeId) }} ({{ s.remaining }}/{{ s.maxParticipants }})
            </option>
          </select>
        </label>
        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="text-xs uppercase tracking-wider text-white/40 block mb-1 font-mono">{{ t('bookings.fieldFirstNameRequired') }}</span>
            <input v-model="newForm.firstName" required class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
          </label>
          <label class="block">
            <span class="text-xs uppercase tracking-wider text-white/40 block mb-1 font-mono">{{ t('bookings.fieldLastNameRequired') }}</span>
            <input v-model="newForm.lastName" required class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
          </label>
        </div>
        <label class="block">
          <span class="text-xs uppercase tracking-wider text-white/40 block mb-1 font-mono">{{ t('bookings.fieldEmailRequired') }}</span>
          <input v-model="newForm.email" type="email" required class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
        </label>
        <label class="block">
          <span class="text-xs uppercase tracking-wider text-white/40 block mb-1 font-mono">{{ t('bookings.fieldPhone') }}</span>
          <input v-model="newForm.phone" class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
        </label>
        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="text-xs uppercase tracking-wider text-white/40 block mb-1 font-mono">{{ t('bookings.fieldParticipantsRequired') }}</span>
            <input v-model.number="newForm.numberOfPeople" type="number" min="1" max="12" required class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white tabular-nums">
          </label>
          <label class="block">
            <span class="text-xs uppercase tracking-wider text-white/40 block mb-1 font-mono">{{ t('bookings.fieldLanguage') }}</span>
            <select v-model="newForm.language" class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
              <option value="eu">Euskara</option>
              <option value="es">Español</option>
            </select>
          </label>
        </div>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="newForm.notify" type="checkbox" class="accent-white">
          {{ t('bookings.fieldSendEmailVisitor') }}
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="newForm.notifyGalleries" type="checkbox" class="accent-white">
          {{ t('bookings.fieldNotifyGalleries') }}
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="newForm.bypassCapacity" type="checkbox" class="accent-white">
          {{ t('bookings.fieldBypassCapacity') }}
        </label>
        <p v-if="newError" class="text-sm text-red-300">{{ newError }}</p>
      </form>
      <template #actions>
        <AdminBaseButton variant="ghost" type="button" :disabled="newSubmitting" @click="newOpen = false">
          {{ t('common.cancel') }}
        </AdminBaseButton>
        <AdminBaseButton variant="primary" type="button" :disabled="newSubmitting" :loading="newSubmitting" @click="submitNew">
          {{ newSubmitting ? t('bookings.submitCreating') : t('bookings.submitCreate') }}
        </AdminBaseButton>
      </template>
    </AdminDrawer>
  </div>
</template>
