import type { TranslatedText } from './gallery'

export type EventDay = 'thursday' | 'friday' | 'saturday' | 'sunday'

export type ActivityType =
  | 'opening'
  | 'guided-tour'
  | 'talk'
  | 'performance'
  | 'workshop'
  | 'cocktail'
  | 'special'

export interface ScheduleEvent {
  id: string
  day: EventDay
  startTime: string
  endTime: string
  type: ActivityType
  title: TranslatedText
  description: TranslatedText
  galleryId?: string
  location: TranslatedText
  address?: string
  isFree: boolean
  requiresBooking: boolean
  maxParticipants?: number
}
