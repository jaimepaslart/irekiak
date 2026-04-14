import { eq } from 'drizzle-orm'
import { createError, defineEventHandler, getRouterParam, setHeader } from 'h3'
import { db } from '../../../db'
import { bookings, timeSlots, tourRoutes } from '../../../db/schema'

/**
 * GET /api/bookings/:token/ics
 *
 * Returns a downloadable .ics calendar invite for the confirmed booking.
 * Placeholder implementation that emits a minimal, valid VCALENDAR payload.
 */

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

/** Format an ISO date + HH:MM time as UTC iCal date-time (basic, no TZ adjust). */
function formatIcsDateTime(date: string, time: string): string {
  // Treat as local Europe/Madrid wall time but emit as floating UTC for simplicity.
  // A future revision should use VTIMEZONE. For now we output a Z timestamp.
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  const dt = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0))
  return `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}00Z`
}

function escapeIcsText(input: string): string {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Missing token' })
  }

  const row = await db
    .select({
      booking: bookings,
      slot: timeSlots,
      route: tourRoutes,
    })
    .from(bookings)
    .innerJoin(timeSlots, eq(bookings.slotId, timeSlots.id))
    .innerJoin(tourRoutes, eq(timeSlots.tourRouteId, tourRoutes.id))
    .where(eq(bookings.confirmToken, token))
    .get()

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Booking not found' })
  }

  const dtStart = formatIcsDateTime(row.slot.date, row.slot.startTime)
  const dtEnd = formatIcsDateTime(row.slot.date, row.slot.endTime)
  const dtStamp = formatIcsDateTime(
    new Date().toISOString().slice(0, 10),
    new Date().toISOString().slice(11, 16),
  )

  const summary = escapeIcsText(`Irekiak - ${row.route.nameEu}`)
  const description = escapeIcsText(
    `Gallery Weekend Donostia - Guided tour\\nRoute: ${row.route.nameEu}\\nConfirmation: ${row.booking.confirmToken}`,
  )
  const location = escapeIcsText('Donostia / San Sebastián')

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Irekiak//Gallery Weekend//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${row.booking.id}@irekiak.eus`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  setHeader(event, 'Content-Type', 'text/calendar; charset=utf-8')
  setHeader(
    event,
    'Content-Disposition',
    `attachment; filename="irekiak-${row.booking.id}.ics"`,
  )
  return ics
})
