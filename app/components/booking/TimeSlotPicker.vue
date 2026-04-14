<script setup lang="ts">
export interface AvailabilitySlot {
  id: string
  routeId: string
  date: string
  startTime: string
  endTime: string
  language: 'eu' | 'es' | 'fr' | 'en'
  maxParticipants: number
  remaining: number
}

interface Props {
  slots: AvailabilitySlot[]
  modelValue: string | null
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { t } = useI18n()

// Sort by time then language for stable UX.
const sortedSlots = computed<AvailabilitySlot[]>(() =>
  [...props.slots].sort((a, b) => {
    if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime)
    return a.language.localeCompare(b.language)
  }),
)

function isFull(slot: AvailabilitySlot): boolean {
  return slot.remaining <= 0
}

function select(slot: AvailabilitySlot) {
  if (isFull(slot)) return
  emit('update:modelValue', slot.id)
}

function fillRatio(slot: AvailabilitySlot): number {
  if (slot.maxParticipants <= 0) return 0
  const booked = slot.maxParticipants - slot.remaining
  return Math.max(0, Math.min(1, booked / slot.maxParticipants))
}
</script>

<template>
  <div>
    <div
      v-if="sortedSlots.length === 0"
      class="text-center py-16 text-white/50"
    >
      <svg
        class="mx-auto w-10 h-10 mb-4 text-white/20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <p class="font-mono text-xs uppercase tracking-widest">{{ t('booking.noSlots') }}</p>
    </div>

    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <button
        v-for="slot in sortedSlots"
        :key="slot.id"
        type="button"
        :disabled="isFull(slot)"
        :aria-pressed="modelValue === slot.id"
        :class="[
          'slot-card group relative text-left p-5 border rounded-sm transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 overflow-hidden',
          modelValue === slot.id
            ? 'slot-selected bg-white text-[var(--color-edition)] border-white'
            : isFull(slot)
              ? 'slot-full cursor-not-allowed border-white/15 text-white/60'
              : 'slot-available border-white/15 hover:border-white/40 text-white',
        ]"
        @click="select(slot)"
      >
        <!-- Diagonal strike-through for full slots -->
        <span
          v-if="isFull(slot)"
          aria-hidden="true"
          class="pointer-events-none absolute inset-x-4 top-1/2 h-px bg-white/20 -rotate-[8deg] origin-center"
        />

        <div class="flex items-start justify-between mb-3">
          <p
            :class="[
              'font-mono font-bold text-lg tracking-tight',
              modelValue === slot.id ? 'text-[var(--color-edition)]' : 'text-white',
            ]"
          >
            {{ slot.startTime }}<span class="text-white/30 mx-1" :class="modelValue === slot.id ? 'text-[var(--color-edition)]/40' : ''">/</span>{{ slot.endTime }}
          </p>
          <!-- Selected check indicator -->
          <span
            v-if="modelValue === slot.id"
            aria-hidden="true"
            class="w-5 h-5 rounded-full bg-[var(--color-edition)] text-white flex items-center justify-center"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        </div>

        <div class="flex items-center justify-between mb-3">
          <span
            :class="[
              'text-[10px] font-mono uppercase tracking-[0.18em] px-2 py-0.5 rounded-full',
              modelValue === slot.id
                ? 'bg-[var(--color-edition)]/10 text-[var(--color-edition)] border border-[var(--color-edition)]/30'
                : 'bg-white/5 text-white/70 border border-white/15',
            ]"
          >
            {{ slot.language.toUpperCase() }}
          </span>
          <span
            :class="[
              'text-[10px] font-mono uppercase tracking-wider',
              modelValue === slot.id ? 'text-[var(--color-edition)]/60' : 'text-white/40',
            ]"
          >
            {{ slot.remaining }}/{{ slot.maxParticipants }}
          </span>
        </div>

        <!-- Capacity progress bar -->
        <div
          :class="[
            'h-[2px] w-full overflow-hidden rounded-full',
            modelValue === slot.id ? 'bg-[var(--color-edition)]/10' : 'bg-white/10',
          ]"
        >
          <span
            :class="[
              'block h-full transition-[width] duration-700 ease-out',
              modelValue === slot.id
                ? 'bg-[var(--color-edition)]/60'
                : isFull(slot)
                  ? 'bg-white/20'
                  : 'bg-white/50 group-hover:bg-white/80',
            ]"
            :style="{ width: `${Math.round(fillRatio(slot) * 100)}%` }"
          />
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.slot-available {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0) 100%);
}
.slot-available:hover {
  transform: scale(1.02);
  background-color: rgba(255, 255, 255, 0.03);
  box-shadow: 0 6px 22px -8px rgba(255, 255, 255, 0.2);
}
.slot-selected {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.5),
              0 6px 28px -6px rgba(255, 255, 255, 0.55);
}
.slot-full {
  background-image: repeating-linear-gradient(
    135deg,
    transparent,
    transparent 6px,
    rgba(255, 255, 255, 0.03) 6px,
    rgba(255, 255, 255, 0.03) 7px
  );
}

@media (prefers-reduced-motion: reduce) {
  .slot-available:hover {
    transform: none;
  }
}
</style>
