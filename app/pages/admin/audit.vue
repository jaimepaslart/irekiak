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

interface AuditPayload {
  entries: AuditEntry[]
  total: number
  limit: number
  offset: number
}

definePageMeta({ layout: 'admin', i18n: false })
useSeoMeta({ title: 'Admin · Audit log', robots: 'noindex, nofollow' })

const { t } = useAdminT()
const token = inject<Ref<string>>('adminToken')!
const entries = ref<AuditEntry[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 50
const loading = ref(true)
const loaded = ref(false)
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

async function load() {
  loading.value = true
  try {
    const offset = (page.value - 1) * pageSize
    const res = await $fetch<AuditPayload>(`/api/admin/audit?limit=${pageSize}&offset=${offset}`, {
      headers: { 'x-admin-token': token.value },
    })
    entries.value = res.entries
    total.value = res.total
    loaded.value = true
  }
  catch (err: unknown) {
    errorMessage.value = (err as { statusMessage?: string })?.statusMessage ?? t('common.error')
  }
  finally { loading.value = false }
}

onMounted(() => { void load() })
watch(page, () => { void load() })

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

function actionColor(a: string): string {
  if (a.includes('cancel')) return 'text-red-300 bg-red-500/10 border-red-500/30'
  if (a.includes('create')) return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
  if (a.includes('email.failed')) return 'text-orange-300 bg-orange-500/10 border-orange-500/30'
  if (a.includes('purge')) return 'text-purple-300 bg-purple-500/10 border-purple-500/30'
  return 'text-white/70 bg-white/5 border-white/15'
}
</script>

<template>
  <div>
    <AdminPageHeader :title="t('audit.title')" :subtitle="t('audit.subtitle')" />
    <p v-if="errorMessage" class="text-sm text-red-300 mb-6">{{ errorMessage }}</p>

    <div class="flex flex-wrap gap-3 mb-6">
      <select v-model="actorFilter" class="bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-sm text-white">
        <option value="all">{{ t('audit.filterActor') }}</option>
        <option v-for="a in actors" :key="a" :value="a">{{ a }}</option>
      </select>
      <select v-model="actionFilter" class="bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-sm text-white">
        <option value="all">{{ t('audit.filterAction') }}</option>
        <option v-for="a in actions" :key="a" :value="a">{{ a }}</option>
      </select>
      <p class="text-xs text-white/40 font-mono self-center">{{ filtered.length }} / {{ entries.length }}</p>
    </div>

    <div class="bg-edition-dark border border-white/10 rounded-sm overflow-hidden">
      <div class="flex items-center justify-between px-4 py-3 border-b border-white/10 text-xs text-white/50 font-mono">
        <span>{{ t('audit.pagination', { count: entries.length, page, totalPages, total }) }}</span>
        <div class="flex items-center gap-2">
          <AdminBaseButton variant="secondary" :disabled="page <= 1" @click="page--">←</AdminBaseButton>
          <AdminBaseButton variant="secondary" :disabled="page >= totalPages" @click="page++">→</AdminBaseButton>
        </div>
      </div>
      <div class="overflow-x-auto">
        <div v-if="loading && !loaded">
          <AdminSkeleton variant="row" :count="8" />
        </div>
        <table v-else-if="filtered.length > 0" class="w-full text-sm">
          <thead class="bg-white/5">
            <tr class="text-left text-xs uppercase tracking-wider text-white/50 font-mono">
              <th class="px-4 py-3">{{ t('audit.columnWhen') }}</th>
              <th class="px-4 py-3">{{ t('audit.columnActor') }}</th>
              <th class="px-4 py-3">{{ t('audit.columnAction') }}</th>
              <th class="px-4 py-3">{{ t('audit.columnTarget') }}</th>
              <th class="px-4 py-3">{{ t('audit.columnMetadata') }}</th>
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
        <AdminEmptyState v-else icon="📋" :title="t('audit.emptyState')" />
      </div>
    </div>
  </div>
</template>
