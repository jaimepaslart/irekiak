<script setup lang="ts">
interface SlotOverview {
  id: string
  date: string
  startTime: string
  endTime: string
  language: string
  maxParticipants: number
  bookedCount: number
  routeId: string
  routeNameEu: string
  routeColor: string
  attendedCount: number
}

definePageMeta({ layout: 'admin', i18n: false })
useSeoMeta({ title: 'Admin · Check-in overview', robots: 'noindex, nofollow' })

const { t } = useAdminT()
const token = inject<Ref<string>>('adminToken')!
const slots = ref<SlotOverview[]>([])
const loading = ref(true)
const errorMessage = ref<string | null>(null)

onMounted(async () => {
  loading.value = true
  try {
    slots.value = await $fetch<SlotOverview[]>('/api/admin/checkin/overview', {
      headers: { 'x-admin-token': token.value },
    })
  }
  catch (err: unknown) {
    errorMessage.value = (err as { statusMessage?: string })?.statusMessage ?? t('checkin.loadFailed')
  }
  finally { loading.value = false }
})

const byDate = computed(() => {
  const map = new Map<string, SlotOverview[]>()
  for (const s of slots.value) {
    const arr = map.get(s.date) ?? []
    arr.push(s)
    map.set(s.date, arr)
  }
  return Array.from(map.entries()).sort()
})

function fillPct(s: SlotOverview) {
  return s.maxParticipants ? Math.round((s.bookedCount / s.maxParticipants) * 100) : 0
}
function attendedPct(s: SlotOverview) {
  return s.bookedCount ? Math.round((s.attendedCount / s.bookedCount) * 100) : 0
}
</script>

<template>
  <div>
    <AdminPageHeader :title="t('checkin.overviewTitle')" :subtitle="t('checkin.overviewSubtitle')" />

    <p v-if="errorMessage" class="text-sm text-red-300 mb-4">{{ errorMessage }}</p>

    <template v-if="loading && slots.length === 0">
      <div class="mb-10">
        <div class="h-5 w-32 bg-white/10 rounded mb-4 animate-pulse"></div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AdminSkeleton variant="card" :count="6" />
        </div>
      </div>
    </template>

    <AdminEmptyState
      v-else-if="!errorMessage && byDate.length === 0"
      :title="t('checkin.emptyStateOverview')"
      :description="t('checkin.emptyStateOverviewDesc')"
    />

    <div v-for="[date, dateSlots] in byDate" :key="date" class="mb-10">
      <h2 class="text-lg font-semibold mb-4">{{ date }}</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <NuxtLink
          v-for="s in dateSlots"
          :key="s.id"
          :to="`/admin/checkin/${s.id}`"
          class="block bg-edition-dark border border-white/10 rounded-sm p-5 hover:border-white/30 transition-colors"
        >
          <div class="flex items-center justify-between mb-3">
            <span class="inline-block w-1 h-5 rounded-full" :style="{ backgroundColor: s.routeColor }" />
            <span class="text-xs font-mono uppercase text-white/50">{{ s.language }}</span>
          </div>
          <p class="font-mono text-lg">{{ s.startTime }} — {{ s.endTime }}</p>
          <p class="text-white/70 capitalize mt-1">{{ s.routeId.replace('route-', '').replace(/-/g, ' + ') }}</p>

          <div class="mt-4 space-y-2">
            <div>
              <div class="flex items-center justify-between text-xs text-white/60 mb-1">
                <span>{{ t('checkin.registered') }}</span><span>{{ s.bookedCount }} / {{ s.maxParticipants }}</span>
              </div>
              <div class="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div class="h-full bg-white/70" :style="{ width: `${fillPct(s)}%` }" />
              </div>
            </div>
            <div v-if="s.bookedCount > 0">
              <div class="flex items-center justify-between text-xs text-emerald-300/80 mb-1">
                <span>{{ t('checkin.present') }}</span><span>{{ s.attendedCount }} / {{ s.bookedCount }}</span>
              </div>
              <div class="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div class="h-full bg-emerald-400" :style="{ width: `${attendedPct(s)}%` }" />
              </div>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
