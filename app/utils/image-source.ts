// Uploaded images are served from /api/images/* by Nitro and already
// resized / webp-encoded. NuxtImg routes through /_ipx/ which resolves
// under public/ on disk and 404s on Nitro-served paths, so we render
// these via a plain <img> instead.
export function isUploadedImage(url: string | null | undefined): boolean {
  return Boolean(url?.startsWith('/api/'))
}
