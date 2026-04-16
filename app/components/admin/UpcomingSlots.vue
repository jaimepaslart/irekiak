<script setup lang="ts">
export interface UpcomingSlot {
  slotId: string
  date: string
  startTime: string
  routeId: string
  language: string
  booked: number
  max: number
  rate: number
}

interface Props {
  slots: UpcomingSlot[]
  emptyLabel: string
  fullLabel: string
  lowFillLabel: string
  placesLabel: (booked: number, max: number) => string
}

const props = defineProps<Props>()

const { formatLongDate } = useAdminT()

interface PreparedSlot extends UpcomingSlot {
  longDate: string
  endTime: string
  routeSlug: string
  routeLabel: string
  variant: 'low' | 'full' | 'normal'
  badge: string | null
}

function addMinutes(time: string, minutes: number): string {
  const parts = time.split(':')
  const h = Number(parts[0] ?? 0)
  const m = Number(parts[1] ?? 0)
  const total = h * 60 + m + minutes
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

function variantFor(rate: number): PreparedSlot['variant'] {
  if (rate >= 100) return 'full'
  if (rate < 30) return 'low'
  return 'normal'
}

const prepared = computed<PreparedSlot[]>(() => {
  return props.slots.map((s) => {
    const routeSlug = routeSlugFromId(s.routeId)
    const routeLabel = routeSlug.replace(/-/g, ' + ').replace(/\b\w/g, c => c.toUpperCase())
    const variant = variantFor(s.rate)
    const badge = variant === 'low' ? props.lowFillLabel : variant === 'full' ? props.fullLabel : null
    return {
      ...s,
      longDate: formatLongDate(s.date),
      endTime: addMinutes(s.startTime, 90),
      routeSlug,
      routeLabel,
      variant,
      badge,
    }
  })
})

function barColor(variant: PreparedSlot['variant']) {
  if (variant === 'low') return '#f59e0b'
  if (variant === 'full') return '#34d399'
  return 'var(--color-accent-gold)'
}
</script>

<template>
  <div v-if="prepared.length === 0" class="text-sm text-white/40 italic font-serif py-6 pl-6">
    {{ emptyLabel }}
  </div>
  <ol v-else class="relative pl-6 md:pl-8">
    <span class="absolute top-2 bottom-2 left-[7px] md:left-[11px] w-px bg-gold-soft" aria-hidden="true"></span>
    <li
      v-for="(s, i) in prepared"
      :key="s.slotId"
      class="relative pb-7 last:pb-0 editorial-in"
      :style="{ animationDelay: `${i * 70}ms` }"
    >
      <span
        class="absolute left-[-1px] md:left-[3px] top-2 w-[14px] h-[14px] rounded-full border-2 bg-[var(--color-edition)]"
        :class="{
          'border-gold': s.variant === 'normal',
          'border-orange-400': s.variant === 'low',
          'border-emerald-400': s.variant === 'full',
        }"
        aria-hidden="true"
      ></span>

      <NuxtLink
        :to="`/admin/parcours/${s.routeSlug}/slot/${s.slotId}`"
        class="block focus-gold rounded-sm group hover-lift"
      >
        <div class="flex items-start justify-between gap-4 mb-2">
          <div class="min-w-0">
            <p class="font-serif text-lg text-white leading-tight" style="font-weight: 500;">
              {{ s.longDate }}
            </p>
            <p class="mt-1 flex items-baseline gap-2 text-white">
              <span class="font-serif text-2xl md:text-3xl tabular-nums" style="font-weight: 400;">{{ s.startTime }}</span>
              <span class="text-white/35 text-sm tabular-nums">→ {{ s.endTime }}</span>
            </p>
          </div>
          <span
            v-if="s.badge"
            class="text-[10px] uppercase tracking-[0.18em] font-mono px-2 py-1 rounded-sm whitespace-nowrap shrink-0"
            :class="{
              'border border-orange-400/40 text-orange-300 bg-orange-500/10': s.variant === 'low',
              'border border-emerald-400/40 text-emerald-300 bg-emerald-500/10': s.variant === 'full',
            }"
          >
            {{ s.badge }}
          </span>
        </div>

        <div class="flex items-center gap-3 text-xs text-white/55 mb-3">
          <span class="uppercase tracking-wider font-mono">{{ s.language }}</span>
          <span class="text-white/20">·</span>
          <span class="font-serif italic">{{ s.routeLabel }}</span>
          <span class="text-white/20">·</span>
          <span class="tabular-nums">{{ placesLabel(s.booked, s.max) }}</span>
        </div>

        <div class="h-[2px] w-full bg-white/10 overflow-hidden">
          <div
            class="h-full transition-[width] duration-700 ease-out"
            :style="{ width: `${Math.min(100, s.rate)}%`, backgroundColor: barColor(s.variant) }"
          />
        </div>
      </NuxtLink>
    </li>
  </ol>
</template>
