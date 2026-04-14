<script setup lang="ts">
import type { ScheduleEvent, EventDay } from '#types/schedule'
import { schedule } from '@data/schedule'

const { t } = useI18n()
const localePath = useLocalePath()
const tr = useTranslated()

usePageSeo('programme')
useScrollReveal()

const dayLabels: { day: EventDay; label: string; date: string }[] = [
  { day: 'thursday', label: 'Ostegun', date: '11.09' },
  { day: 'friday', label: 'Ostiral', date: '12.09' },
  { day: 'saturday', label: 'Larunbat', date: '13.09' },
  { day: 'sunday', label: 'Igande', date: '14.09' },
]

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
  // Sort each day by startTime
  for (const day of Object.keys(grouped) as EventDay[]) {
    grouped[day].sort((a, b) => a.startTime.localeCompare(b.startTime))
  }
  return grouped
})

// Default to first day that has events
const activeDay = ref<EventDay>(
  dayLabels.find((d) => eventsByDay.value[d.day].length > 0)?.day ?? 'thursday',
)

const activeEvents = computed(() => eventsByDay.value[activeDay.value])

function eventIcon(type: string): string {
  switch (type) {
    case 'opening': return '\u2605'
    case 'guided-tour': return '\u25CE'
    case 'special': return '\u25B6'
    default: return '\u25CF'
  }
}
</script>

<template>
  <div class="max-w-[1200px] mx-auto px-6 md:px-12 py-24 pt-28">
    <!-- Title -->
    <div class="reveal-on-scroll mb-16 text-center">
      <p class="text-xs uppercase tracking-[0.2em] text-white/40 font-mono mb-3">
        11 &gt; 14 Sept 2025
      </p>
      <h1>{{ t('nav.programme') }}</h1>
    </div>

    <!-- Day tabs -->
    <div class="reveal-on-scroll stagger-1 flex flex-wrap gap-2 mb-12">
      <button
        v-for="d in dayLabels"
        :key="d.day"
        :class="[
          'px-5 py-2.5 text-sm font-medium transition-all duration-200 rounded-sm cursor-pointer',
          activeDay === d.day
            ? 'bg-white text-[var(--color-edition)]'
            : 'border border-white/15 text-white/60 hover:text-white hover:border-white/30',
        ]"
        @click="activeDay = d.day"
      >
        <span class="font-mono font-bold">{{ d.label }}</span>
        <span class="ml-2 text-xs opacity-60">({{ d.date }})</span>
      </button>
    </div>

    <!-- Timeline -->
    <div class="reveal-on-scroll stagger-2 space-y-4">
      <div
        v-for="event in activeEvents"
        :key="event.id"
        class="group flex gap-6 md:gap-10 p-6 border border-white/15 rounded-sm
               transition-all duration-300 hover:bg-white/5 hover:border-white/25"
      >
        <!-- Time (left) -->
        <div class="shrink-0 w-20 md:w-24 pt-0.5">
          <p class="font-mono font-bold text-white text-lg">{{ event.startTime }}</p>
          <p class="font-mono text-white/40 text-xs">{{ event.endTime }}</p>
        </div>

        <!-- Content (right) -->
        <div class="flex-1 min-w-0">
          <div class="flex flex-wrap items-start gap-3 mb-2">
            <!-- Type icon -->
            <span class="text-white/50 text-sm mt-0.5">{{ eventIcon(event.type) }}</span>

            <h3 class="text-lg font-semibold text-white flex-1">
              {{ tr(event.title) }}
            </h3>

            <!-- Badges -->
            <div class="flex flex-wrap gap-2 shrink-0">
              <span
                v-if="event.isFree"
                class="text-xs font-medium px-2.5 py-1 rounded-sm bg-emerald-500/20 text-emerald-300"
              >
                Gratuito
              </span>
              <span
                v-if="event.requiresBooking"
                class="text-xs font-medium px-2.5 py-1 rounded-sm bg-white/10 text-white/70"
              >
                {{ t('programme.booking') || 'Inscripci\u00F3n' }}
              </span>
            </div>
          </div>

          <p class="text-sm text-white/50 mb-3 font-mono">
            {{ tr(event.location) }}
            <span v-if="event.address" class="text-white/30"> &middot; {{ event.address }}</span>
          </p>

          <p class="text-white/70 text-sm leading-relaxed">
            {{ tr(event.description) }}
          </p>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="activeEvents.length === 0"
        class="text-center py-16"
      >
        <p class="text-white/40 text-sm">{{ t('programme.noEvents') || 'Ez dago ekitaldirik egun honetan' }}</p>
      </div>
    </div>
  </div>
</template>
