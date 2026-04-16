<script setup lang="ts">
import type { Ref } from 'vue'
import type { Gallery } from '#types/gallery'
import type { TourRoute, TourSlot } from '#types/tour'
import { tourRoutes as tourRoutesData, tourSlots as tourSlotsData } from '@data/tours'
import { galleries as galleriesData } from '@data/galleries'

const tourRoutes = tourRoutesData as TourRoute[]
const tourSlots = tourSlotsData as TourSlot[]
const galleries = galleriesData as Gallery[]

definePageMeta({ layout: 'admin', i18n: false })
useSeoMeta({ title: 'Admin · Parcours', robots: 'noindex, nofollow' })

const { t, locale } = useAdminT()
const token = inject<Ref<string>>('adminToken')!

interface SlotOverview {
  id: string
  routeId: string
  bookedCount: number
  attendedCount: number
}

const routeCards = computed(() => tourRoutes.map((r) => {
  const galleryRefs = r.galleryIds
    .map(gid => galleries.find(g => g.id === gid))
    .filter((g): g is NonNullable<typeof g> => Boolean(g))
  const slug = r.slug || r.id.replace(/^route-/, '')
  return {
    id: r.id,
    slug,
    name: r.name,
    color: r.color,
    galleries: galleryRefs,
    slotCount: tourSlots.filter(s => s.routeId === r.id).length,
  }
}))

const stats = ref<Record<string, { booked: number, attended: number }>>({})

function localized(text: { eu: string, es: string, fr: string, en: string }): string {
  return text[locale.value === 'es' ? 'es' : 'fr']
}

async function loadStats(): Promise<void> {
  try {
    const res = await $fetch<SlotOverview[]>(
      '/api/admin/checkin/overview',
      { headers: { 'x-admin-token': token.value } },
    )
    const map: Record<string, { booked: number, attended: number }> = {}
    for (const s of res) {
      map[s.routeId] ??= { booked: 0, attended: 0 }
      map[s.routeId]!.booked += s.bookedCount ?? 0
      map[s.routeId]!.attended += s.attendedCount ?? 0
    }
    stats.value = map
  }
  catch {
    // silencieux : le compteur n'apparaîtra simplement pas
  }
}

onMounted(() => { void loadStats() })
</script>

<template>
  <div>
    <AdminPageHeader :title="t('parcours.title')" :subtitle="t('parcours.subtitle')" />
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      <NuxtLink
        v-for="route in routeCards"
        :key="route.id"
        :to="`/admin/parcours/${route.slug}`"
        class="block p-6 rounded-md border border-white/10 bg-edition-dark hover:bg-white/5 transition-colors group"
        :style="`border-left: 4px solid ${route.color}`"
      >
        <h2 class="text-xl font-light text-white mb-1 group-hover:text-white">
          {{ localized(route.name) }}
        </h2>
        <p class="text-sm text-white/60 mb-4">
          {{ route.galleries.map(g => g.name).join(' · ') }}
        </p>
        <div class="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-white/50 font-mono">
          <span>{{ route.slotCount }} {{ t('parcours.slots') }}</span>
          <span v-if="stats[route.id]">{{ stats[route.id]!.booked }} {{ t('parcours.booked') }}</span>
          <span v-if="stats[route.id]" class="text-emerald-300">{{ stats[route.id]!.attended }} {{ t('parcours.arrived') }}</span>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
