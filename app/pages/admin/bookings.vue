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
  totals: {
    bookingsCount: number
    cancelledCount: number
    guests: number
    capacity: number
    booked: number
    avgFillRate: number
  }
  byDate: Record<string, number>
  byRoute: Record<string, number>
  byLanguage: Record<string, number>
  fillRate: Array<{
    slotId: string
    date: string
    startTime: string
    routeId: string
    language: string
    booked: number
    max: number
    rate: number
  }>
  recentBookings: AdminBookingRow[]
}

definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'Admin · Irekiak Bookings',
  robots: 'noindex, nofollow',
})

const STORAGE_KEY = 'irekiak_admin_token'

const token = ref('')
const tokenInput = ref('')
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

const todayIso = new Date().toISOString().split('T')[0]

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

watch([statusFilter, routeFilter, languageFilter, dateFilter, searchQuery], () => {
  currentPage.value = 1
})

onMounted(() => {
  if (typeof window === 'undefined') return
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored) {
    token.value = stored
    void loadAll()
  }
})

async function loadAll() {
  if (!token.value) return
  loading.value = true
  errorMessage.value = null
  try {
    const [bookingsData, statsData] = await Promise.all([
      $fetch<AdminBookingRow[]>('/api/admin/bookings', { headers: { 'x-admin-token': token.value } }),
      $fetch<StatsPayload>('/api/admin/stats', { headers: { 'x-admin-token': token.value } }),
    ])
    rawBookings.value = bookingsData
    stats.value = statsData
  }
  catch (err: unknown) {
    const status = (err as { statusCode?: number })?.statusCode
    if (status === 401) {
      errorMessage.value = 'Invalid admin token.'
      logout(false)
    }
    else if (status === 503) {
      errorMessage.value = 'Admin access is not configured on the server.'
    }
    else {
      errorMessage.value = 'Failed to fetch data. Please try again.'
    }
  }
  finally {
    loading.value = false
  }
}

function login() {
  const value = tokenInput.value.trim()
  if (!value) return
  token.value = value
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, value)
  }
  tokenInput.value = ''
  void loadAll()
}

function logout(clearStorage = true) {
  token.value = ''
  rawBookings.value = []
  stats.value = null
  if (clearStorage && typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY)
  }
}

async function cancelBooking(id: string, name: string) {
  if (!confirm(`Annuler la réservation de ${name} ?`)) return
  try {
    await $fetch(`/api/admin/bookings/${id}/cancel`, {
      method: 'POST',
      headers: { 'x-admin-token': token.value },
    })
    await loadAll()
  }
  catch (err: unknown) {
    alert('Cancel failed: ' + ((err as { statusMessage?: string })?.statusMessage ?? 'unknown'))
  }
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

function statusLabel(s: string) {
  return s === 'confirmed' ? '✓ Confirmé' : s === 'cancelled' ? '✗ Annulé' : s
}
function statusClass(s: string) {
  if (s === 'confirmed') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  if (s === 'cancelled') return 'bg-red-500/20 text-red-300 border-red-500/30'
  return 'bg-white/10 text-white/70 border-white/20'
}
</script>

<template>
  <div class="max-w-[1400px] mx-auto px-6 md:px-12 py-12 pt-24">
    <!-- Login -->
    <div v-if="!token" class="max-w-md mx-auto mt-16">
      <h1 class="text-2xl mb-6">Admin · Irekiak</h1>
      <form class="space-y-4" @submit.prevent="login">
        <label class="block">
          <span class="text-xs uppercase tracking-wider text-white/40 font-mono block mb-2">Admin token</span>
          <input
            v-model="tokenInput"
            type="password"
            class="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-sm text-white focus:outline-none focus:border-white/40"
            placeholder="NUXT_ADMIN_TOKEN_SECRET"
            autocomplete="current-password"
          >
        </label>
        <button
          type="submit"
          class="w-full px-4 py-3 bg-white text-[var(--color-edition)] font-medium rounded-sm hover:bg-white/90 transition-colors"
        >
          Se connecter
        </button>
        <p v-if="errorMessage" class="text-sm text-red-300">{{ errorMessage }}</p>
      </form>
    </div>

    <!-- Dashboard -->
    <template v-else>
      <div class="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 class="m-0 text-2xl">Admin · Réservations</h1>
          <p class="text-sm text-white/50 mt-1">Irekiak 2026 · 29-31 mai</p>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" class="text-sm px-4 py-2 border border-white/20 rounded-sm hover:bg-white/10 transition-colors" @click="loadAll">
            ↻ Rafraîchir
          </button>
          <button type="button" class="text-sm px-4 py-2 border border-white/20 rounded-sm hover:bg-white/10 transition-colors" @click="exportCsv">
            ↓ CSV
          </button>
          <button type="button" class="text-sm px-4 py-2 border border-red-400/30 text-red-300 rounded-sm hover:bg-red-500/10 transition-colors" @click="logout()">
            Déconnexion
          </button>
        </div>
      </div>

      <p v-if="errorMessage" class="text-sm text-red-300 mb-6">{{ errorMessage }}</p>

      <!-- Stat cards -->
      <div v-if="stats" class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div class="bg-edition-dark border border-white/10 rounded-sm p-4">
          <p class="text-xs uppercase tracking-wider text-white/40 font-mono mb-1">Réservations</p>
          <p class="text-2xl font-bold text-white">{{ stats.totals.bookingsCount }}</p>
          <p class="text-xs text-white/40">{{ stats.totals.cancelledCount }} annulées</p>
        </div>
        <div class="bg-edition-dark border border-white/10 rounded-sm p-4">
          <p class="text-xs uppercase tracking-wider text-white/40 font-mono mb-1">Participants</p>
          <p class="text-2xl font-bold text-white">{{ stats.totals.guests }}</p>
          <p class="text-xs text-white/40">sur {{ stats.totals.capacity }} places</p>
        </div>
        <div class="bg-edition-dark border border-white/10 rounded-sm p-4">
          <p class="text-xs uppercase tracking-wider text-white/40 font-mono mb-1">Remplissage</p>
          <p class="text-2xl font-bold text-white">{{ stats.totals.avgFillRate }}%</p>
          <div class="mt-2 h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <div class="h-full bg-white/80" :style="{ width: `${stats.totals.avgFillRate}%` }" />
          </div>
        </div>
        <div class="bg-edition-dark border border-white/10 rounded-sm p-4">
          <p class="text-xs uppercase tracking-wider text-white/40 font-mono mb-1">30 mai</p>
          <p class="text-2xl font-bold text-white">{{ stats.byDate['2026-05-30'] ?? 0 }}</p>
          <p class="text-xs text-white/40">participants samedi</p>
        </div>
        <div class="bg-edition-dark border border-white/10 rounded-sm p-4">
          <p class="text-xs uppercase tracking-wider text-white/40 font-mono mb-1">31 mai</p>
          <p class="text-2xl font-bold text-white">{{ stats.byDate['2026-05-31'] ?? 0 }}</p>
          <p class="text-xs text-white/40">participants dimanche</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-edition-dark border border-white/10 rounded-sm p-4 mb-6">
        <div class="flex flex-wrap gap-2 mb-4">
          <button
            v-for="s in (['all', 'upcoming', 'past', 'cancelled'] as const)"
            :key="s"
            :class="[
              'px-4 py-1.5 text-xs uppercase tracking-wider font-mono rounded-sm transition-colors',
              statusFilter === s ? 'bg-white text-[var(--color-edition)]' : 'text-white/60 hover:text-white border border-white/15',
            ]"
            @click="statusFilter = s"
          >
            {{ s }}
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select v-model="dateFilter" class="bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40">
            <option value="all">Toutes les dates</option>
            <option v-for="d in availableDates" :key="d" :value="d">{{ d }}</option>
          </select>
          <select v-model="routeFilter" class="bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40">
            <option value="all">Tous les parcours</option>
            <option v-for="r in availableRoutes" :key="r" :value="r">{{ r }}</option>
          </select>
          <select v-model="languageFilter" class="bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40">
            <option value="all">Toutes les langues</option>
            <option value="eu">Euskara</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Nom, email, id…"
            class="bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/40"
          >
        </div>
      </div>

      <!-- Table -->
      <div class="bg-edition-dark border border-white/10 rounded-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-white/5">
              <tr class="text-left text-xs uppercase tracking-wider text-white/50 font-mono">
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3">Date / Hr</th>
                <th class="px-4 py-3">Visiteur</th>
                <th class="px-4 py-3">Contact</th>
                <th class="px-4 py-3">Nb</th>
                <th class="px-4 py-3">Lg</th>
                <th class="px-4 py-3">Parcours</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="8" class="px-4 py-10 text-center text-white/40">Chargement…</td>
              </tr>
              <tr v-else-if="filteredBookings.length === 0">
                <td colspan="8" class="px-4 py-10 text-center text-white/40">Aucune réservation</td>
              </tr>
              <tr v-for="b in pagedBookings" :key="b.id" class="border-t border-white/5 hover:bg-white/5 transition-colors">
                <td class="px-4 py-3">
                  <span class="inline-block text-[10px] px-2 py-0.5 rounded-full border" :class="statusClass(b.status)">
                    {{ statusLabel(b.status) }}
                  </span>
                </td>
                <td class="px-4 py-3 font-mono text-xs">
                  <span class="text-white">{{ b.slotDate }}</span>
                  <span class="text-white/40 ml-2">{{ b.slotStartTime }}</span>
                </td>
                <td class="px-4 py-3">
                  <div class="text-white font-medium">{{ b.firstName }} {{ b.lastName }}</div>
                  <div class="text-xs text-white/40 font-mono">{{ new Date(b.createdAt).toLocaleDateString('fr-FR') }}</div>
                </td>
                <td class="px-4 py-3">
                  <a :href="`mailto:${b.email}`" class="text-white hover:underline">{{ b.email }}</a>
                  <div v-if="b.phone" class="text-xs text-white/40">{{ b.phone }}</div>
                </td>
                <td class="px-4 py-3 text-center">{{ b.guests }}</td>
                <td class="px-4 py-3 font-mono uppercase">{{ b.language }}</td>
                <td class="px-4 py-3 text-white/70">{{ b.routeId.replace('route-', '') }}</td>
                <td class="px-4 py-3 text-right whitespace-nowrap">
                  <NuxtLink
                    :to="`/bookings/${b.confirmToken}`"
                    class="text-xs px-2 py-1 border border-white/20 rounded-sm hover:bg-white/10 transition-colors inline-block mr-2"
                  >
                    Voir
                  </NuxtLink>
                  <button
                    v-if="b.status === 'confirmed'"
                    type="button"
                    class="text-xs px-2 py-1 border border-red-400/30 text-red-300 rounded-sm hover:bg-red-500/10 transition-colors"
                    @click="cancelBooking(b.id, `${b.firstName} ${b.lastName}`)"
                  >
                    Annuler
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="filteredBookings.length > pageSize" class="flex items-center justify-between px-4 py-3 border-t border-white/10 text-xs text-white/50 font-mono">
          <span>{{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, filteredBookings.length) }} / {{ filteredBookings.length }}</span>
          <div class="flex items-center gap-2">
            <button type="button" class="px-3 py-1 border border-white/15 rounded-sm disabled:opacity-30" :disabled="currentPage <= 1" @click="currentPage--">←</button>
            <span>{{ currentPage }} / {{ totalPages }}</span>
            <button type="button" class="px-3 py-1 border border-white/15 rounded-sm disabled:opacity-30" :disabled="currentPage >= totalPages" @click="currentPage++">→</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
