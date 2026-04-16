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
const loading = ref(true)
const errorMessage = ref<string | null>(null)

type StatusFilter = 'all' | 'confirmed' | 'cancelled' | 'waitlist'
const statusFilter = ref<StatusFilter>('all')
const dateFilter = ref<string>('all')
const searchQuery = ref<string>('')
const currentPage = ref(1)
const pageSize = 20

const selected = reactive<Record<string, boolean>>({})

const todayIso = new Date().toISOString().split('T')[0]!

const filteredBookings = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return rawBookings.value.filter((b) => {
    if (statusFilter.value === 'confirmed' && b.status !== 'confirmed') return false
    if (statusFilter.value === 'cancelled' && b.status !== 'cancelled') return false
    if (statusFilter.value === 'waitlist' && b.status !== 'waitlist') return false
    if (dateFilter.value !== 'all' && b.slotDate !== dateFilter.value) return false
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

const selectedIds = computed(() => Object.keys(selected).filter(id => selected[id]))

const editionDates = computed(() => dates.value)

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

function abbrevRoute(routeId: string): string {
  const id = routeId.replace('route-', '')
  const parts = id.split('-')
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('+')
}

function formatSlotDate(iso: string): string {
  const day = parseInt(iso.slice(8, 10), 10)
  const month = parseInt(iso.slice(5, 7), 10)
  const months = ['', 'jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc']
  return `${day} ${months[month] ?? ''}`
}

function resetSelection(): void {
  for (const k of Object.keys(selected)) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete selected[k]
  }
}

watch([statusFilter, dateFilter, searchQuery], () => {
  currentPage.value = 1
  resetSelection()
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
  resetSelection()
  await loadAll()
}

function clearSelection() {
  resetSelection()
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

// ───────── Edit drawer ─────────
const editOpen = ref(false)
const editing = ref<AdminBookingRow | null>(null)
const editSaving = ref(false)
const editError = ref<string | null>(null)

interface EditForm {
  firstName: string
  lastName: string
  email: string
  phone: string
  numberOfPeople: number
  language: 'eu' | 'es' | 'fr' | 'en'
  specialNeeds: string
  status: 'confirmed' | 'cancelled' | 'waitlist'
}
const editForm = reactive<EditForm>({
  firstName: '', lastName: '', email: '', phone: '',
  numberOfPeople: 1, language: 'es', specialNeeds: '', status: 'confirmed',
})

function openEditDrawer(b: AdminBookingRow) {
  editing.value = b
  editError.value = null
  Object.assign(editForm, {
    firstName: b.firstName,
    lastName: b.lastName,
    email: b.email,
    phone: b.phone ?? '',
    numberOfPeople: b.guests,
    language: (b.language as EditForm['language']) ?? 'es',
    specialNeeds: '',
    status: b.status,
  })
  editOpen.value = true
}

async function saveEdit() {
  if (!editing.value) return
  editSaving.value = true
  editError.value = null
  try {
    const original = editing.value
    const body: Record<string, unknown> = {}
    if (editForm.firstName !== original.firstName) body.firstName = editForm.firstName
    if (editForm.lastName !== original.lastName) body.lastName = editForm.lastName
    if (editForm.email !== original.email) body.email = editForm.email
    if ((editForm.phone || null) !== original.phone) body.phone = editForm.phone || null
    if (editForm.numberOfPeople !== original.guests) body.numberOfPeople = editForm.numberOfPeople
    if (editForm.specialNeeds) body.specialNeeds = editForm.specialNeeds

    if (Object.keys(body).length > 0) {
      await $fetch(`/api/admin/bookings/${original.id}/edit`, {
        method: 'PATCH',
        headers: { 'x-admin-token': token.value, 'Content-Type': 'application/json' },
        body,
      })
    }

    if (editForm.status !== original.status && editForm.status === 'cancelled') {
      await $fetch(`/api/admin/bookings/${original.id}/cancel`, {
        method: 'POST', headers: { 'x-admin-token': token.value },
      })
    }

    editOpen.value = false
    editing.value = null
    await loadAll()
  }
  catch (err: unknown) {
    editError.value = (err as { statusMessage?: string })?.statusMessage ?? t('bookings.saveError')
  }
  finally { editSaving.value = false }
}

// ───────── New drawer ─────────
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
  <div>
    <AdminPageHeader
      :title="t('bookings.title')"
      :subtitle="t('bookings.editionSubtitle', { year, range: dateRangeLabel })"
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
    </AdminPageHeader>

    <p v-if="errorMessage" class="text-sm text-red-300 mb-6">{{ errorMessage }}</p>
    <p v-if="newSuccess" class="text-sm text-emerald-300 mb-6">{{ t('bookings.createSuccess') }} ({{ newSuccess }})</p>

    <div v-if="loading && !stats" class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
      <AdminSkeleton variant="stat" :count="3" />
    </div>

    <div v-if="stats" class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
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
    </div>

    <div class="mb-6">
      <input
        v-model="searchQuery"
        type="search"
        :placeholder="t('bookings.searchPlaceholder')"
        class="w-full max-w-md mx-auto block bg-white/5 border border-white/15 rounded-sm text-base px-5 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
      >
    </div>

    <div class="space-y-4 mb-6">
      <AdminFilterChips
        v-model="statusFilter"
        :options="statusChipOptions"
        :label="t('bookings.filterByStatus')"
      />
      <AdminFilterChips
        v-model="dateFilter"
        :options="dateChipOptions"
        :label="t('bookings.filterByDate')"
      />
    </div>

    <div class="bg-edition-dark border border-white/10 rounded-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-white/5">
            <tr class="text-left text-xs uppercase tracking-wider text-white/50 font-mono">
              <th class="px-4 py-3 w-10" />
              <th class="px-4 py-3">{{ t('bookings.columnVisitor') }}</th>
              <th class="px-4 py-3">{{ t('bookings.columnSlot') }}</th>
              <th class="px-4 py-3">{{ t('bookings.columnStatus') }}</th>
              <th class="px-4 py-3 text-right">{{ t('bookings.columnParticipants') }}</th>
              <th class="px-4 py-3 text-right">{{ t('bookings.columnActions') }}</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="loading && rawBookings.length === 0">
              <tr v-for="n in 8" :key="`skeleton-${n}`" class="border-t border-white/5 animate-pulse">
                <td class="px-4 py-3"><div class="h-3 w-3 bg-white/10 rounded" /></td>
                <td class="px-4 py-3"><div class="h-3 w-32 bg-white/10 rounded" /></td>
                <td class="px-4 py-3"><div class="h-3 w-40 bg-white/10 rounded" /></td>
                <td class="px-4 py-3"><div class="h-5 w-20 bg-white/10 rounded-full" /></td>
                <td class="px-4 py-3"><div class="h-3 w-6 bg-white/10 rounded ml-auto" /></td>
                <td class="px-4 py-3"><div class="h-6 w-16 bg-white/10 rounded ml-auto" /></td>
              </tr>
            </template>
            <tr v-else-if="filteredBookings.length === 0">
              <td colspan="6" class="px-0 py-0">
                <AdminEmptyState :title="t('bookings.emptyState')" :description="t('bookings.emptyStateDesc')">
                  <template #action>
                    <AdminBaseButton variant="primary" type="button" @click="openNewDrawer">
                      {{ t('bookings.emptyStateCta') }}
                    </AdminBaseButton>
                  </template>
                </AdminEmptyState>
              </td>
            </tr>
            <tr v-for="b in pagedBookings" :key="b.id" class="border-t border-white/5 hover:bg-white/5">
              <td class="px-4 py-3">
                <input v-model="selected[b.id]" type="checkbox" class="accent-white" :aria-label="`Select ${b.firstName} ${b.lastName}`">
              </td>
              <td class="px-4 py-3">
                <NuxtLink :to="`/admin/bookings/${b.id}`" class="font-medium text-white hover:underline">
                  {{ b.firstName }} {{ b.lastName }}
                </NuxtLink>
                <div class="text-xs text-white/40 truncate max-w-[220px]">
                  <a :href="`mailto:${b.email}`" class="hover:underline">{{ b.email }}</a>
                </div>
              </td>
              <td class="px-4 py-3 font-mono text-xs text-white/70">
                {{ formatSlotDate(b.slotDate) }} · {{ b.slotStartTime }} · {{ abbrevRoute(b.routeId) }}
              </td>
              <td class="px-4 py-3">
                <AdminBadgeStatus :status="statusBadgeStatus(b.status)" :label="statusBadgeLabel(b.status)" />
              </td>
              <td class="px-4 py-3 text-right tabular-nums">{{ b.guests }}</td>
              <td class="px-4 py-3 text-right whitespace-nowrap">
                <button
                  type="button"
                  class="text-white/60 hover:text-white p-1.5 rounded-sm hover:bg-white/5 transition-colors"
                  :aria-label="t('bookings.detailEdit')"
                  @click="openEditDrawer(b)"
                >
                  ✎
                </button>
                <button
                  v-if="b.status === 'confirmed'"
                  type="button"
                  class="text-red-300 hover:text-red-200 p-1.5 rounded-sm hover:bg-red-500/10 transition-colors ml-1"
                  :aria-label="t('bookings.cancelBooking')"
                  @click="cancelBooking(b.id, `${b.firstName} ${b.lastName}`)"
                >
                  ✗
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="filteredBookings.length > pageSize" class="flex items-center justify-between px-4 py-3 border-t border-white/10 text-xs text-white/50 font-mono">
        <span>{{ t('bookings.paginationRange', { start: (currentPage - 1) * pageSize + 1, end: Math.min(currentPage * pageSize, filteredBookings.length), total: filteredBookings.length }) }}</span>
        <div class="flex items-center gap-2">
          <AdminBaseButton variant="secondary" :disabled="currentPage <= 1" @click="currentPage--">←</AdminBaseButton>
          <span>{{ t('bookings.paginationOf', { current: currentPage, total: totalPages }) }}</span>
          <AdminBaseButton variant="secondary" :disabled="currentPage >= totalPages" @click="currentPage++">→</AdminBaseButton>
        </div>
      </div>
    </div>

    <Teleport v-if="selectedIds.length > 0" to="body">
      <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-[var(--color-edition-dark)] border border-white/15 rounded-full px-6 py-3 flex items-center gap-4 shadow-lg">
        <span class="text-sm text-white">{{ t('bookings.bulkSelected', { count: selectedIds.length }) }}</span>
        <span class="text-white/30">·</span>
        <button type="button" class="text-sm text-red-300 hover:text-red-200 transition-colors" @click="bulkCancel">
          {{ t('bookings.bulkCancel') }}
        </button>
        <span class="text-white/30">·</span>
        <button type="button" class="text-sm text-white/60 hover:text-white transition-colors" @click="clearSelection">
          {{ t('bookings.bulkDeselect') }}
        </button>
      </div>
    </Teleport>

    <AdminDrawer v-model="editOpen" :title="editing ? t('bookings.editDrawerTitle', { name: `${editing.firstName} ${editing.lastName}` }) : ''">
      <form v-if="editing" class="space-y-4 text-sm" @submit.prevent="saveEdit">
        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="text-xs uppercase tracking-wider text-white/40 block mb-1 font-mono">{{ t('bookings.fieldFirstName') }}</span>
            <input v-model="editForm.firstName" class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
          </label>
          <label class="block">
            <span class="text-xs uppercase tracking-wider text-white/40 block mb-1 font-mono">{{ t('bookings.fieldLastName') }}</span>
            <input v-model="editForm.lastName" class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
          </label>
        </div>
        <label class="block">
          <span class="text-xs uppercase tracking-wider text-white/40 block mb-1 font-mono">{{ t('bookings.fieldEmail') }}</span>
          <input v-model="editForm.email" type="email" class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
        </label>
        <label class="block">
          <span class="text-xs uppercase tracking-wider text-white/40 block mb-1 font-mono">{{ t('bookings.fieldPhone') }}</span>
          <input v-model="editForm.phone" class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
        </label>
        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="text-xs uppercase tracking-wider text-white/40 block mb-1 font-mono">{{ t('bookings.fieldParticipants') }}</span>
            <input v-model.number="editForm.numberOfPeople" type="number" min="1" max="12" class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white tabular-nums">
          </label>
          <label class="block">
            <span class="text-xs uppercase tracking-wider text-white/40 block mb-1 font-mono">{{ t('bookings.fieldLanguage') }}</span>
            <select v-model="editForm.language" class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
              <option value="eu">Euskara</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </label>
        </div>
        <label class="block">
          <span class="text-xs uppercase tracking-wider text-white/40 block mb-1 font-mono">{{ t('bookings.fieldSpecialNeeds') }}</span>
          <textarea v-model="editForm.specialNeeds" rows="3" maxlength="1000" class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white" />
        </label>
        <label class="block">
          <span class="text-xs uppercase tracking-wider text-white/40 block mb-1 font-mono">{{ t('common.status') }}</span>
          <select v-model="editForm.status" class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-white">
            <option value="confirmed">{{ t('bookings.statusConfirmed') }}</option>
            <option value="cancelled">{{ t('bookings.statusCancelled') }}</option>
            <option value="waitlist">{{ t('bookings.statusWaitlist') }}</option>
          </select>
        </label>
        <p v-if="editError" class="text-sm text-red-300">{{ editError }}</p>
        <NuxtLink :to="`/admin/bookings/${editing.id}`" class="block text-xs text-white/50 hover:text-white underline">
          {{ t('bookings.openFullDetail') }}
        </NuxtLink>
      </form>
      <template #actions>
        <AdminBaseButton variant="ghost" type="button" :disabled="editSaving" @click="editOpen = false">
          {{ t('common.cancel') }}
        </AdminBaseButton>
        <AdminBaseButton variant="primary" type="button" :disabled="editSaving" :loading="editSaving" @click="saveEdit">
          {{ editSaving ? t('bookings.detailSaving') : t('common.save') }}
        </AdminBaseButton>
      </template>
    </AdminDrawer>

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
              <option value="fr">Français</option>
              <option value="en">English</option>
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
