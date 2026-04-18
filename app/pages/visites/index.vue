<script setup lang="ts">
import type { TourRoute, TourSlot } from '#types/tour'
import { tourRoutes, tourSlots } from '@data/tours'
import { galleries } from '@data/galleries'
import { currentEdition } from '@data/editions'

const { t } = useI18n()
const localePath = useLocalePath()
const tr = useTranslated()

usePageSeo('tours')
useScrollReveal()

const slotsByRoute = computed(() => {
  const grouped: Record<string, TourSlot[]> = {}
  for (const slot of tourSlots as TourSlot[]) {
    (grouped[slot.routeId] ??= []).push(slot)
  }
  for (const rid in grouped) {
    grouped[rid]!.sort((a, b) =>
      a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime),
    )
  }
  return grouped
})

function galleriesForRoute(galleryIds: string[]) {
  return galleries.filter(g => galleryIds.includes(g.id))
}

function dayEyebrowForDate(date: string): string {
  const day = currentEdition.days.find(d => d.date === date)
  if (!day) return ''
  return t(`programme.days.${day.id}.eyebrow`)
}
</script>

<template>
  <div class="max-w-[1100px] mx-auto px-6 md:px-12 py-24 pt-28">
    <!-- Hero -->
    <header class="reveal-on-scroll text-center mb-20 md:mb-28">
      <p class="eyebrow mb-4">{{ t('tours.heroEyebrow') }}</p>
      <h1 class="display-headline text-4xl md:text-6xl lg:text-7xl text-white mb-5">
        {{ t('tours.heroTitle') }}
      </h1>
      <p class="display-title text-lg md:text-xl text-white/60 font-light max-w-[640px] mx-auto">
        {{ t('tours.heroSubtitle') }}
      </p>
    </header>

    <!-- Routes -->
    <div class="space-y-16 md:space-y-24">
      <section
        v-for="(route, idx) in (tourRoutes as TourRoute[])"
        :key="route.id"
        class="reveal-on-scroll pt-12 md:pt-16 border-t border-gold-soft first:border-t-0 first:pt-0"
        :class="`stagger-${Math.min(idx + 1, 3)}`"
      >
        <!-- Route name + color dot -->
        <div class="flex items-center gap-4 mb-4 md:mb-5">
          <span
            class="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full shrink-0"
            :style="{ backgroundColor: route.color }"
            aria-hidden="true"
          />
          <h2 class="display-headline text-3xl md:text-5xl text-white">
            {{ tr(route.name) }}
          </h2>
        </div>

        <!-- Description -->
        <p class="text-white/70 text-base md:text-lg leading-relaxed font-light mb-6 md:mb-8 max-w-[640px]">
          {{ tr(route.description) }}
        </p>

        <!-- Meta: meeting point + duration + distance -->
        <p class="text-[11px] md:text-xs font-mono text-white/50 mb-8 md:mb-10 uppercase tracking-[0.12em]">
          <span class="text-white/80">{{ tr(route.meetingPoint.name) }}</span>
          <span class="mx-2 opacity-60">·</span>
          {{ tr(route.duration) }}
          <span class="mx-2 opacity-60">·</span>
          {{ tr(route.distance) }}
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 mb-8 md:mb-10">
          <!-- Galleries -->
          <div>
            <p class="eyebrow mb-3">{{ t('tours.galleriesLabel') }}</p>
            <div class="flex flex-wrap gap-2">
              <NuxtLink
                v-for="g in galleriesForRoute(route.galleryIds)"
                :key="g.id"
                :to="localePath(`/galleries/${g.slug}`)"
                class="group inline-flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm text-white/80
                       border border-white/15 rounded-full transition-colors
                       hover:border-gold hover:text-white scale-press focus-gold"
              >
                {{ g.name }}
                <Icon
                  name="lucide:arrow-up-right"
                  class="w-3 h-3 text-white/40 group-hover:text-white transition-colors"
                  aria-hidden="true"
                />
              </NuxtLink>
            </div>
          </div>

          <!-- Slots -->
          <div>
            <p class="eyebrow mb-3">{{ t('tours.slotsLabel') }}</p>
            <div class="space-y-2">
              <div
                v-for="slot in slotsByRoute[route.id]"
                :key="slot.id"
                class="flex items-center gap-3 md:gap-4 p-3 md:p-3.5 border border-white/15 rounded-sm"
              >
                <Icon
                  name="lucide:calendar-days"
                  class="w-4 h-4 text-gold shrink-0"
                  aria-hidden="true"
                />
                <span class="text-white/80 text-[11px] md:text-xs font-mono uppercase tracking-[0.12em] shrink-0">
                  {{ dayEyebrowForDate(slot.date) }}
                </span>
                <span class="text-white font-mono tabular-nums text-sm md:text-base flex-1 text-right md:text-left">
                  {{ slot.startTime }} — {{ slot.endTime }}
                </span>
                <span class="text-white/60 text-[11px] md:text-xs font-mono uppercase tracking-[0.12em] shrink-0">
                  {{ t(`programme.language.${slot.language}`) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- CTA -->
        <NuxtLink
          :to="localePath(`/visites/${route.slug}`)"
          class="inline-flex items-center gap-2 text-sm font-medium text-white border-b border-white/30 pb-0.5
                 transition-colors hover:border-white scale-press focus-gold min-h-[44px] py-2"
        >
          {{ t('tours.bookCta') }}
          <Icon name="lucide:arrow-right" class="w-4 h-4 arrow-nudge" aria-hidden="true" />
        </NuxtLink>
      </section>
    </div>
  </div>
</template>
