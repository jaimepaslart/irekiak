import { eq } from 'drizzle-orm'
import { createError, defineEventHandler, getRouterParam, setHeader } from 'h3'
import { db } from '../../../db'
import { bookings, timeSlots, tourRoutes } from '../../../db/schema'
import { logAudit } from '../../../utils/audit'

/**
 * GET /api/bookings/:token/data — GDPR Article 20 portability export.
 * Returns all personal data we hold about this booking as a JSON file.
 */
export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Missing token' })
  }

  const row = await db
    .select({ booking: bookings, slot: timeSlots, route: tourRoutes })
    .from(bookings)
    .innerJoin(timeSlots, eq(bookings.slotId, timeSlots.id))
    .innerJoin(tourRoutes, eq(timeSlots.tourRouteId, tourRoutes.id))
    .where(eq(bookings.confirmToken, token))
    .get()

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Booking not found' })
  }

  void logAudit({
    actor: 'visitor',
    action: 'booking.data.export',
    targetType: 'booking',
    targetId: row.booking.id,
    metadata: { email: row.booking.email },
  })

  setHeader(event, 'Content-Disposition', `attachment; filename="irekiak-booking-${row.booking.id}.json"`)
  setHeader(event, 'Content-Type', 'application/json; charset=utf-8')

  return {
    exportedAt: new Date().toISOString(),
    exportType: 'GDPR Article 20 - data portability',
    booking: {
      id: row.booking.id,
      createdAt: row.booking.createdAt,
      status: row.booking.status,
      firstName: row.booking.firstName,
      lastName: row.booking.lastName,
      email: row.booking.email,
      phone: row.booking.phone,
      numberOfPeople: row.booking.numberOfPeople,
      language: row.booking.language,
      specialNeeds: row.booking.specialNeeds,
      acceptsMarketing: row.booking.acceptsMarketing,
    },
    slot: {
      date: row.slot.date,
      startTime: row.slot.startTime,
      endTime: row.slot.endTime,
      language: row.slot.language,
      maxParticipants: row.slot.maxParticipants,
    },
    route: {
      id: row.route.id,
      nameEu: row.route.nameEu,
      nameEs: row.route.nameEs,
      nameFr: row.route.nameFr,
      nameEn: row.route.nameEn,
      durationMinutes: row.route.durationMinutes,
      distanceMeters: row.route.distanceMeters,
    },
    notes: {
      retentionPolicy: '90 days after event (2026-05-31)',
      controller: 'DAGGE + Tabakalera — irekiak@irekiak.eus',
      rights: 'Access, rectification, erasure, objection, withdrawal of consent. See /privacy.',
    },
  }
})
