<script setup lang="ts">
import dayjs, { type Dayjs } from 'dayjs'

interface Props {
  modelValue: string | null
  availableDates: string[]
  minDate?: string
  maxDate?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  minDate: undefined,
  maxDate: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { locale } = useI18n()

// Anchor the initial month on the selected date, otherwise on the first
// available date, otherwise on the current month.
const anchor = computed<Dayjs>(() => {
  if (props.modelValue) return dayjs(props.modelValue)
  if (props.availableDates.length > 0) {
    const sorted = [...props.availableDates].sort()
    return dayjs(sorted[0]!)
  }
  return dayjs()
})

const {
  currentDate,
  daysInMonth,
  leadingEmptyCells,
  monthName,
  prev,
  next,
  isToday,
  isSelected,
} = useCalendar(anchor.value.year(), anchor.value.month())

// When the modelValue changes to a different month, scroll the calendar there.
watch(() => props.modelValue, (v) => {
  if (!v) return
  const d = dayjs(v)
  if (!d.isSame(currentDate.value, 'month')) {
    currentDate.value = d.startOf('month')
  }
})

const availableSet = computed(() => new Set(props.availableDates))

const minDay = computed(() => (props.minDate ? dayjs(props.minDate).startOf('day') : null))
const maxDay = computed(() => (props.maxDate ? dayjs(props.maxDate).startOf('day') : null))

function isAvailable(date: Dayjs): boolean {
  return availableSet.value.has(date.format('YYYY-MM-DD'))
}

function isOutOfRange(date: Dayjs): boolean {
  if (minDay.value && date.isBefore(minDay.value)) return true
  if (maxDay.value && date.isAfter(maxDay.value)) return true
  return false
}

function isDisabled(date: Dayjs): boolean {
  return isOutOfRange(date) || !isAvailable(date)
}

function select(date: Dayjs) {
  if (isDisabled(date)) return
  emit('update:modelValue', date.format('YYYY-MM-DD'))
}

// Weekday labels (Mon-Sun) localised.
const weekdays = computed<string[]>(() => {
  const start = dayjs().locale(locale.value).startOf('week')
  // dayjs startOf('week') is Sunday by default; normalise to Monday.
  const base = start.day() === 0 ? start.add(1, 'day') : start
  return Array.from({ length: 7 }, (_, i) => base.add(i, 'day').format('dd'))
})

// Keyboard navigation: track focused day index.
const focusedIso = ref<string | null>(null)

function focusDate(d: Dayjs) {
  focusedIso.value = d.format('YYYY-MM-DD')
  if (!d.isSame(currentDate.value, 'month')) {
    currentDate.value = d.startOf('month')
  }
  nextTick(() => {
    const el = document.querySelector<HTMLButtonElement>(
      `[data-cal-day="${d.format('YYYY-MM-DD')}"]`,
    )
    el?.focus()
  })
}

function onKeydown(event: KeyboardEvent, date: Dayjs) {
  let next: Dayjs | null = null
  switch (event.key) {
    case 'ArrowRight':
      next = date.add(1, 'day')
      break
    case 'ArrowLeft':
      next = date.subtract(1, 'day')
      break
    case 'ArrowDown':
      next = date.add(7, 'day')
      break
    case 'ArrowUp':
      next = date.subtract(7, 'day')
      break
    case 'Home':
      next = date.startOf('week')
      break
    case 'End':
      next = date.endOf('week')
      break
    case 'PageUp':
      next = date.subtract(1, 'month')
      break
    case 'PageDown':
      next = date.add(1, 'month')
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      select(date)
      return
    default:
      return
  }
  event.preventDefault()
  if (next) focusDate(next)
}

// Slide direction for month transitions
const slideDir = ref<'next' | 'prev'>('next')
function handlePrev() {
  slideDir.value = 'prev'
  prev()
}
function handleNext() {
  slideDir.value = 'next'
  next()
}
</script>

<template>
  <div class="border border-white/15 rounded-sm p-4 md:p-6 bg-white/5 backdrop-blur-sm">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <button
        type="button"
        class="group w-10 h-10 md:w-9 md:h-9 flex items-center justify-center rounded-sm border border-white/15 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200 scale-press focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        :aria-label="$t('booking.previousMonth')"
        @click="handlePrev"
      >
        <span class="arrow-nudge-back">&larr;</span>
      </button>
      <h3
        :key="monthName"
        class="text-sm font-mono uppercase tracking-wider text-white animate-[fade-in_300ms_ease-out]"
      >
        {{ monthName }}
      </h3>
      <button
        type="button"
        class="group w-10 h-10 md:w-9 md:h-9 flex items-center justify-center rounded-sm border border-white/15 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200 scale-press focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        :aria-label="$t('booking.nextMonth')"
        @click="handleNext"
      >
        <span class="arrow-nudge">&rarr;</span>
      </button>
    </div>

    <!-- Weekday labels -->
    <div class="grid grid-cols-7 gap-1 mb-2">
      <div
        v-for="(w, i) in weekdays"
        :key="i"
        class="text-center text-[10px] md:text-xs font-mono uppercase tracking-wider text-white/40 py-2"
      >
        {{ w }}
      </div>
    </div>

    <!-- Days grid with month slide transition -->
    <Transition :name="slideDir === 'next' ? 'cal-slide-next' : 'cal-slide-prev'" mode="out-in">
      <div
        :key="monthName"
        class="grid grid-cols-7 gap-1"
        role="grid"
        :aria-label="monthName"
      >
        <div
          v-for="n in leadingEmptyCells"
          :key="`empty-${n}`"
          aria-hidden="true"
        />

        <button
          v-for="day in daysInMonth"
          :key="day.format('YYYY-MM-DD')"
          type="button"
          role="gridcell"
          :data-cal-day="day.format('YYYY-MM-DD')"
          :disabled="isDisabled(day)"
          :aria-selected="isSelected(day, modelValue)"
          :aria-current="isToday(day) ? 'date' : undefined"
          :tabindex="isSelected(day, modelValue) || (!modelValue && day.isSame(daysInMonth[0], 'day')) ? 0 : -1"
          :class="[
            'cal-day relative aspect-square min-h-[44px] md:min-h-0 flex items-center justify-center text-sm rounded-sm transition-all duration-200 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
            isSelected(day, modelValue)
              ? 'cal-day-selected bg-white text-[var(--color-edition)]'
              : isDisabled(day)
                ? 'cal-day-disabled cursor-not-allowed text-white/30'
                : 'cal-day-available bg-white/10 text-white cursor-pointer',
            isToday(day) && !isSelected(day, modelValue) ? 'cal-day-today' : '',
          ]"
          @click="select(day)"
          @keydown="onKeydown($event, day)"
        >
          <span>{{ day.date() }}</span>
          <!-- Today dot indicator -->
          <span
            v-if="isToday(day) && !isSelected(day, modelValue)"
            aria-hidden="true"
            class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/70"
          />
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Available date hover glow */
.cal-day-available:hover {
  background-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.2),
              0 4px 14px -4px rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}

/* Selected elegant ring pulse */
.cal-day-selected {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.4),
              0 4px 20px -4px rgba(255, 255, 255, 0.5);
  animation: cal-ring 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Today subtle ring */
.cal-day-today {
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.35);
}

/* Unavailable subtle diagonal stripe pattern */
.cal-day-disabled {
  background-image: repeating-linear-gradient(
    135deg,
    transparent,
    transparent 5px,
    rgba(255, 255, 255, 0.04) 5px,
    rgba(255, 255, 255, 0.04) 6px
  );
  background-color: rgba(255, 255, 255, 0.02);
}

@keyframes cal-ring {
  0%, 100% {
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.4),
                0 4px 20px -4px rgba(255, 255, 255, 0.5);
  }
  50% {
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.15),
                0 4px 22px -2px rgba(255, 255, 255, 0.55);
  }
}

/* Month slide transition */
.cal-slide-next-enter-active,
.cal-slide-prev-enter-active {
  transition: opacity 280ms cubic-bezier(0.23, 1, 0.32, 1),
              transform 280ms cubic-bezier(0.23, 1, 0.32, 1);
}
.cal-slide-next-leave-active,
.cal-slide-prev-leave-active {
  transition: opacity 200ms cubic-bezier(0.4, 0, 1, 1),
              transform 200ms cubic-bezier(0.4, 0, 1, 1);
}
.cal-slide-next-enter-from {
  opacity: 0;
  transform: translateX(1.25rem);
}
.cal-slide-next-leave-to {
  opacity: 0;
  transform: translateX(-1.25rem);
}
.cal-slide-prev-enter-from {
  opacity: 0;
  transform: translateX(-1.25rem);
}
.cal-slide-prev-leave-to {
  opacity: 0;
  transform: translateX(1.25rem);
}

@media (prefers-reduced-motion: reduce) {
  .cal-day-selected {
    animation: none;
  }
  .cal-day-available:hover {
    transform: none;
  }
  .cal-slide-next-enter-active,
  .cal-slide-prev-enter-active,
  .cal-slide-next-leave-active,
  .cal-slide-prev-leave-active {
    transition: opacity 150ms ease !important;
  }
  .cal-slide-next-enter-from,
  .cal-slide-next-leave-to,
  .cal-slide-prev-enter-from,
  .cal-slide-prev-leave-to {
    transform: none;
  }
}
</style>
