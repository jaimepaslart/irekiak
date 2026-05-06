import type { Gallery } from '#types/gallery'

export type GalleryView = Gallery & {
  imageUrl: string
  logoUrl: string | null
  overridden?: boolean
}

// Public-facing galleries with admin overrides applied. Use this in pages
// instead of importing data/galleries.ts directly — that import bypasses
// the override layer and shows stale info after a gallerist edits via /admin.
export function useGalleries() {
  return useAsyncData<GalleryView[]>(
    'galleries-list',
    () => $fetch<GalleryView[]>('/api/galleries'),
    { default: () => [] as GalleryView[] },
  )
}
