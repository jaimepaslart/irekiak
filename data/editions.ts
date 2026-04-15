import type { TranslatedText } from '#types/common'

export interface EditionDay {
  id: 'friday' | 'saturday' | 'sunday'
  date: string
  dateShort: string
  label: TranslatedText
  hours: string
  note?: TranslatedText
}

export interface Edition {
  year: number
  startDate: string
  endDate: string
  city: string
  country: string
  dateRangeLabel: string
  dateRangeLabelShort: string
  days: EditionDay[]
}

export const currentEdition: Edition = {
  year: 2026,
  startDate: '2026-05-29',
  endDate: '2026-05-31',
  city: 'Donostia / San Sebastián',
  country: 'Euskal Herria',
  dateRangeLabel: '29.05 > 31.05.2026',
  dateRangeLabelShort: '29 > 31 Mai 2026',
  days: [
    {
      id: 'friday',
      date: '2026-05-29',
      dateShort: '29.05',
      label: { eu: 'Ostiral', es: 'Viernes', fr: 'Vendredi', en: 'Friday' },
      hours: '17:30-21:00',
      note: { eu: 'Inaugurazioa', es: 'Inauguración', fr: 'Inauguration', en: 'Opening' },
    },
    {
      id: 'saturday',
      date: '2026-05-30',
      dateShort: '30.05',
      label: { eu: 'Larunbat', es: 'Sábado', fr: 'Samedi', en: 'Saturday' },
      hours: '11:00-19:00',
    },
    {
      id: 'sunday',
      date: '2026-05-31',
      dateShort: '31.05',
      label: { eu: 'Igande', es: 'Domingo', fr: 'Dimanche', en: 'Sunday' },
      hours: '11:00-14:00',
    },
  ],
}
