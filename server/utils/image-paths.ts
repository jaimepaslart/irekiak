// Public URL prefix for images served by the upload handler in
// server/api/images/{exhibitions,galleries}/[filename].get.ts.
// Kept in one place so a future move (e.g. to R2 / a CDN) is a single edit.
export function uploadedExhibitionImageUrl(filename: string): string {
  return `/api/images/exhibitions/${filename}`
}

export function uploadedGalleryImageUrl(filename: string): string {
  return `/api/images/galleries/${filename}`
}
