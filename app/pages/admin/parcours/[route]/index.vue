<script setup lang="ts">
import type { Ref } from 'vue'
import type { Gallery } from '#types/gallery'
import type { TourRoute } from '#types/tour'
import { tourRoutes as tourRoutesData } from '@data/tours'
import { galleries as galleriesData } from '@data/galleries'

const tourRoutes = tourRoutesData as TourRoute[]
const galleries = galleriesData as Gallery[]

definePageMeta({ layout: 'admin', i18n: false })
useSeoMeta({ title: 'Admin · Parcours', robots: 'noindex, nofollow' })

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

interface SlotData {
  id: string
  date: string
  startTime: string
  endTime: string
  language: string
  capacity: number
  booked: number
  attendedCount: number
}

const route = useRoute()
const router = useRouter()
const routeSlug = computed(() => String(route.params.route ?? ''))

const { t, localized } = useAdminT()
const token = inject<Ref<string>>('adminToken')!

const galleriesById = new Map(galleries.map(g => [g.id, g]))

const routeMeta = computed(() => findRouteBySlug(tourRoutes, routeSlug.value))

const galleriesLabel = computed(() => {
  if (!routeMeta.value) return ''
  return routeMeta.value.galleryIds
    .map(gid => galleriesById.get(gid)?.name)
    .filter((n): n is string => Boolean(n))
    .join(' · ')
})

const routeName = computed(() => routeMeta.value ? localized(routeMeta.value.name) : '')

const slots = ref<SlotData[]>([])
const loading = ref(true)
const errorMessage = ref<string | null>(null)

onMounted(() => {
  if (!routeMeta.value) {
    throw createError({ statusCode: 404, statusMessage: 'Parcours not found' })
  }
  void load()
})

async function load(): Promise<void> {
  loading.value = true
  errorMessage.value = null
  try {
    const all = await $fetch<SlotOverview[]>(
      '/api/admin/checkin/overview',
      { headers: { 'x-admin-token': token.value } },
    )
    const expectedRouteId = routeMeta.value!.id
    slots.value = all
      .filter(s => s.routeId === expectedRouteId)
      .map<SlotData>(s => ({
        id: s.id,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        language: s.language,
        capacity: s.maxParticipants,
        booked: s.bookedCount,
        attendedCount: s.attendedCount,
      }))
  }
  catch (err: unknown) {
    errorMessage.value = (err as { statusMessage?: string })?.statusMessage ?? t('checkin.loadFailed')
  }
  finally {
    loading.value = false
  }
}

function isUpcoming(slot: SlotData): boolean {
  const slotEnd = new Date(`${slot.date}T${slot.endTime}:00`)
  return slotEnd.getTime() >= Date.now()
}

const sortedSlots = computed(() =>
  [...slots.value].sort((a, b) => {
    const ka = `${a.date}T${a.startTime}`
    const kb = `${b.date}T${b.startTime}`
    return ka.localeCompare(kb)
  }),
)

const nextSlot = computed<SlotData | null>(() => {
  return sortedSlots.value.find(isUpcoming) ?? null
})

const otherSlots = computed<SlotData[]>(() => {
  if (!nextSlot.value) return sortedSlots.value
  return sortedSlots.value.filter(s => s.id !== nextSlot.value!.id)
})

function backToList(): void {
  void router.push('/admin/parcours')
}
</script>

<template>
  <div>
    <button
      type="button"
      class="inline-flex items-center text-sm text-white/60 hover:text-white transition-colors mb-4"
      @click="backToList"
    >
      {{ t('parcours.back') }}
    </button>

    <AdminPageHeader
      v-if="routeMeta"
      :title="routeName"
      :subtitle="galleriesLabel"
    />

    <p v-if="errorMessage" class="text-sm text-red-300 mb-4">{{ errorMessage }}</p>

    <template v-if="loading && slots.length === 0">
      <div class="space-y-4">
        <AdminSkeleton variant="card" :count="6" />
      </div>
    </template>

    <template v-else>
      <AdminEmptyState
        v-if="slots.length === 0"
        :title="t('parcours.noSlotsYet')"
        :description="t('parcours.noSlotsDesc')"
        icon="📋"
      />

      <template v-else>
        <section v-if="nextSlot" class="mb-8">
          <h3 class="text-xs uppercase tracking-wider text-white/40 font-mono mb-3">
            {{ t('parcours.nextSlot') }}
          </h3>
          <AdminParcoursSlotCard
            :slot-data="nextSlot"
            :route-slug="routeSlug"
            is-primary
          />
        </section>

        <section v-if="otherSlots.length > 0">
          <h3 class="text-xs uppercase tracking-wider text-white/40 font-mono mb-3">
            {{ t('parcours.allSlots') }}
          </h3>
          <div class="space-y-3">
            <AdminParcoursSlotCard
              v-for="s in otherSlots"
              :key="s.id"
              :slot-data="s"
              :route-slug="routeSlug"
            />
          </div>
        </section>
      </template>
    </template>
  </div>
</template>
