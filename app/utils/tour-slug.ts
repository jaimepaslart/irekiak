/**
 * Helpers pour convertir entre l'ID interne d'un parcours (`route-arteko-cibrian`)
 * et son slug public (`arteko-cibrian`). Utilisé partout dans l'admin pour
 * construire des URLs `/admin/parcours/:slug` et pour résoudre une route
 * depuis les données locales (`data/tours.ts`).
 *
 * Les fonctions sont auto-importées par Nuxt (dossier `app/utils/`).
 */

const ROUTE_ID_PREFIX = 'route-'

export interface RouteLike {
  id: string
  slug?: string
}

/** Extrait le slug public depuis un `routeId` (`route-arteko-cibrian` → `arteko-cibrian`). */
export function routeSlugFromId(routeId: string): string {
  return routeId.startsWith(ROUTE_ID_PREFIX) ? routeId.slice(ROUTE_ID_PREFIX.length) : routeId
}

/** Pour une route possédant (potentiellement) un champ `slug`, retourne le slug canonique. */
export function slugOfRoute(route: RouteLike): string {
  return route.slug || routeSlugFromId(route.id)
}

/** Trouve une route dans une liste à partir du slug URL. */
export function findRouteBySlug<T extends RouteLike>(routes: readonly T[], slug: string): T | null {
  return routes.find(r => slugOfRoute(r) === slug) ?? null
}
