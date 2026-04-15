<script setup lang="ts">
interface AuditEntry {
  id: string
  timestamp: string
  actor: string
  action: string
  targetType: string | null
  targetId: string | null
  metadata: Record<string, unknown> | null
}

definePageMeta({ layout: 'default' })
useSeoMeta({ title: 'Admin · Audit log', robots: 'noindex, nofollow' })

const STORAGE_KEY = 'irekiak_admin_token'
const STORAGE_KEY_TS = 'irekiak_admin_token_ts'
const SESSION_TIMEOUT_MS = 60 * 60 * 1000

const token = ref('')
const entries = ref<AuditEntry[]>([])
const errorMessage = ref<string | null>(null)
const actorFilter = ref<string>('all')
const actionFilter = ref<string>('all')

const filtered = computed(() => entries.value.filter((e) => {
  if (actorFilter.value !== 'all' && e.actor !== actorFilter.value) return false
  if (actionFilter.value !== 'all' && e.action !== actionFilter.value) return false
  return true
}))

const actors = computed(() => Array.from(new Set(entries.value.map(e => e.actor))).sort())
const actions = computed(() => Array.from(new Set(entries.value.map(e => e.action))).sort())

onMounted(async () => {
  if (typeof window === 'undefined') return
  const stored = window.localStorage.getItem(STORAGE_KEY)
  const storedTs = window.localStorage.getItem(STORAGE_KEY_TS)
  const age = storedTs ? Date.now() - Number(storedTs) : Infinity
  if (!stored || age >= SESSION_TIMEOUT_MS) {
    errorMessage.value = 'Session expirée.'
    return
  }
  token.value = stored
  try {
    entries.value = await $fetch<AuditEntry[]>('/api/admin/audit?limit=500', {
      headers: { 'x-admin-token': stored },
    })
  }
  catch (err: unknown) {
    errorMessage.value = (err as { statusMessage?: string })?.statusMessage ?? 'Failed'
  }
})

function actionColor(a: string): string {
  if (a.includes('cancel')) return 'text-red-300 bg-red-500/10 border-red-500/30'
  if (a.includes('create')) return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
  if (a.includes('email.failed')) return 'text-orange-300 bg-orange-500/10 border-orange-500/30'
  if (a.includes('purge')) return 'text-purple-300 bg-purple-500/10 border-purple-500/30'
  return 'text-white/70 bg-white/5 border-white/15'
}
</script>

<template>
  <div class="max-w-[1400px] mx-auto px-6 md:px-12 py-12 pt-24">
    <NuxtLink to="/admin/bookings" class="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-8">
      ← Admin
    </NuxtLink>
    <h1 class="m-0 text-2xl mb-8">Admin · Audit log</h1>
    <p v-if="errorMessage" class="text-sm text-red-300 mb-6">{{ errorMessage }}</p>

    <div class="flex flex-wrap gap-3 mb-6">
      <select v-model="actorFilter" class="bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-sm text-white">
        <option value="all">All actors</option>
        <option v-for="a in actors" :key="a" :value="a">{{ a }}</option>
      </select>
      <select v-model="actionFilter" class="bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-sm text-white">
        <option value="all">All actions</option>
        <option v-for="a in actions" :key="a" :value="a">{{ a }}</option>
      </select>
      <p class="text-xs text-white/40 font-mono self-center">{{ filtered.length }} / {{ entries.length }}</p>
    </div>

    <div class="bg-edition-dark border border-white/10 rounded-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-white/5">
            <tr class="text-left text-xs uppercase tracking-wider text-white/50 font-mono">
              <th class="px-4 py-3">When</th>
              <th class="px-4 py-3">Actor</th>
              <th class="px-4 py-3">Action</th>
              <th class="px-4 py-3">Target</th>
              <th class="px-4 py-3">Metadata</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in filtered" :key="e.id" class="border-t border-white/5 align-top">
              <td class="px-4 py-3 font-mono text-xs text-white/60 whitespace-nowrap">{{ e.timestamp }}</td>
              <td class="px-4 py-3 text-xs">
                <span class="inline-block px-2 py-0.5 rounded-full border border-white/20 text-white/80 font-mono uppercase text-[10px]">{{ e.actor }}</span>
              </td>
              <td class="px-4 py-3">
                <span class="inline-block text-xs px-2 py-0.5 rounded-full border" :class="actionColor(e.action)">{{ e.action }}</span>
              </td>
              <td class="px-4 py-3 text-xs text-white/70 font-mono">
                <span v-if="e.targetType">{{ e.targetType }}/</span>
                <span v-if="e.targetId">{{ e.targetId.slice(0, 8) }}</span>
              </td>
              <td class="px-4 py-3 text-xs text-white/50 font-mono max-w-[400px]">
                <code v-if="e.metadata">{{ JSON.stringify(e.metadata) }}</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
