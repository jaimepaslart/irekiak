import { ref } from 'vue'
import type { Ref } from 'vue'
import { currentEdition } from '~~/data/editions'

interface UseEditionReturn {
  dates: Ref<string[]>
  startDate: Ref<string>
  endDate: Ref<string>
  year: Ref<number>
}

export function useEdition(): UseEditionReturn {
  const dates = ref<string[]>(currentEdition.days.map((day) => day.date))
  const startDate = ref<string>(currentEdition.startDate)
  const endDate = ref<string>(currentEdition.endDate)
  const year = ref<number>(currentEdition.year)

  return {
    dates,
    startDate,
    endDate,
    year,
  }
}
