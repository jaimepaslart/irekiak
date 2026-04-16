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

definePageMeta({ layout: 'admin' })

const { t } = useAdminT()
const { dates, year, startDate, endDate } = useEdition()

const dateRangeLabel = computed(() => {
  const startDay = startDate.value.slice(8, 10)
  const endDay = endDate.value.slice(8, 10)
  const month = startDate.value.slice(5, 7)
  return `${startDay}-${endDay}.${month}`
})

useSeoMeta({ title: () => t('bookings.seoTitleList'), robots: 'noindex, nofollow' })

const token = inject<Ref<string>>('adminToken')!

const rawBookings = ref<AdminBookingRow[]>([])
const stats = ref<StatsPayload | null>(null)
const loading = ref(false)
const errorMessage = ref<string | null>(null)

const statusFilter = ref<'all' | 'upcoming' | 'past' | 'cancelled'>('all')
const routeFilter = ref<string>('all')
const languageFilter = ref<string>('all')
const dateFilter = ref<string>('all')
const searchQuery = ref<string>('')
const currentPage = ref(1)
const pageSize = 20

const selected = reactive<Record<string, boolean>>({})

const availableRoutes = computed(() => {
  const set = new Set<string>()
  for (const b of rawBookings.value) set.add(b.routeId)
  return Array.from(set).sort()
})
const availableDates = computed(() => {
  const set = new Set<string>()
  for (const b of rawBookings.value) set.add(b.slotDate)
  return Array.from(set).sort()
})

const todayIso = new Date().toISOString().split('T')[0]!

const filteredBookings = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return rawBookings.value.filter((b) => {
    if (statusFilter.value === 'cancelled' && b.status !== 'cancelled') return false
    if (statusFilter.value === 'upcoming' && (b.status === 'cancelled' || b.slotDate < todayIso)) return false
    if (statusFilter.value === 'past' && (b.status === 'cancelled' || b.slotDate >= todayIso)) return false
    if (routeFilter.value !== 'all' && b.routeId !== routeFilter.value) return false
    if (languageFilter.value !== 'all' && b.language !== languageFilter.value) return false
    if (dateFilter.value !== 'all' && b.slotDate !== dateFilter.value) return false
    if (q) {
      const hay = `${b.firstName} ${b.lastName} ${b.email} ${b.id}`.toLowerCase()
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

const selectedIds = computed(() => Object.keys(selected).filter(id => selected[id]))

const statusFilterTabs: Array<{ value: 'all' | 'upcoming' | 'past' | 'cancelled', key: string }> = [
  { value: 'all', key: 'bookings.filterAll' },
  { value: 'upcoming', key: 'bookings.filterUpcoming' },
  { value: 'past', key: 'bookings.filterPast' },
  { value: 'cancelled', key: 'bookings.filterCancelled' },
]

const editionDates = computed(() => dates.value)

watch([statusFilter, routeFilter, languageFilter, dateFilter, searchQuery], () => {
  currentPage.value = 1
  for (const k of Object.keys(selected)) delete selected[k]
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

async function cancelBooking(id: string, name: string) {
  if (!confirm(t('bookings.cancelSingleConfirm', { name }))) return
  try {
    await $fetch(`/api/admin/bookings/${id}/cancel`, {
      method: 'POST', headers: { 'x-admin-token': token.value },
    })
    await loadAll()
  }
  catch (err: unknown) {
    alert(t('bookings.cancelFailed') + ': ' + ((err as { statusMessage?: string })?.statusMessage ?? ''))
  }
}

async function bulkCancel() {
  const ids = selectedIds.value
  if (ids.length === 0) return
  if (!confirm(t('bookings.bulkCancelConfirm', { count: ids.length }))) return
  for (const id of ids) {
    try {
      await $fetch(`/api/admin/bookings/${id}/cancel`, {
        method: 'POST', headers: { 'x-admin-token': token.value },
      })
    }
    catch { /* continue */ }
  }
  for (const k of Object.keys(selected)) delete selected[k]
  await loadAll()
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
</script>

<template>
  <div>
    <AdminPageHeader
      :title="t('bookings.title')"
      :subtitle="t('bookings.editionSubtitle', { year, range: dateRangeLabel })"
    >
      <template #actions>
        <AdminBaseButton variant="primary" as="nuxt-link" to="/admin/bookings/new">
          {{ t('bookings.new') }}
        </AdminBaseButton>
        <AdminBaseButton variant="secondary" type="button" @click="loadAll">
          {{ t('bookings.refresh') }}
        </AdminBaseButton>
        <AdminBaseButton variant="secondary" type="button" @click="exportCsv">
          {{ t('bookings.csvExport') }}
        </AdminBaseButton>
      </template>
    </AdminPageHeader>

    <p v-if="errorMessage" class="text-sm text-red-300 mb-6">{{ errorMessage }}</p>

    <div v-if="stats" class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      <AdminStatCard
        :label="t('bookings.statsBookings')"
        :value="stats.totals.bookingsCount"
        :subtitle="t('bookings.statsCancelled', { count: stats.totals.cancelledCount })"
      />
      <AdminStatCard
        :label="t('bookings.statsParticipants')"
        :value="stats.totals.guests"
        :subtitle="t('bookings.statsCapacityOf', { capacity: stats.totals.capacity })"
      />
      <AdminStatCard
        :label="t('bookings.statsFillRate')"
        :value="`${stats.totals.avgFillRate}%`"
      />
      <AdminStatCard
        v-for="d in editionDates.slice(1)"
        :key="d"
        :label="`${d.slice(8, 10)}.${d.slice(5, 7)}`"
        :value="stats.byDate[d] ?? 0"
      />
    </div>

    <div v-if="stats && stats.fillRate.some(f => f.booked > 0)" class="bg-edition-dark border border-white/10 rounded-sm p-4 mb-6">
      <p class="text-xs uppercase tracking-wider text-white/40 font-mono mb-3">{{ t('dashboard.quickCheckin') }}</p>
      <div class="flex flex-wrap gap-2">
        <NuxtLink
          v-for="slot in stats.fillRate.filter(f => f.booked > 0)"
          :key="slot.slotId"
          :to="`/admin/checkin/${slot.slotId}`"
          class="text-xs px-3 py-1.5 border border-white/15 rounded-sm hover:bg-white/10 transition-colors font-mono"
        >
          {{ slot.date.slice(5) }} · {{ slot.startTime }} · {{ slot.language.toUpperCase() }} · {{ slot.routeId.replace('route-', '') }} ({{ slot.booked }}/{{ slot.max }})
        </NuxtLink>
      </div>
    </div>

    <div class="bg-edition-dark border border-white/10 rounded-sm p-4 mb-6">
      <div class="flex flex-wrap gap-2 mb-4">
        <button
          v-for="tab in statusFilterTabs"
          :key="tab.value"
          type="button"
          :class="[
            'px-4 py-1.5 text-xs uppercase tracking-wider font-mono rounded-sm',
            statusFilter === tab.value ? 'bg-white text-[var(--color-edition)]' : 'text-white/60 hover:text-white border border-white/15',
          ]"
          @click="statusFilter = tab.value"
        >
          {{ t(tab.key) }}
        </button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <select v-model="dateFilter" class="bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-sm text-white">
          <option value="all">{{ t('bookings.filterByDate') }}</option>
          <option v-for="d in availableDates" :key="d" :value="d">{{ d }}</option>
        </select>
        <select v-model="routeFilter" class="bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-sm text-white">
          <option value="all">{{ t('bookings.filterByRoute') }}</option>
          <option v-for="r in availableRoutes" :key="r" :value="r">{{ r }}</option>
        </select>
        <select v-model="languageFilter" class="bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-sm text-white">
          <option value="all">{{ t('bookings.filterByLanguage') }}</option>
          <option value="eu">Euskara</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
        <input v-model="searchQuery" type="search" :placeholder="t('bookings.searchPlaceholder')" class="bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-sm text-white placeholder-white/40">
      </div>
    </div>

    <div v-if="selectedIds.length > 0" class="bg-emerald-500/10 border border-emerald-500/30 rounded-sm p-3 mb-4 flex items-center justify-between gap-3">
      <span class="text-sm">{{ t('bookings.bulkSelected', { count: selectedIds.length }) }}</span>
      <div class="flex gap-2">
        <AdminBaseButton variant="danger" type="button" @click="bulkCancel">
          {{ t('bookings.bulkCancel') }}
        </AdminBaseButton>
      </div>
    </div>

    <div class="bg-edition-dark border border-white/10 rounded-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-white/5">
            <tr class="text-left text-xs uppercase tracking-wider text-white/50 font-mono">
              <th class="px-4 py-3 w-10" />
              <th class="px-4 py-3">{{ t('bookings.columnStatus') }}</th>
              <th class="px-4 py-3">{{ t('bookings.columnDate') }}</th>
              <th class="px-4 py-3">{{ t('bookings.columnVisitor') }}</th>
              <th class="px-4 py-3">{{ t('bookings.columnContact') }}</th>
              <th class="px-4 py-3">{{ t('bookings.columnParticipants') }}</th>
              <th class="px-4 py-3">{{ t('bookings.columnLanguage') }}</th>
              <th class="px-4 py-3">{{ t('bookings.columnRoute') }}</th>
              <th class="px-4 py-3 text-right">{{ t('bookings.columnActions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="9" class="px-4 py-10 text-center text-white/40">{{ t('common.loading') }}</td>
            </tr>
            <tr v-else-if="filteredBookings.length === 0">
              <td colspan="9" class="px-0 py-0">
                <AdminEmptyState :title="t('bookings.emptyState')" :description="t('bookings.emptyStateDesc')" />
              </td>
            </tr>
            <tr v-for="b in pagedBookings" :key="b.id" class="border-t border-white/5 hover:bg-white/5">
              <td class="px-4 py-3"><input v-model="selected[b.id]" type="checkbox" class="accent-white"></td>
              <td class="px-4 py-3">
                <AdminBadgeStatus :status="statusBadgeStatus(b.status)" :label="statusBadgeLabel(b.status)" />
              </td>
              <td class="px-4 py-3 font-mono text-xs">
                <span class="text-white">{{ b.slotDate }}</span>
                <span class="text-white/40 ml-2">{{ b.slotStartTime }}</span>
              </td>
              <td class="px-4 py-3">
                <NuxtLink :to="`/admin/bookings/${b.id}`" class="font-medium hover:underline">{{ b.firstName }} {{ b.lastName }}</NuxtLink>
                <div class="text-xs text-white/40 font-mono">{{ new Date(b.createdAt).toLocaleDateString() }}</div>
              </td>
              <td class="px-4 py-3">
                <a :href="`mailto:${b.email}`" class="text-white hover:underline text-xs">{{ b.email }}</a>
                <div v-if="b.phone" class="text-xs text-white/40">{{ b.phone }}</div>
              </td>
              <td class="px-4 py-3 text-center">{{ b.guests }}</td>
              <td class="px-4 py-3 font-mono uppercase">{{ b.language }}</td>
              <td class="px-4 py-3 text-white/70">{{ b.routeId.replace('route-', '') }}</td>
              <td class="px-4 py-3 text-right whitespace-nowrap">
                <NuxtLink :to="`/admin/bookings/${b.id}`" class="text-xs px-2 py-1 border border-white/20 rounded-sm hover:bg-white/10 mr-2">{{ t('bookings.detail') }}</NuxtLink>
                <button v-if="b.status === 'confirmed'" type="button" class="text-xs px-2 py-1 border border-red-400/30 text-red-300 rounded-sm hover:bg-red-500/10" :title="t('bookings.cancelBooking')" @click="cancelBooking(b.id, `${b.firstName} ${b.lastName}`)">✗</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="filteredBookings.length > pageSize" class="flex items-center justify-between px-4 py-3 border-t border-white/10 text-xs text-white/50 font-mono">
        <span>{{ t('bookings.paginationRange', { start: (currentPage - 1) * pageSize + 1, end: Math.min(currentPage * pageSize, filteredBookings.length), total: filteredBookings.length }) }}</span>
        <div class="flex items-center gap-2">
          <button type="button" class="px-3 py-1 border border-white/15 rounded-sm disabled:opacity-30" :disabled="currentPage <= 1" @click="currentPage--">←</button>
          <span>{{ t('bookings.paginationOf', { current: currentPage, total: totalPages }) }}</span>
          <button type="button" class="px-3 py-1 border border-white/15 rounded-sm disabled:opacity-30" :disabled="currentPage >= totalPages" @click="currentPage++">→</button>
        </div>
      </div>
    </div>
  </div>
</template>
