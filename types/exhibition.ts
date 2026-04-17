import type { TranslatedText } from './gallery'

export interface Artist {
  name: string
  bio: TranslatedText
  website?: string
  instagram?: string
  image?: string
}

export interface Exhibition {
  id: string
  slug: string
  galleryId: string
  title: TranslatedText
  artists: Artist[]
  description: TranslatedText
  medium: TranslatedText
  images: string[]
  startDate: string
  endDate: string
}

/**
 * Flat projection used on the public homepage and in the admin editor.
 * Fields reflect what a gallerist can override via /admin/exhibitions;
 * the static Exhibition above remains the source of truth for defaults.
 */
export interface ExhibitionCard {
  id: string
  galleryId: string
  galleryName: string
  number: number
  artist: string
  title: TranslatedText
  description: TranslatedText
  imageUrl: string
  externalUrl: string | null
  startDate: string
  endDate: string
  overridden: boolean
}
