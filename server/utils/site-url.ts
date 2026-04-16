import { useRuntimeConfig } from '#imports'

/**
 * Retourne la base URL du site (sans trailing slash) depuis `runtimeConfig.public.siteUrl`.
 * Utilisé par les templates email et la génération de liens absolus (QR, booking confirm, parcours admin).
 *
 * Centralise le fallback par défaut et le trim du slash pour éviter la duplication
 * (4+ occurrences avant refactor dans `email.ts`, `email-gallery.ts`, `qr.get.ts`).
 */
export function getSiteUrl(): string {
  const config = useRuntimeConfig()
  const raw = (config.public?.siteUrl as string | undefined) ?? 'https://irekiak.eus'
  return raw.replace(/\/$/, '')
}

/** Raccourci : construit une URL absolue en joignant un chemin relatif à la base du site. */
export function absoluteUrl(path: string): string {
  const base = getSiteUrl()
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalized}`
}
