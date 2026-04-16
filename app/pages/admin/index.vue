<script setup lang="ts">
/**
 * Dashboard admin — surface les "concerns" (préoccupations actionables) en haut
 * pour que les organisateurs voient immédiatement ce qui demande attention.
 *
 * TODO data manquante : `/api/admin/stats` ne retourne pas (encore) les compteurs
 * - bounces / complaints sur les dernières 24 h → on récupère via /api/admin/emails
 * - waitlist global → on approxime via les `recentBookings` (limité à 10).
 *   Pour un vrai compteur exhaustif, ajouter un champ `waitlistCount` dans stats.
 */

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

interface EmailEvent {
  id: string
  timestamp: string
  bookingId: string | null
  channel: string
  recipient: string
  eventType: string
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
const recentEmails = ref<EmailEvent[]>([])
const loading = ref(true)
const errorMessage = ref<string | null>(null)

async function load() {
  loading.value = true
  try {
    const [s, a, e] = await Promise.all([
      $fetch<StatsPayload>('/api/admin/stats', { headers: { 'x-admin-token': token.value } }),
      $fetch<{ entries: AuditEntry[], total: number }>('/api/admin/audit?limit=8', { headers: { 'x-admin-token': token.value } }),
      $fetch<{ entries: EmailEvent[], total: number }>('/api/admin/emails?limit=200', { headers: { 'x-admin-token': token.value } })
        .catch(() => ({ entries: [] as EmailEvent[], total: 0 })),
    ])
    stats.value = s
    audit.value = a.entries
    recentEmails.value = e.entries
  }
  catch (err: unknown) {
    errorMessage.value = (err as { statusMessage?: string })?.statusMessage ?? t('dashboard.loadFailed')
  }
  finally { loading.value = false }
}

onMounted(() => { void load() })

const todayIso = new Date().toISOString().split('T')[0]!

const upcomingSlots = computed(() => {
  if (!stats.value) return []
  return stats.value.fillRate
    .filter(f => f.date >= todayIso)
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
    .slice(0, 3)
})

interface Concern {
  key: 'lowFill' | 'bounces' | 'waitlist'
  count: number
  label: string
}

const concerns = computed<Concern[]>(() => {
  const list: Concern[] = []
  if (!stats.value) return list

  const upcomingAll = stats.value.fillRate.filter(f => f.date >= todayIso && f.max > 0)
  const lowFillSlots = upcomingAll.filter(f => f.rate < 30).length
  if (lowFillSlots > 0) {
    list.push({
      key: 'lowFill',
      count: lowFillSlots,
      label: t('dashboard.concernLowFill', { count: lowFillSlots }),
    })
  }

  const since = Date.now() - 24 * 60 * 60 * 1000
  const recentBounces = recentEmails.value.filter((e) => {
    if (!(e.eventType.includes('bounced') || e.eventType.includes('complained'))) return false
    const ts = Date.parse(e.timestamp)
    return Number.isFinite(ts) && ts >= since
  }).length
  if (recentBounces > 0) {
    list.push({
      key: 'bounces',
      count: recentBounces,
      label: t('dashboard.concernBounces', { count: recentBounces }),
    })
  }

  const waitlistCount = stats.value.recentBookings.filter(b => b.status === 'waitlist').length
  if (waitlistCount > 0) {
    list.push({
      key: 'waitlist',
      count: waitlistCount,
      label: t('dashboard.concernWaitlist', { count: waitlistCount }),
    })
  }

  return list
})

const languagesSubtitle = computed(() => {
  if (!stats.value) return ''
  return Object.entries(stats.value.byLanguage)
    .map(([l, n]) => `${l.toUpperCase()}:${n}`)
    .join(' · ')
})

function slotFillVariant(rate: number): 'low' | 'full' | 'normal' {
  if (rate >= 100) return 'full'
  if (rate < 30) return 'low'
  return 'normal'
}
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
      <section
        v-if="concerns.length > 0"
        class="bg-orange-500/10 border border-orange-500/30 text-orange-200 rounded-sm px-5 py-4 mb-6"
        role="status"
        aria-live="polite"
      >
        <div class="flex items-start gap-3">
          <span class="text-lg leading-none mt-0.5" aria-hidden="true">⚠</span>
          <div class="flex-1 min-w-0">
            <p class="text-xs uppercase tracking-wider font-mono mb-2 text-orange-200/80">
              {{ t('dashboard.concernsTitle') }}
            </p>
            <ul class="space-y-1">
              <li v-for="c in concerns" :key="c.key" class="text-sm">
                {{ c.label }}
              </li>
            </ul>
          </div>
        </div>
      </section>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <div class="bg-edition-dark border border-white/10 rounded-sm p-4">
          <div class="text-[10px] text-white/50 tracking-wider font-mono mb-1 uppercase">{{ t('dashboard.statBookings') }}</div>
          <div class="text-xl font-light text-white">{{ stats.totals.bookingsCount }}</div>
          <div class="text-[11px] text-white/40 mt-1">{{ t('dashboard.statCancelled', { count: stats.totals.cancelledCount }) }}</div>
        </div>
        <div class="bg-edition-dark border border-white/10 rounded-sm p-4">
          <div class="text-[10px] text-white/50 tracking-wider font-mono mb-1 uppercase">{{ t('dashboard.statParticipants') }}</div>
          <div class="text-xl font-light text-white">{{ stats.totals.guests }}</div>
          <div class="text-[11px] text-white/40 mt-1">{{ t('dashboard.statCapacityOf', { capacity: stats.totals.capacity }) }}</div>
        </div>
        <div class="bg-edition-dark border border-white/10 rounded-sm p-4">
          <div class="text-[10px] text-white/50 tracking-wider font-mono mb-1 uppercase">{{ t('dashboard.statFillRate') }}</div>
          <div class="text-xl font-light text-white">{{ stats.totals.avgFillRate }}%</div>
        </div>
        <div class="bg-edition-dark border border-white/10 rounded-sm p-4">
          <div class="text-[10px] text-white/50 tracking-wider font-mono mb-1 uppercase">{{ t('dashboard.statLanguages') }}</div>
          <div class="text-xl font-light text-white">{{ languagesSubtitle || '—' }}</div>
        </div>
      </div>

      <section class="mb-10">
        <h2 class="text-lg font-semibold mb-4">{{ t('dashboard.upcomingSlots') }}</h2>
        <div v-if="upcomingSlots.length === 0" class="text-sm text-white/40">
          {{ t('dashboard.noUpcomingSlots') }}
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <NuxtLink
            v-for="s in upcomingSlots"
            :key="s.slotId"
            :to="`/admin/parcours/${routeSlugFromId(s.routeId)}/slot/${s.slotId}`"
            class="block bg-edition-dark border rounded-sm p-4 transition-colors"
            :class="{
              'border-orange-500/40 hover:border-orange-400': slotFillVariant(s.rate) === 'low',
              'border-emerald-500/40 hover:border-emerald-400': slotFillVariant(s.rate) === 'full',
              'border-white/10 hover:border-white/25': slotFillVariant(s.rate) === 'normal',
            }"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="font-mono text-sm">{{ s.date }} · {{ s.startTime }}</p>
                <p class="text-white/70 mt-1 capitalize">{{ routeSlugFromId(s.routeId).replace(/-/g, ' + ') }}</p>
              </div>
              <span
                v-if="slotFillVariant(s.rate) === 'low'"
                class="text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-sm border border-orange-500/40 text-orange-300 bg-orange-500/10 whitespace-nowrap"
              >
                {{ t('dashboard.badgeLowFill') }}
              </span>
              <span
                v-else-if="slotFillVariant(s.rate) === 'full'"
                class="text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-sm border border-emerald-500/40 text-emerald-300 bg-emerald-500/10 whitespace-nowrap"
              >
                {{ t('dashboard.badgeFull') }}
              </span>
            </div>
            <p class="text-xs text-white/40 mt-2">{{ s.language.toUpperCase() }} · {{ t('dashboard.statSlotPlaces', { booked: s.booked, max: s.max }) }}</p>
            <div class="mt-2 h-1 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                class="h-full"
                :class="{
                  'bg-orange-400': slotFillVariant(s.rate) === 'low',
                  'bg-emerald-400': slotFillVariant(s.rate) === 'full',
                  'bg-white/60': slotFillVariant(s.rate) === 'normal',
                }"
                :style="{ width: `${s.rate}%` }"
              />
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
          <div v-for="a in audit.slice(0, 8)" :key="a.id" class="px-4 py-3 flex items-center justify-between gap-4 text-sm">
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
