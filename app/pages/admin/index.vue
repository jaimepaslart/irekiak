<script setup lang="ts">
interface StatsPayload {
  totals: { bookingsCount: number, cancelledCount: number, guests: number, capacity: number, booked: number, avgFillRate: number }
  byDate: Record<string, number>
  byRoute: Record<string, number>
  byLanguage: Record<string, number>
  fillRate: Array<{ slotId: string, date: string, startTime: string, routeId: string, language: string, booked: number, max: number, rate: number }>
  recentBookings: Array<{ id: string, createdAt: string, firstName: string, lastName: string, guests: number, language: string, status: string, slotDate: string, slotStartTime: string, routeId: string }>
}

interface AuditEntry {
  id: string
  timestamp: string
  actor: string
  action: string
  targetId: string | null
}

definePageMeta({ layout: 'admin', i18n: false })

const { t } = useAdminT()
const { year, startDate, endDate } = useEdition()

const dateRangeLabel = computed(() => {
  const startDay = startDate.value.slice(8, 10)
  const endDay = endDate.value.slice(8, 10)
  const month = startDate.value.slice(5, 7)
  return `${startDay}-${endDay}.${month}`
})

useSeoMeta({ title: () => t('dashboard.seoTitle'), robots: 'noindex, nofollow' })

const token = inject<Ref<string>>('adminToken')!
const stats = ref<StatsPayload | null>(null)
const audit = ref<AuditEntry[]>([])
const loading = ref(true)
const errorMessage = ref<string | null>(null)

async function load() {
  loading.value = true
  try {
    const [s, a] = await Promise.all([
      $fetch<StatsPayload>('/api/admin/stats', { headers: { 'x-admin-token': token.value } }),
      $fetch<{ entries: AuditEntry[], total: number }>('/api/admin/audit?limit=10', { headers: { 'x-admin-token': token.value } }),
    ])
    stats.value = s
    audit.value = a.entries
  }
  catch (err: unknown) {
    errorMessage.value = (err as { statusMessage?: string })?.statusMessage ?? t('dashboard.loadFailed')
  }
  finally { loading.value = false }
}

onMounted(() => { void load() })

const upcomingSlots = computed(() => {
  if (!stats.value) return []
  const now = new Date().toISOString().split('T')[0]!
  return stats.value.fillRate
    .filter(f => f.date >= now)
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
    .slice(0, 3)
})

const languagesSubtitle = computed(() => {
  if (!stats.value) return ''
  return Object.entries(stats.value.byLanguage)
    .map(([l, n]) => `${l.toUpperCase()}:${n}`)
    .join(' · ')
})
</script>

<template>
  <div>
    <AdminPageHeader
      :title="t('dashboard.title')"
      :subtitle="t('dashboard.editionSubtitle', { year, range: dateRangeLabel })"
    />

    <p v-if="errorMessage" class="text-sm text-red-300 mb-6">{{ errorMessage }}</p>

    <template v-if="loading && !stats">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <AdminSkeleton variant="stat" :count="4" />
      </div>
      <section class="mb-10">
        <div class="h-5 w-40 bg-white/10 rounded mb-4 animate-pulse"></div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <AdminSkeleton variant="card" :count="3" />
        </div>
      </section>
      <section class="mb-10">
        <div class="h-5 w-40 bg-white/10 rounded mb-4 animate-pulse"></div>
        <div class="bg-edition-dark border border-white/10 rounded-sm">
          <AdminSkeleton variant="row" :count="6" />
        </div>
      </section>
    </template>

    <template v-if="stats">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <AdminStatCard
          :label="t('dashboard.statBookings')"
          :value="stats.totals.bookingsCount"
          :subtitle="t('dashboard.statCancelled', { count: stats.totals.cancelledCount })"
        />
        <AdminStatCard
          :label="t('dashboard.statParticipants')"
          :value="stats.totals.guests"
          :subtitle="t('dashboard.statCapacityOf', { capacity: stats.totals.capacity })"
        />
        <AdminStatCard
          :label="t('dashboard.statFillRate')"
          :value="`${stats.totals.avgFillRate}%`"
        />
        <AdminStatCard
          :label="t('dashboard.statLanguages')"
          :value="languagesSubtitle || '—'"
        />
      </div>

      <section class="mb-10">
        <h2 class="text-lg font-semibold mb-4">{{ t('dashboard.upcomingSlots') }}</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <NuxtLink
            v-for="s in upcomingSlots"
            :key="s.slotId"
            :to="`/admin/checkin/${s.slotId}`"
            class="block bg-edition-dark border border-white/10 rounded-sm p-4 hover:border-white/25 transition-colors"
          >
            <p class="font-mono text-sm">{{ s.date }} · {{ s.startTime }}</p>
            <p class="text-white/70 mt-1 capitalize">{{ s.routeId.replace('route-', '').replace(/-/g, ' + ') }}</p>
            <p class="text-xs text-white/40 mt-2">{{ s.language.toUpperCase() }} · {{ t('dashboard.statSlotPlaces', { booked: s.booked, max: s.max }) }}</p>
            <div class="mt-2 h-1 w-full bg-white/10 rounded-full overflow-hidden">
              <div class="h-full bg-white/60" :style="{ width: `${s.rate}%` }" />
            </div>
          </NuxtLink>
        </div>
      </section>

      <section class="mb-10">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">{{ t('dashboard.recentActivity') }}</h2>
          <NuxtLink to="/admin/audit" class="text-xs text-white/50 hover:text-white">{{ t('dashboard.viewAll') }}</NuxtLink>
        </div>
        <div v-if="audit.length === 0" class="bg-edition-dark border border-white/10 rounded-sm">
          <AdminEmptyState :title="t('dashboard.noActivity')" />
        </div>
        <div v-else class="bg-edition-dark border border-white/10 rounded-sm divide-y divide-white/5">
          <div v-for="a in audit" :key="a.id" class="px-4 py-3 flex items-center justify-between gap-4 text-sm">
            <div class="flex items-center gap-3 min-w-0">
              <span class="text-[10px] uppercase tracking-wider font-mono text-white/40 shrink-0 w-14">{{ a.actor }}</span>
              <span class="font-mono text-xs">{{ a.action }}</span>
              <span v-if="a.targetId" class="text-xs text-white/40 font-mono truncate">{{ a.targetId.slice(0, 8) }}</span>
            </div>
            <span class="text-xs text-white/40 font-mono whitespace-nowrap">{{ a.timestamp }}</span>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
