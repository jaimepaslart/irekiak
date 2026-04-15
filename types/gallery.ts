export type { TranslatedText, SupportedLocale } from './common'
import type { TranslatedText } from './common'

export interface GalleryContact {
  email: string
  name?: string
  phone?: string
  preferredLanguage: 'eu' | 'es' | 'fr' | 'en'
  notifyOnBooking: boolean
  receiveDailyDigest: boolean
}

export interface Gallery {
  id: string
  slug: string
  name: string
  address: string
  city: string
  coordinates: { lat: number; lng: number }
  description: TranslatedText
  website?: string
  instagram?: string
  email?: string
  phone?: string
  openingHours: TranslatedText
  image: string
  logo?: string
  contact?: GalleryContact
}
