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

const { t, localized } = useAdminT()
const { year } = useEdition()
const token = inject<Ref<string>>('adminToken')!

interface SlotOverview {
  id: string
  routeId: string
  bookedCount: number
  attendedCount: number
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'] as const

const galleriesById = new Map(galleries.map(g => [g.id, g]))
const slotCountByRouteId = tourSlots.reduce<Record<string, number>>((acc, s) => {
  acc[s.routeId] = (acc[s.routeId] ?? 0) + 1
  return acc
}, {})

const routeCards = tourRoutes.map((r, i) => {
  const galleryRefs = r.galleryIds
    .map(gid => galleriesById.get(gid))
    .filter((g): g is NonNullable<typeof g> => Boolean(g))
  return {
    id: r.id,
    slug: slugOfRoute(r),
    name: r.name,
    roman: ROMAN[i] ?? String(i + 1),
    galleries: galleryRefs,
    slotCount: slotCountByRouteId[r.id] ?? 0,
  }
})

const stats = ref<Record<string, { booked: number, attended: number }>>({})

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

function slotLabel(count: number): string {
  return count <= 1 ? t('parcours.slotOne') : t('parcours.slotMany', { count })
}
function bookedLabel(count: number): string {
  return count <= 1 ? t('parcours.bookedOne', { count }) : t('parcours.bookedMany', { count })
}
function arrivedLabel(count: number): string {
  return count <= 1 ? t('parcours.arrivedOne', { count }) : t('parcours.arrivedMany', { count })
}
</script>

<template>
  <div class="relative max-w-4xl">
    <AdminGrain />

    <AdminHeroSection
      :eyebrow="t('parcours.editionTag', { year })"
      :title="t('parcours.title')"
      :subtitle="t('parcours.subtitle')"
    />

    <section class="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
      <NuxtLink
        v-for="(route, i) in routeCards"
        :key="route.id"
        :to="`/admin/parcours/${route.slug}`"
        class="group relative block overflow-hidden border border-white/10 bg-[var(--color-edition-dark)] rounded-sm p-7 md:p-8 editorial-in focus-gold transition-[border-color,transform] duration-300 hover:border-white/20 hover-lift"
        :style="{ animationDelay: `${i * 90}ms` }"
      >
        <span
          class="absolute inset-y-0 left-0 w-[2px] bg-[var(--color-accent-gold)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          aria-hidden="true"
        ></span>

        <div class="eyebrow mb-5">
          {{ route.roman }} · {{ t('parcours.routeLabel') }}
        </div>

        <h2 class="font-serif text-2xl text-white leading-tight mb-2" style="font-weight: 400; letter-spacing: -0.01em;">
          {{ localized(route.name) }}
        </h2>

        <p class="font-serif italic text-sm text-white/60 mb-8">
          {{ route.galleries.map(g => g.name).join(' · ') }}
        </p>

        <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-white/45 font-mono uppercase tracking-wider tabular-nums">
          <span>{{ slotLabel(route.slotCount) }}</span>
          <template v-if="stats[route.id]">
            <span class="text-gold/70">·</span>
            <span>{{ bookedLabel(stats[route.id]!.booked) }}</span>
            <span class="text-gold/70">·</span>
            <span>{{ arrivedLabel(stats[route.id]!.attended) }}</span>
          </template>
        </div>

        <span
          class="arrow-nudge absolute bottom-6 right-6 text-gold text-lg leading-none"
          aria-hidden="true"
        >→</span>
      </NuxtLink>
    </section>
  </div>
</template>
