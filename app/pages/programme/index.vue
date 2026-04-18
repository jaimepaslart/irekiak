<script setup lang="ts">
import type { ScheduleEvent, EventDay } from '#types/schedule'
import type { TourRoute, TourSlot } from '#types/tour'
import { schedule } from '@data/schedule'
import { currentEdition } from '@data/editions'
import { tourRoutes, tourSlots } from '@data/tours'

const { t } = useI18n()
const localePath = useLocalePath()
const tr = useTranslated()

usePageSeo('programme')
useScrollReveal()

const eventsByDay = computed(() => {
  const grouped: Record<EventDay, ScheduleEvent[]> = {
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  }
  for (const event of schedule) {
    grouped[event.day].push(event)
  }
  for (const day of Object.keys(grouped) as EventDay[]) {
    grouped[day].sort((a, b) => a.startTime.localeCompare(b.startTime))
  }
  return grouped
})

const visibleDays = computed(() =>
  currentEdition.days.filter(d => eventsByDay.value[d.id as EventDay].length > 0),
)

interface EventSlot {
  id: string
  route: TourRoute
  language: TourSlot['language']
}

const slotsByEventId = computed(() => {
  const map = new Map<string, EventSlot[]>()
  for (const event of schedule) {
    if (event.type !== 'guided-tour') continue
    const day = currentEdition.days.find(d => d.id === event.day)
    if (!day) continue
    const matched: EventSlot[] = []
    for (const s of tourSlots) {
      if (s.date !== day.date || s.startTime !== event.startTime) continue
      const route = tourRoutes.find(r => r.id === s.routeId)
      if (route) matched.push({ id: s.id, route, language: s.language })
    }
    map.set(event.id, matched)
  }
  return map
})

function dayNumber(dateShort: string): string {
  return dateShort.split('.')[0] ?? ''
}

function eventIcon(type: string): string {
  switch (type) {
    case 'opening': return 'lucide:sparkles'
    case 'guided-tour': return 'lucide:route'
    default: return 'lucide:circle'
  }
}

function ctaFor(event: ScheduleEvent): { label: string, to: string } {
  if (event.type === 'guided-tour') {
    return { label: t('programme.cta.chooseVisite'), to: localePath('/visites') }
  }
  return { label: t('programme.cta.viewGalleries'), to: localePath('/galleries') }
}
</script>

<template>
  <div class="max-w-[1100px] mx-auto px-6 md:px-12 py-24 pt-28">
    <header class="reveal-on-scroll text-center mb-20 md:mb-28">
      <p class="eyebrow mb-4">{{ currentEdition.dateRangeLabelShort }}</p>
      <h1 class="display-headline text-4xl md:text-6xl lg:text-7xl text-white mb-5">
        {{ t('programme.title') }}
      </h1>
      <p class="display-title text-lg md:text-xl text-white/60 font-light">
        {{ t('programme.subtitle') }}
      </p>
    </header>

    <div>
      <section
        v-for="(day, dayIdx) in visibleDays"
        :key="day.id"
        class="reveal-on-scroll pt-16 md:pt-24 border-t border-gold-soft first:border-t-0 first:pt-0"
        :class="`stagger-${Math.min(dayIdx + 1, 3)}`"
      >
        <p class="eyebrow mb-8 md:mb-12">
          {{ t(`common.days.${day.id}.eyebrow`) }}
        </p>

        <div class="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-6 md:gap-12">
          <div
            aria-hidden="true"
            class="hidden md:block font-extralight text-[140px] leading-none text-white/10 tabular-nums select-none pointer-events-none -mt-4"
          >
            {{ dayNumber(day.dateShort) }}
          </div>

          <div>
            <h2 class="display-headline text-3xl md:text-5xl text-white mb-3">
              {{ t(`programme.days.${day.id}.title`) }}
            </h2>
            <p class="display-title text-base md:text-lg text-white/60 font-light mb-8 md:mb-10 max-w-[560px]">
              {{ t(`programme.days.${day.id}.subtitle`) }}
            </p>

            <div class="space-y-4 md:space-y-5">
              <article
                v-for="event in eventsByDay[day.id as EventDay]"
                :key="event.id"
                class="p-5 md:p-7 border border-white/15 rounded-sm bg-white/[0.015]
                       transition-all duration-300 hover:border-gold hover:-translate-y-0.5"
              >
                <div class="flex flex-wrap items-start justify-between gap-4 mb-5">
                  <div class="flex items-baseline gap-3">
                    <Icon
                      :name="eventIcon(event.type)"
                      class="w-5 h-5 text-gold shrink-0 translate-y-0.5"
                      aria-hidden="true"
                    />
                    <span class="font-mono font-bold text-xl md:text-2xl text-white tabular-nums">
                      {{ event.startTime }}
                      <span class="text-white/40 mx-0.5">—</span>
                      {{ event.endTime }}
                    </span>
                  </div>

                  <div class="flex flex-wrap gap-2 shrink-0 justify-end">
                    <span
                      v-if="event.isFree"
                      class="text-[11px] font-medium uppercase tracking-[0.15em] px-2.5 py-1 rounded-sm bg-gold-soft text-gold"
                    >
                      {{ t('programme.badges.free') }}
                    </span>
                    <span
                      v-if="event.requiresBooking"
                      class="text-[11px] font-medium uppercase tracking-[0.15em] px-2.5 py-1 rounded-sm bg-white/10 text-white/80"
                    >
                      {{ t('programme.badges.booking') }}
                    </span>
                  </div>
                </div>

                <h3 class="text-lg md:text-xl font-medium text-white mb-2">
                  {{ tr(event.title) }}
                </h3>

                <p
                  v-if="event.type !== 'guided-tour'"
                  class="text-sm text-white/50 mb-3"
                >
                  {{ tr(event.location) }}
                </p>

                <p class="text-white/70 text-sm md:text-base leading-relaxed font-light mb-6 max-w-[560px]">
                  {{ tr(event.description) }}
                </p>

                <template v-if="event.type === 'guided-tour' && (slotsByEventId.get(event.id)?.length ?? 0) > 0">
                  <p class="eyebrow mb-3">{{ t('programme.routesLabel') }}</p>
                  <div class="space-y-2">
                    <NuxtLink
                      v-for="slot in slotsByEventId.get(event.id)"
                      :key="slot.id"
                      :to="localePath(`/visites/${slot.route.slug}`)"
                      class="group flex items-start gap-3 md:gap-4 p-3 md:p-4 border border-white/15 rounded-sm
                             transition-all hover:border-gold hover:bg-white/[0.025] scale-press focus-gold"
                    >
                      <span
                        class="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5"
                        :style="{ backgroundColor: slot.route.color }"
                        aria-hidden="true"
                      />
                      <div class="flex-1 min-w-0">
                        <div class="text-white text-sm md:text-base font-medium">
                          {{ tr(slot.route.name) }}
                        </div>
                        <div class="text-white/50 text-[11px] md:text-xs font-mono uppercase tracking-[0.12em] mt-1 tabular-nums">
                          {{ t(`common.language.${slot.language}`) }}
                          <span class="mx-1.5 opacity-60">·</span>
                          {{ tr(slot.route.duration) }}
                        </div>
                      </div>
                      <Icon
                        name="lucide:arrow-right"
                        class="w-4 h-4 text-white/40 group-hover:text-white shrink-0 mt-1 arrow-nudge transition-colors"
                        aria-hidden="true"
                      />
                    </NuxtLink>
                  </div>
                </template>

                <NuxtLink
                  v-else
                  :to="ctaFor(event).to"
                  class="inline-flex items-center gap-2 text-sm font-medium text-white border-b border-white/30 pb-0.5
                         transition-colors hover:border-white scale-press focus-gold min-h-[44px] py-2"
                >
                  {{ ctaFor(event).label }}
                  <Icon name="lucide:arrow-right" class="w-4 h-4 arrow-nudge" aria-hidden="true" />
                </NuxtLink>
              </article>
            </div>
          </div>
        </div>
      </section>

      <div v-if="visibleDays.length === 0" class="reveal-on-scroll text-center py-20">
        <p class="text-white/40 text-sm">{{ t('programme.noEvents') }}</p>
      </div>
    </div>
  </div>
</template>
