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
}

interface CheckinData {
  slot: { id: string, date: string, startTime: string, endTime: string, language: string, maxParticipants: number, bookedCount: number }
  route: { id: string, nameEu: string, nameEs: string, nameFr: string, nameEn: string, color: string }
  participants: Participant[]
  totalGuests: number
}

const routeParam = useRoute()
const slotId = computed(() => String(routeParam.params.slotId))

definePageMeta({ layout: 'default' })
useSeoMeta({ title: 'Admin · Check-in', robots: 'noindex, nofollow' })

const STORAGE_KEY = 'irekiak_admin_token'
const STORAGE_KEY_TS = 'irekiak_admin_token_ts'
const SESSION_TIMEOUT_MS = 60 * 60 * 1000

const token = ref('')
const data = ref<CheckinData | null>(null)
const errorMessage = ref<string | null>(null)

const checked = reactive<Record<string, boolean>>({})

onMounted(async () => {
  if (typeof window === 'undefined') return
  const stored = window.localStorage.getItem(STORAGE_KEY)
  const storedTs = window.localStorage.getItem(STORAGE_KEY_TS)
  const age = storedTs ? Date.now() - Number(storedTs) : Infinity
  if (!stored || age >= SESSION_TIMEOUT_MS) {
    errorMessage.value = 'Session expirée, reconnecte-toi sur /admin/bookings.'
    return
  }
  token.value = stored
  await load()
})

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

function printList() {
  window.print()
}
</script>

<template>
  <div class="max-w-[900px] mx-auto px-6 md:px-12 py-12 pt-24">
    <NuxtLink to="/admin/bookings" class="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-8 no-print">
      ← Admin
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
          <span>👥 {{ data.totalGuests }}/{{ data.slot.maxParticipants }} participants</span>
        </div>
      </div>

      <div class="mb-6 no-print">
        <button type="button" class="px-5 py-2 text-sm font-medium bg-white text-[var(--color-edition)] rounded-sm hover:bg-white/90" @click="printList">
          🖨 Imprimer
        </button>
      </div>

      <!-- Participants table -->
      <table class="w-full text-sm print-table">
        <thead>
          <tr class="text-left text-xs uppercase tracking-wider text-white/50 font-mono border-b border-white/20">
            <th class="py-3 pr-2 w-10">☐</th>
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
          <tr v-for="p in data.participants" :key="p.id" class="border-b border-white/10 align-top">
            <td class="py-3 pr-2">
              <input v-model="checked[p.id]" type="checkbox" class="w-4 h-4 accent-white">
            </td>
            <td class="py-3 px-2">
              <div class="font-medium">{{ p.lastName.toUpperCase() }}, {{ p.firstName }}</div>
            </td>
            <td class="py-3 px-2 font-mono">{{ p.guests }}</td>
            <td class="py-3 px-2 text-xs">
              <div><a :href="`mailto:${p.email}`" class="text-white hover:underline">{{ p.email }}</a></div>
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
