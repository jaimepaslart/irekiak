<script setup lang="ts">
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
  slot: { id: string, date: string, startTime: string, endTime: string, language: string, maxParticipants: number, bookedCount: number }
  route: { id: string, nameEu: string, nameEs: string, nameFr: string, nameEn: string, color: string }
  participants: Participant[]
  totalGuests: number
  attendedCount: number
}

const routeParam = useRoute()
const slotId = computed(() => String(routeParam.params.slotId))

definePageMeta({ layout: 'admin', i18n: false })
useSeoMeta({ title: 'Admin · Check-in', robots: 'noindex, nofollow' })

const { t } = useAdminT()
const token = inject<Ref<string>>('adminToken')!
const data = ref<CheckinData | null>(null)
const loading = ref(true)
const errorMessage = ref<string | null>(null)

onMounted(() => { void load() })

async function load() {
  loading.value = true
  try {
    data.value = await $fetch<CheckinData>(`/api/admin/checkin/${slotId.value}`, {
      headers: { 'x-admin-token': token.value },
    })
  }
  catch (err: unknown) {
    errorMessage.value = (err as { statusMessage?: string })?.statusMessage ?? t('checkin.loadFailed')
  }
  finally { loading.value = false }
}

async function toggleAttendance(p: Participant) {
  const nextPresent = !p.attended
  p.attended = nextPresent
  try {
    await $fetch(`/api/admin/checkin/${slotId.value}/attendance`, {
      method: 'POST',
      headers: { 'x-admin-token': token.value, 'Content-Type': 'application/json' },
      body: { bookingId: p.id, present: nextPresent },
    })
    if (data.value) {
      data.value.attendedCount += nextPresent ? 1 : -1
    }
  }
  catch (err: unknown) {
    p.attended = !nextPresent
    alert(`${t('checkin.saveFailed')}: ${(err as { statusMessage?: string })?.statusMessage ?? ''}`)
  }
}

function printList() {
  window.print()
}
</script>

<template>
  <div>
    <NuxtLink to="/admin/bookings" class="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-6 no-print print:hidden">
      {{ t('checkin.backToBookings') }}
    </NuxtLink>

    <p v-if="errorMessage" class="text-sm text-red-300">{{ errorMessage }}</p>

    <template v-if="loading && !data">
      <div class="mb-6">
        <div class="h-1 w-24 rounded-full mb-4 bg-white/10 animate-pulse"></div>
        <div class="h-7 w-72 bg-white/10 rounded mb-2 animate-pulse"></div>
        <div class="h-3 w-64 bg-white/10 rounded animate-pulse"></div>
      </div>
      <div class="space-y-3">
        <AdminSkeleton variant="card" :count="6" />
      </div>
    </template>

    <template v-if="data">
      <div class="mb-6">
        <div class="h-1 w-24 rounded-full mb-4 print:hidden" :style="{ backgroundColor: data.route.color }" />
        <h1 class="m-0 text-2xl">{{ t('checkin.overviewTitle') }} · {{ data.route.nameEu }}</h1>
        <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/60 font-mono mt-2">
          <span>{{ data.slot.date }}</span>
          <span>{{ data.slot.startTime }} — {{ data.slot.endTime }}</span>
          <span>{{ data.slot.language.toUpperCase() }}</span>
          <span>{{ t('checkin.bookedCount', { booked: data.totalGuests, capacity: data.slot.maxParticipants }) }}</span>
        </div>
      </div>

      <div class="mb-6 flex items-center justify-between gap-4 print:hidden">
        <div class="flex items-baseline gap-2">
          <span class="text-4xl md:text-5xl font-light text-emerald-300 tabular-nums">{{ data.attendedCount }}</span>
          <span class="text-lg md:text-xl text-white/50">/ {{ data.participants.length }}</span>
          <span class="text-sm text-white/50 ml-2">{{ t('checkin.present').toLowerCase() }}</span>
        </div>
        <AdminBaseButton variant="primary" @click="printList">
          {{ t('checkin.printButton') }}
        </AdminBaseButton>
      </div>

      <AdminEmptyState
        v-if="data.participants.length === 0"
        :title="t('checkin.emptyState')"
        :description="t('checkin.emptyStateDesc')"
      />

      <template v-else>
        <div class="md:hidden space-y-3 print:hidden">
          <button
            v-for="p in data.participants"
            :key="p.id"
            type="button"
            class="w-full text-left bg-edition-dark border rounded-sm p-4 transition-colors"
            :class="p.attended ? 'bg-emerald-500/20 border-emerald-400' : 'border-white/10 hover:border-white/30'"
            @click="toggleAttendance(p)"
          >
            <div class="flex items-start gap-3">
              <span
                class="flex-shrink-0 inline-flex items-center justify-center rounded-sm border-2 transition-colors"
                :class="p.attended ? 'bg-emerald-400 border-emerald-400' : 'border-white/40'"
                :style="{ width: '44px', height: '44px' }"
                :aria-label="t('checkin.togglePresentAria')"
                role="checkbox"
                :aria-checked="p.attended"
              >
                <svg v-if="p.attended" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-[var(--color-edition)]">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="text-base font-medium truncate">{{ p.lastName.toUpperCase() }}, {{ p.firstName }}</div>
                    <div class="text-sm text-white/60 truncate">{{ p.email }}</div>
                    <div v-if="p.phone" class="text-sm text-white/60">{{ p.phone }}</div>
                  </div>
                  <div class="flex-shrink-0 text-right">
                    <div class="text-2xl font-light tabular-nums leading-none">{{ p.guests }}</div>
                    <div class="text-[10px] uppercase tracking-wider text-white/40 mt-1">
                      {{ p.guests > 1 ? t('checkin.participantPlural') : t('checkin.participantSingular') }}
                    </div>
                  </div>
                </div>
                <div v-if="p.specialNeeds" class="mt-3 text-xs text-white/70 border-t border-white/10 pt-2">
                  {{ p.specialNeeds }}
                </div>
              </div>
            </div>
          </button>
        </div>

        <table class="hidden md:table w-full text-sm print-table bg-edition-dark border border-white/10 rounded-sm">
          <thead>
            <tr class="text-left text-xs uppercase tracking-wider text-white/50 font-mono border-b border-white/20 bg-white/5">
              <th class="py-3 pr-2 w-12 print:hidden"></th>
              <th class="py-3 px-2">{{ t('checkin.columnName') }}</th>
              <th class="py-3 px-2">{{ t('checkin.columnParticipants') }}</th>
              <th class="py-3 px-2">{{ t('checkin.columnContact') }}</th>
              <th class="py-3 px-2 w-28">{{ t('checkin.columnNeeds') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="p in data.participants"
              :key="p.id"
              class="border-b border-white/10 align-top cursor-pointer hover:bg-white/5"
              :class="{ 'bg-emerald-500/5': p.attended }"
              @click.prevent="toggleAttendance(p)"
            >
              <td class="py-3 pr-2 pl-3 print:hidden">
                <input
                  :checked="p.attended"
                  :aria-label="t('checkin.togglePresentAria')"
                  type="checkbox"
                  class="w-5 h-5 accent-emerald-400"
                  @click.stop="toggleAttendance(p)"
                >
              </td>
              <td class="py-3 px-2">
                <div class="font-medium">{{ p.lastName.toUpperCase() }}, {{ p.firstName }}</div>
                <NuxtLink :to="`/admin/bookings/${p.id}`" class="text-[10px] text-white/40 hover:text-white font-mono print:hidden" @click.stop>
                  {{ p.id.slice(0, 8) }}
                </NuxtLink>
              </td>
              <td class="py-3 px-2 font-mono">{{ p.guests }}</td>
              <td class="py-3 px-2 text-xs">
                <div><a :href="`mailto:${p.email}`" class="text-white hover:underline" @click.stop>{{ p.email }}</a></div>
                <div v-if="p.phone" class="text-white/60">{{ p.phone }}</div>
              </td>
              <td class="py-3 px-2 text-xs text-white/70">
                {{ p.specialNeeds || '—' }}
              </td>
            </tr>
          </tbody>
        </table>

        <div class="hidden print:block">
          <table class="w-full text-sm print-table">
            <thead>
              <tr>
                <th class="py-2 px-2 text-left border-b-2 border-black">{{ t('common.yes') }}/{{ t('common.no') }}</th>
                <th class="py-2 px-2 text-left border-b-2 border-black">{{ t('checkin.columnName') }}</th>
                <th class="py-2 px-2 text-left border-b-2 border-black">{{ t('checkin.columnParticipants') }}</th>
                <th class="py-2 px-2 text-left border-b-2 border-black">{{ t('checkin.columnContact') }}</th>
                <th class="py-2 px-2 text-left border-b-2 border-black">{{ t('checkin.columnNeeds') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in data.participants" :key="`print-${p.id}`" class="border-b border-gray-400">
                <td class="py-3 px-2">☐</td>
                <td class="py-3 px-2 font-medium">{{ p.lastName.toUpperCase() }}, {{ p.firstName }}</td>
                <td class="py-3 px-2">{{ p.guests }}</td>
                <td class="py-3 px-2">
                  <div>{{ p.email }}</div>
                  <div v-if="p.phone">{{ p.phone }}</div>
                </td>
                <td class="py-3 px-2">{{ p.specialNeeds || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </template>
  </div>
</template>

<style>
@media print {
  body { background: white !important; color: black !important; }
  .no-print { display: none !important; }
  table.print-table { color: black !important; border-collapse: collapse; }
  table.print-table thead { border-bottom: 2px solid black; }
  table.print-table tbody tr { border-bottom: 1px solid #ccc; }
  table.print-table a { color: black !important; text-decoration: none !important; }
}
</style>
