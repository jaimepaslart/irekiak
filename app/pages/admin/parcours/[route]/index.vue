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

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'] as const

const route = useRoute()
const router = useRouter()
const routeSlug = computed(() => String(route.params.route ?? ''))

const { t, localized, formatLongDate } = useAdminT()
const token = inject<Ref<string>>('adminToken')!

const galleriesById = new Map(galleries.map(g => [g.id, g]))

const routeMeta = computed(() => findRouteBySlug(tourRoutes, routeSlug.value))
const routeIndex = computed(() => tourRoutes.findIndex(r => slugOfRoute(r) === routeSlug.value))
const routeRoman = computed(() => ROMAN[routeIndex.value] ?? String(routeIndex.value + 1))

const galleriesLabel = computed(() => {
  if (!routeMeta.value) return ''
  return routeMeta.value.galleryIds
    .map(gid => galleriesById.get(gid)?.name)
    .filter((n): n is string => Boolean(n))
    .join(' · ')
})

const routeName = computed(() => routeMeta.value ? localized(routeMeta.value.name) : '')

const durationLabel = computed(() => routeMeta.value ? localized(routeMeta.value.duration) : '')
const distanceLabel = computed(() => routeMeta.value ? localized(routeMeta.value.distance) : '')

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

const nextSlot = computed<SlotData | null>(() => sortedSlots.value.find(isUpcoming) ?? null)

const otherSlots = computed<SlotData[]>(() => {
  if (!nextSlot.value) return sortedSlots.value
  return sortedSlots.value.filter(s => s.id !== nextSlot.value!.id)
})

function backToList(): void {
  void router.push('/admin/parcours')
}

type SlotVariant = 'low' | 'full' | 'normal'

function variantFor(s: SlotData): SlotVariant {
  if (s.capacity === 0) return 'normal'
  const rate = (s.booked / s.capacity) * 100
  if (rate >= 100) return 'full'
  if (rate < 30) return 'low'
  return 'normal'
}

function fillRate(s: SlotData): number {
  if (s.capacity === 0) return 0
  return Math.min(100, Math.round((s.booked / s.capacity) * 100))
}

function badgeFor(variant: SlotVariant): string | null {
  if (variant === 'low') return t('parcours.lowFill')
  if (variant === 'full') return t('parcours.full')
  return null
}

function slotUrl(id: string): string {
  return `/admin/parcours/${routeSlug.value}/slot/${id}`
}
</script>

<template>
  <div class="relative max-w-4xl mx-auto">
    <div class="absolute inset-x-0 -top-10 -bottom-10 editorial-grain pointer-events-none opacity-60" aria-hidden="true"></div>

    <button
      type="button"
      class="relative inline-flex items-center text-xs text-white/50 hover:text-gold font-mono uppercase tracking-[0.18em] transition-colors mb-6 arrow-nudge-parent"
      @click="backToList"
    >
      <span class="arrow-nudge-back mr-1">←</span> {{ t('parcours.allRoutes') }}
    </button>

    <section v-if="routeMeta" class="relative mb-10 md:mb-14 editorial-in">
      <div class="eyebrow mb-4">
        {{ t('parcours.routeLabel') }} · {{ routeRoman }}
      </div>
      <h1 class="font-serif text-3xl md:text-4xl text-white" style="font-weight: 400; letter-spacing: -0.01em; line-height: 1.1;">
        {{ routeName }}
      </h1>
      <p class="mt-2 text-sm text-white/55">
        <span class="italic font-serif">{{ galleriesLabel }}</span>
      </p>
      <div class="mt-5 flex items-center gap-3 text-[11px] text-white/45 font-mono uppercase tracking-wider tabular-nums">
        <span>{{ durationLabel }}</span>
        <span class="text-gold/70">·</span>
        <span>{{ distanceLabel }}</span>
      </div>
      <div class="mt-6 h-px w-24 bg-[var(--color-accent-gold)] opacity-50"></div>
    </section>

    <p v-if="errorMessage" class="relative text-sm text-red-300 mb-4">{{ errorMessage }}</p>

    <template v-if="loading && slots.length === 0">
      <div class="relative space-y-4">
        <AdminSkeleton variant="card" :count="4" />
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
        <section v-if="nextSlot" class="relative mb-14">
          <header class="mb-6">
            <div class="eyebrow mb-2">{{ t('parcours.nextSlot') }}</div>
          </header>

          <NuxtLink
            :to="slotUrl(nextSlot.id)"
            class="group relative block overflow-hidden border border-gold-soft bg-gold-soft rounded-sm p-7 md:p-9 editorial-in focus-gold transition-colors duration-300 hover:border-gold"
          >
            <span class="absolute inset-y-0 left-0 w-[3px] bg-[var(--color-accent-gold)]" aria-hidden="true"></span>

            <div class="flex items-start justify-between gap-6 mb-6">
              <div class="min-w-0">
                <p class="font-serif text-2xl md:text-3xl text-white leading-tight mb-2" style="font-weight: 400; letter-spacing: -0.01em;">
                  {{ formatLongDate(nextSlot.date) }}
                </p>
                <p class="flex items-baseline gap-3 text-white">
                  <span class="font-serif text-4xl md:text-5xl tabular-nums" style="font-weight: 400; letter-spacing: -0.02em;">{{ nextSlot.startTime }}</span>
                  <span class="text-white/40 text-base tabular-nums">→ {{ nextSlot.endTime }}</span>
                </p>
              </div>
              <div class="flex flex-col items-end gap-2 shrink-0">
                <span class="text-[10px] uppercase tracking-[0.18em] font-mono px-2 py-1 rounded-sm border border-white/15 text-white/60">
                  {{ nextSlot.language.toUpperCase() }}
                </span>
                <span
                  v-if="badgeFor(variantFor(nextSlot))"
                  class="text-[10px] uppercase tracking-[0.18em] font-mono px-2 py-1 rounded-sm whitespace-nowrap"
                  :class="{
                    'border border-gold text-gold bg-transparent': variantFor(nextSlot) === 'full',
                    'border border-orange-400/40 text-orange-300 bg-orange-500/10': variantFor(nextSlot) === 'low',
                  }"
                >
                  {{ badgeFor(variantFor(nextSlot)) }}
                </span>
              </div>
            </div>

            <div class="flex items-baseline justify-between text-xs text-white/55 mb-3 font-mono uppercase tracking-wider tabular-nums">
              <span>{{ t('parcours.fillRate', { booked: nextSlot.booked, capacity: nextSlot.capacity }) }}</span>
              <span class="tabular-nums">
                {{ nextSlot.attendedCount }}/{{ nextSlot.booked }} <span class="text-white/30 normal-case tracking-normal font-serif italic text-xs">{{ t('parcours.arrivedLabel') }}</span>
              </span>
            </div>

            <div class="h-[3px] w-full bg-white/10 overflow-hidden">
              <div
                class="h-full transition-[width] duration-700 ease-out"
                :style="{ width: `${fillRate(nextSlot)}%`, backgroundColor: 'var(--color-accent-gold)' }"
              />
            </div>

            <div class="mt-6 flex items-center gap-2 text-xs text-gold font-mono uppercase tracking-[0.18em]">
              <span>{{ t('parcours.viewCheckin') }}</span>
              <span class="arrow-nudge">→</span>
            </div>
          </NuxtLink>
        </section>

        <section v-if="otherSlots.length > 0" class="relative mb-12">
          <header class="mb-6">
            <div class="eyebrow mb-2">{{ t('parcours.allSlots') }}</div>
          </header>

          <ol class="relative pl-6 md:pl-8">
            <span class="absolute top-2 bottom-2 left-[7px] md:left-[11px] w-px bg-gold-soft" aria-hidden="true"></span>

            <li
              v-for="(s, i) in otherSlots"
              :key="s.id"
              class="relative pb-7 last:pb-0 editorial-in"
              :style="{ animationDelay: `${i * 70}ms` }"
            >
              <span
                class="absolute left-[-1px] md:left-[3px] top-2 w-[14px] h-[14px] rounded-full border-2 bg-[var(--color-edition)]"
                :class="{
                  'border-gold': variantFor(s) === 'normal',
                  'border-orange-400': variantFor(s) === 'low',
                  'border-emerald-400': variantFor(s) === 'full',
                }"
                aria-hidden="true"
              ></span>

              <NuxtLink
                :to="slotUrl(s.id)"
                class="block focus-gold rounded-sm group hover-lift"
              >
                <div class="flex items-start justify-between gap-4 mb-2">
                  <div class="min-w-0">
                    <p class="font-serif text-lg text-white leading-tight" style="font-weight: 500;">
                      {{ formatLongDate(s.date) }}
                    </p>
                    <p class="mt-1 flex items-baseline gap-2 text-white">
                      <span class="font-serif text-2xl md:text-3xl tabular-nums" style="font-weight: 400;">{{ s.startTime }}</span>
                      <span class="text-white/35 text-sm tabular-nums">→ {{ s.endTime }}</span>
                    </p>
                  </div>
                  <div class="flex flex-col items-end gap-1 shrink-0">
                    <span class="text-[10px] uppercase tracking-[0.18em] font-mono px-2 py-0.5 rounded-sm border border-white/15 text-white/60">
                      {{ s.language.toUpperCase() }}
                    </span>
                    <span
                      v-if="badgeFor(variantFor(s))"
                      class="text-[10px] uppercase tracking-[0.18em] font-mono px-2 py-0.5 rounded-sm whitespace-nowrap"
                      :class="{
                        'border border-gold text-gold': variantFor(s) === 'full',
                        'border border-orange-400/40 text-orange-300 bg-orange-500/10': variantFor(s) === 'low',
                      }"
                    >{{ badgeFor(variantFor(s)) }}</span>
                  </div>
                </div>

                <div class="flex items-center gap-3 text-xs text-white/55 mb-3 font-mono uppercase tracking-wider tabular-nums">
                  <span>{{ t('parcours.fillRate', { booked: s.booked, capacity: s.capacity }) }}</span>
                  <span class="text-white/20">·</span>
                  <span>{{ s.attendedCount }}/{{ s.booked }} <span class="normal-case tracking-normal font-serif italic text-white/40">{{ t('parcours.arrivedLabel') }}</span></span>
                </div>

                <div class="h-[2px] w-full bg-white/10 overflow-hidden">
                  <div
                    class="h-full transition-[width] duration-700 ease-out"
                    :style="{
                      width: `${fillRate(s)}%`,
                      backgroundColor: variantFor(s) === 'low' ? '#f59e0b' : variantFor(s) === 'full' ? '#34d399' : 'var(--color-accent-gold)',
                    }"
                  />
                </div>
              </NuxtLink>
            </li>
          </ol>
        </section>
      </template>
    </template>
  </div>
</template>
