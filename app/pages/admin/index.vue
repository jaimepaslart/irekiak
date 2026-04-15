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

definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Admin · Dashboard', robots: 'noindex, nofollow' })

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
    errorMessage.value = (err as { statusMessage?: string })?.statusMessage ?? 'Failed to load'
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
</script>

<template>
  <div>
    <h1 class="m-0 text-2xl mb-2">Dashboard</h1>
    <p class="text-sm text-white/50 mb-8">Irekiak 2026 · 29-31 mai</p>

    <p v-if="errorMessage" class="text-sm text-red-300 mb-6">{{ errorMessage }}</p>
    <p v-if="loading" class="text-sm text-white/40">Chargement…</p>

    <template v-if="stats">
      <!-- Stat cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div class="bg-edition-dark border border-white/10 rounded-sm p-4">
          <p class="text-xs uppercase tracking-wider text-white/40 font-mono mb-1">Réservations</p>
          <p class="text-3xl font-bold text-white">{{ stats.totals.bookingsCount }}</p>
          <p class="text-xs text-white/40 mt-1">{{ stats.totals.cancelledCount }} annulées</p>
        </div>
        <div class="bg-edition-dark border border-white/10 rounded-sm p-4">
          <p class="text-xs uppercase tracking-wider text-white/40 font-mono mb-1">Participants</p>
          <p class="text-3xl font-bold text-white">{{ stats.totals.guests }}</p>
          <p class="text-xs text-white/40 mt-1">sur {{ stats.totals.capacity }} places</p>
        </div>
        <div class="bg-edition-dark border border-white/10 rounded-sm p-4">
          <p class="text-xs uppercase tracking-wider text-white/40 font-mono mb-1">Remplissage</p>
          <p class="text-3xl font-bold text-white">{{ stats.totals.avgFillRate }}%</p>
          <div class="mt-2 h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <div class="h-full bg-white/80" :style="{ width: `${stats.totals.avgFillRate}%` }" />
          </div>
        </div>
        <div class="bg-edition-dark border border-white/10 rounded-sm p-4">
          <p class="text-xs uppercase tracking-wider text-white/40 font-mono mb-1">Langues</p>
          <div class="flex gap-2 flex-wrap mt-1">
            <span v-for="(n, l) in stats.byLanguage" :key="l" class="text-xs font-mono">{{ l.toUpperCase() }}:{{ n }}</span>
          </div>
        </div>
      </div>

      <!-- Upcoming slots -->
      <section class="mb-10">
        <h2 class="text-lg font-semibold mb-4">Prochains créneaux</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <NuxtLink
            v-for="s in upcomingSlots"
            :key="s.slotId"
            :to="`/admin/checkin/${s.slotId}`"
            class="block bg-edition-dark border border-white/10 rounded-sm p-4 hover:border-white/25 transition-colors"
          >
            <p class="font-mono text-sm">{{ s.date }} · {{ s.startTime }}</p>
            <p class="text-white/70 mt-1 capitalize">{{ s.routeId.replace('route-', '').replace(/-/g, ' + ') }}</p>
            <p class="text-xs text-white/40 mt-2">{{ s.language.toUpperCase() }} · {{ s.booked }}/{{ s.max }} places</p>
            <div class="mt-2 h-1 w-full bg-white/10 rounded-full overflow-hidden">
              <div class="h-full bg-white/60" :style="{ width: `${s.rate}%` }" />
            </div>
          </NuxtLink>
        </div>
      </section>

      <!-- Recent activity -->
      <section class="mb-10">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Activité récente</h2>
          <NuxtLink to="/admin/audit" class="text-xs text-white/50 hover:text-white">Voir tout →</NuxtLink>
        </div>
        <div class="bg-edition-dark border border-white/10 rounded-sm divide-y divide-white/5">
          <div v-for="a in audit" :key="a.id" class="px-4 py-3 flex items-center justify-between gap-4 text-sm">
            <div class="flex items-center gap-3 min-w-0">
              <span class="text-[10px] uppercase tracking-wider font-mono text-white/40 shrink-0 w-14">{{ a.actor }}</span>
              <span class="font-mono text-xs">{{ a.action }}</span>
              <span v-if="a.targetId" class="text-xs text-white/40 font-mono truncate">{{ a.targetId.slice(0, 8) }}</span>
            </div>
            <span class="text-xs text-white/40 font-mono whitespace-nowrap">{{ a.timestamp }}</span>
          </div>
          <div v-if="audit.length === 0" class="px-4 py-6 text-center text-white/40 text-sm">Pas d'activité</div>
        </div>
      </section>
    </template>
  </div>
</template>
