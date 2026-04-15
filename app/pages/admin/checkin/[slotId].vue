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

definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Admin · Check-in', robots: 'noindex, nofollow' })

const token = inject<Ref<string>>('adminToken')!
const data = ref<CheckinData | null>(null)
const errorMessage = ref<string | null>(null)

onMounted(() => { void load() })

async function load() {
  try {
    data.value = await $fetch<CheckinData>(`/api/admin/checkin/${slotId.value}`, {
      headers: { 'x-admin-token': token.value },
    })
  }
  catch (err: unknown) {
    errorMessage.value = (err as { statusMessage?: string })?.statusMessage ?? 'Failed to load'
  }
}

async function toggleAttendance(p: Participant) {
  const nextPresent = !p.attended
  // Optimistic update
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
    alert('Save failed: ' + ((err as { statusMessage?: string })?.statusMessage ?? 'unknown'))
  }
}

function printList() {
  window.print()
}
</script>

<template>
  <div>
    <NuxtLink to="/admin/bookings" class="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-6 no-print">
      ← Réservations
    </NuxtLink>

    <p v-if="errorMessage" class="text-sm text-red-300">{{ errorMessage }}</p>

    <template v-if="data">
      <!-- Header -->
      <div class="mb-8">
        <div class="h-1 w-24 rounded-full mb-4" :style="{ backgroundColor: data.route.color }" />
        <h1 class="m-0">Check-in · {{ data.route.nameEu }}</h1>
        <div class="flex flex-wrap gap-4 text-sm text-white/60 font-mono mt-2">
          <span>📅 {{ data.slot.date }}</span>
          <span>🕐 {{ data.slot.startTime }} — {{ data.slot.endTime }}</span>
          <span>🗣 {{ data.slot.language.toUpperCase() }}</span>
          <span>👥 {{ data.totalGuests }}/{{ data.slot.maxParticipants }} inscrits</span>
          <span class="text-emerald-300">✓ {{ data.attendedCount }} présents</span>
        </div>
      </div>

      <div class="mb-6 no-print">
        <button type="button" class="px-5 py-2 text-sm font-medium bg-white text-[var(--color-edition)] rounded-sm hover:bg-white/90" @click="printList">
          🖨 Imprimer
        </button>
      </div>

      <!-- Participants table -->
      <table class="w-full text-sm print-table bg-edition-dark border border-white/10 rounded-sm">
        <thead>
          <tr class="text-left text-xs uppercase tracking-wider text-white/50 font-mono border-b border-white/20 bg-white/5">
            <th class="py-3 pr-2 w-12"></th>
            <th class="py-3 px-2">Nom</th>
            <th class="py-3 px-2">Pers.</th>
            <th class="py-3 px-2">Contact</th>
            <th class="py-3 px-2 w-28">Besoins</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="data.participants.length === 0">
            <td colspan="5" class="py-8 text-center text-white/40">Aucun participant pour ce créneau.</td>
          </tr>
          <tr
            v-for="p in data.participants"
            :key="p.id"
            class="border-b border-white/10 align-top cursor-pointer hover:bg-white/5"
            :class="{ 'bg-emerald-500/5': p.attended }"
            @click.prevent="toggleAttendance(p)"
          >
            <td class="py-3 pr-2 pl-3">
              <input
                :checked="p.attended"
                type="checkbox"
                class="w-5 h-5 accent-emerald-400"
                @click.stop="toggleAttendance(p)"
              >
            </td>
            <td class="py-3 px-2">
              <div class="font-medium">{{ p.lastName.toUpperCase() }}, {{ p.firstName }}</div>
              <NuxtLink :to="`/admin/bookings/${p.id}`" class="text-[10px] text-white/40 hover:text-white font-mono no-print" @click.stop>
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
