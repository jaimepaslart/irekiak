<script setup lang="ts">
interface Entry {
  id: string
  timestamp: string
  bookingId: string | null
  channel: string
  recipient: string
  eventType: string
}

definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Admin · Emails', robots: 'noindex, nofollow' })

const token = inject<Ref<string>>('adminToken')!
const entries = ref<Entry[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 50
const errorMessage = ref<string | null>(null)

async function load() {
  try {
    const offset = (page.value - 1) * pageSize
    const res = await $fetch<{ entries: Entry[], total: number }>(`/api/admin/emails?limit=${pageSize}&offset=${offset}`, { headers: { 'x-admin-token': token.value } })
    entries.value = res.entries
    total.value = res.total
  }
  catch (err: unknown) {
    errorMessage.value = (err as { statusMessage?: string })?.statusMessage ?? 'Failed'
  }
}
onMounted(() => { void load() })
watch(page, () => { void load() })
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

function eventColor(type: string) {
  if (type.includes('delivered')) return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
  if (type.includes('bounced') || type.includes('complained')) return 'text-red-300 bg-red-500/10 border-red-500/30'
  if (type.includes('delayed')) return 'text-orange-300 bg-orange-500/10 border-orange-500/30'
  if (type.includes('opened') || type.includes('clicked')) return 'text-blue-300 bg-blue-500/10 border-blue-500/30'
  return 'text-white/70 bg-white/5 border-white/15'
}
</script>

<template>
  <div>
    <h1 class="m-0 text-2xl mb-2">Emails</h1>
    <p class="text-sm text-white/50 mb-8">Events Resend (delivered, bounced, complained…). Nécessite <code class="text-xs bg-white/10 px-1 rounded">NUXT_RESEND_WEBHOOK_SECRET</code> + webhook configuré dans Resend dashboard.</p>

    <p v-if="errorMessage" class="text-sm text-red-300 mb-4">{{ errorMessage }}</p>

    <div class="bg-edition-dark border border-white/10 rounded-sm overflow-hidden">
      <div class="flex items-center justify-between px-4 py-3 border-b border-white/10 text-xs text-white/50 font-mono">
        <span>{{ entries.length }} (page {{ page }} / {{ totalPages }}) · {{ total }} total</span>
        <div class="flex items-center gap-2">
          <button type="button" class="px-3 py-1 border border-white/15 rounded-sm disabled:opacity-30" :disabled="page <= 1" @click="page--">←</button>
          <button type="button" class="px-3 py-1 border border-white/15 rounded-sm disabled:opacity-30" :disabled="page >= totalPages" @click="page++">→</button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-white/5">
            <tr class="text-left text-xs uppercase tracking-wider text-white/50 font-mono">
              <th class="px-4 py-3">When</th>
              <th class="px-4 py-3">Event</th>
              <th class="px-4 py-3">Channel</th>
              <th class="px-4 py-3">Recipient</th>
              <th class="px-4 py-3">Booking</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="entries.length === 0">
              <td colspan="5" class="py-10 text-center text-white/40">Aucun événement email. Webhook Resend non configuré ou pas encore reçu.</td>
            </tr>
            <tr v-for="e in entries" :key="e.id" class="border-t border-white/5">
              <td class="px-4 py-3 font-mono text-xs text-white/60 whitespace-nowrap">{{ e.timestamp }}</td>
              <td class="px-4 py-3">
                <span class="inline-block text-xs px-2 py-0.5 rounded-full border" :class="eventColor(e.eventType)">{{ e.eventType }}</span>
              </td>
              <td class="px-4 py-3 text-xs font-mono">{{ e.channel }}</td>
              <td class="px-4 py-3 text-xs">{{ e.recipient }}</td>
              <td class="px-4 py-3 text-xs font-mono">
                <NuxtLink v-if="e.bookingId" :to="`/admin/bookings/${e.bookingId}`" class="text-white/70 hover:text-white hover:underline">{{ e.bookingId.slice(0, 8) }}</NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
