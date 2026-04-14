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
