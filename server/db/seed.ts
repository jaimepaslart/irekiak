/**
 * Seed the SQLite database with tour routes and time slots from data/tours.ts.
 *
 * Idempotent: running multiple times is safe thanks to onConflictDoNothing().
 *
 * Usage: pnpm db:seed
 */
import { db } from './index'
import { timeSlots, tourRoutes } from './schema'

function parseDurationToMinutes(raw: string): number {
  // Handles "1h 30min", "1h", "45min", "1 h 30 min" and similar shapes.
  const normalized = raw.toLowerCase().replace(/\s+/g, '')
  const hMatch = normalized.match(/(\d+)h/)
  const mMatch = normalized.match(/(\d+)min/)
  const hours = hMatch ? Number.parseInt(hMatch[1]!, 10) : 0
  const minutes = mMatch ? Number.parseInt(mMatch[1]!, 10) : 0
  if (hours === 0 && minutes === 0) {
    // Fallback: try a trailing number as hours.
    const numeric = normalized.match(/(\d+)/)
    if (numeric) return Number.parseInt(numeric[1]!, 10) * 60
  }
  return hours * 60 + minutes
}

function parseDistanceToMeters(raw: string): number {
  const normalized = raw.toLowerCase().replace(',', '.')
  const kmMatch = normalized.match(/([\d.]+)\s*km/)
  if (kmMatch) return Math.round(Number.parseFloat(kmMatch[1]!) * 1000)
  const mMatch = normalized.match(/([\d.]+)\s*m/)
  if (mMatch) return Math.round(Number.parseFloat(mMatch[1]!))
  return 0
}

interface SeedRoute {
  id: string
  slug: string
  name: { eu: string, es: string, fr: string, en: string }
  duration: { eu: string, es: string, fr: string, en: string }
  distance: { eu: string, es: string, fr: string, en: string }
  color: string
}

interface SeedSlot {
  id: string
  routeId: string
  date: string
  startTime: string
  endTime: string
  maxParticipants: number
  language: 'eu' | 'es' | 'fr' | 'en'
}

async function seed() {
  // Dynamic import with a computed specifier so tsc does not traverse
  // `data/tours.ts` (which uses the Nuxt `~/types/tour` alias not present in
  // the server tsconfig). Types are declared locally above.
  const specifier = ['..', '..', 'data', 'tours'].join('/')
  const toursModule = (await import(/* @vite-ignore */ specifier)) as {
    tourRoutes: SeedRoute[]
    tourSlots: SeedSlot[]
  }
  const { tourRoutes: routes, tourSlots: slots } = toursModule

  console.log(`Seeding ${routes.length} tour routes and ${slots.length} time slots...`)

  for (const route of routes) {
    await db
      .insert(tourRoutes)
      .values({
        id: route.id,
        slug: route.slug,
        nameEu: route.name.eu,
        nameEs: route.name.es,
        nameFr: route.name.fr,
        nameEn: route.name.en,
        color: route.color,
        durationMinutes: parseDurationToMinutes(route.duration.en),
        distanceMeters: parseDistanceToMeters(route.distance.en),
      })
      .onConflictDoNothing()
  }

  for (const slot of slots) {
    await db
      .insert(timeSlots)
      .values({
        id: slot.id,
        tourRouteId: slot.routeId,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        language: slot.language,
        maxParticipants: slot.maxParticipants,
      })
      .onConflictDoNothing()
  }

  console.log('Seed completed.')
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
