import type { TranslatedText } from './gallery'

export interface TourRoute {
  id: string
  slug: string
  name: TranslatedText
  description: TranslatedText
  galleryIds: string[]
  duration: TranslatedText
  distance: TranslatedText
  meetingPoint: {
    name: TranslatedText
    address: string
    coordinates: { lat: number; lng: number }
  }
  color: string
}

export interface TourSlot {
  id: string
  routeId: string
  date: string
  startTime: string
  endTime: string
  maxParticipants: number
  language: 'eu' | 'es' | 'fr' | 'en'
}
