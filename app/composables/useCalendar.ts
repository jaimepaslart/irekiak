import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/eu'
import 'dayjs/locale/es'
import 'dayjs/locale/fr'
import 'dayjs/locale/en'

/**
 * Calendar composable that exposes reactive state for a month view.
 * All dates are `Dayjs` instances. Week starts on Monday.
 */
export function useCalendar(year?: number, month?: number) {
  const { locale } = useI18n()

  const initial = dayjs()
    .year(year ?? dayjs().year())
    .month(month ?? dayjs().month())
    .startOf('month')

  const currentDate = ref<Dayjs>(initial)

  // Keep dayjs locale in sync with the app locale.
  watchEffect(() => {
    dayjs.locale(locale.value)
    // Re-assign to refresh the formatted month label reactively.
    currentDate.value = currentDate.value.locale(locale.value)
  })

  const daysInMonth = computed<Dayjs[]>(() => {
    const start = currentDate.value.startOf('month')
    const total = currentDate.value.daysInMonth()
    return Array.from({ length: total }, (_, i) => start.add(i, 'day'))
  })

  /** Number of empty cells before the first day (Mon = 0 offset). */
  const leadingEmptyCells = computed<number>(() => {
    const first = currentDate.value.startOf('month').day() // 0 (Sun) to 6 (Sat)
    // Monday-first: Monday=0, Sunday=6
    return (first + 6) % 7
  })

  const monthName = computed<string>(() =>
    currentDate.value.locale(locale.value).format('MMMM YYYY'),
  )

  function prev() {
    currentDate.value = currentDate.value.subtract(1, 'month').startOf('month')
  }

  function next() {
    currentDate.value = currentDate.value.add(1, 'month').startOf('month')
  }

  function goTo(d: Dayjs | string) {
    currentDate.value = dayjs(d).startOf('month')
  }

  function isToday(date: Dayjs): boolean {
    return date.isSame(dayjs(), 'day')
  }

  function isPast(date: Dayjs): boolean {
    return date.isBefore(dayjs().startOf('day'))
  }

  function isSelected(date: Dayjs, selected?: string | Dayjs | null): boolean {
    if (!selected) return false
    return date.isSame(dayjs(selected), 'day')
  }

  return {
    currentDate,
    daysInMonth,
    leadingEmptyCells,
    monthName,
    prev,
    next,
    goTo,
    isToday,
    isPast,
    isSelected,
  }
}
