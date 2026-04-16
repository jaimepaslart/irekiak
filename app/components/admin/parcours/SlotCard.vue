<script setup lang="ts">
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

interface Props {
  slotData: SlotData
  routeSlug: string
  isPrimary?: boolean
}

const props = withDefaults(defineProps<Props>(), { isPrimary: false })
const slot = computed(() => props.slotData)

const { t, locale } = useAdminT()

const dateLabel = computed(() => {
  const d = new Date(`${props.slotData.date}T00:00:00`)
  const intl = new Intl.DateTimeFormat(locale.value === 'es' ? 'es-ES' : 'fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  return intl.format(d).replace(/^./, c => c.toUpperCase())
})

const dayBadge = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const slotDate = new Date(`${props.slotData.date}T00:00:00`)
  const diff = Math.round((slotDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
  if (diff === 0) return t('parcours.today')
  if (diff === 1) return t('parcours.tomorrow')
  return null
})

const fillPct = computed(() => {
  if (props.slotData.capacity === 0) return 0
  return Math.min(100, Math.round((props.slotData.booked / props.slotData.capacity) * 100))
})

const allAttended = computed(() =>
  props.slotData.booked > 0 && props.slotData.attendedCount >= props.slotData.booked,
)

const targetUrl = computed(() => `/admin/parcours/${props.routeSlug}/slot/${props.slotData.id}`)
</script>

<template>
  <NuxtLink
    :to="targetUrl"
    class="block rounded-md border transition-colors"
    :class="[
      isPrimary
        ? 'p-6 bg-emerald-500/10 border-emerald-400/30 hover:border-emerald-400/60'
        : 'p-4 bg-white/5 border-white/10 hover:border-white/30',
    ]"
  >
    <div class="flex items-start justify-between gap-3 mb-2">
      <div class="min-w-0">
        <div
          class="font-light truncate"
          :class="isPrimary ? 'text-xl' : 'text-base'"
        >
          {{ dateLabel }}
        </div>
        <div
          class="font-mono tabular-nums text-white/80"
          :class="isPrimary ? 'text-3xl mt-1' : 'text-base mt-0.5'"
        >
          {{ slot.startTime }} <span class="text-white/40">→</span> {{ slot.endTime }}
        </div>
      </div>
      <div class="flex flex-col items-end gap-1 flex-shrink-0">
        <span
          v-if="dayBadge"
          class="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 font-mono"
        >{{ dayBadge }}</span>
        <span class="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-white/15 text-white/60 font-mono">
          {{ slot.language.toUpperCase() }}
        </span>
      </div>
    </div>

    <div class="mt-4 space-y-2">
      <div class="flex items-baseline justify-between text-sm">
        <span class="text-white/60">
          {{ t('parcours.fillRate', { booked: slot.booked, capacity: slot.capacity }) }}
        </span>
        <span
          class="font-mono tabular-nums"
          :class="[
            isPrimary ? 'text-lg' : 'text-sm',
            allAttended ? 'text-emerald-300' : 'text-white/80',
          ]"
        >
          {{ slot.attendedCount }}/{{ slot.booked }} <span class="text-white/40 text-xs">{{ t('parcours.arrived') }}</span>
        </span>
      </div>
      <div
        class="w-full bg-white/10 rounded-full overflow-hidden"
        :class="isPrimary ? 'h-2' : 'h-1.5'"
      >
        <div
          class="h-full transition-all"
          :class="allAttended ? 'bg-emerald-400' : 'bg-white/50'"
          :style="{ width: `${fillPct}%` }"
        />
      </div>
    </div>
  </NuxtLink>
</template>
