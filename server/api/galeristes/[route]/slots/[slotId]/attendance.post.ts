import { tourRoutes } from '@data/tours'
import { and, eq } from 'drizzle-orm'
import { createError, defineEventHandler, getRouterParam, readValidatedBody } from 'h3'
import { z } from 'zod'
import { db } from '../../../../../db'
import { attendance, bookings, timeSlots } from '../../../../../db/schema'
import { logAudit } from '../../../../../utils/audit'
import { requireGaleriste } from '../../../../../utils/require-galeriste'

const schema = z.object({
  bookingId: z.string().min(1),
  present: z.boolean(),
  notes: z.string().trim().max(500).optional(),
})

export default defineEventHandler(async (event) => {
  const { routeSlug } = requireGaleriste(event)
  const routeId = `route-${routeSlug}`
  const route = tourRoutes.find(r => r.id === routeId)
  if (!route) {
    throw createError({ statusCode: 404, statusMessage: 'Route not found' })
  }

  const slotId = getRouterParam(event, 'slotId')
  if (!slotId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing slotId' })
  }

  const slot = await db.select().from(timeSlots).where(eq(timeSlots.id, slotId)).get()
  if (!slot || slot.tourRouteId !== routeId) {
    throw createError({ statusCode: 404, statusMessage: 'Slot not found' })
  }

  const parsed = await readValidatedBody(event, (body) => {
    const r = schema.safeParse(body)
    if (!r.success) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid', data: r.error.flatten() })
    }
    return r.data
  })

  const booking = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, parsed.bookingId), eq(bookings.slotId, slotId)))
    .get()
  if (!booking) {
    throw createError({ statusCode: 400, statusMessage: 'Booking not found in slot' })
  }

  const actor = `galeriste:${routeSlug}`

  if (parsed.present) {
    const existing = await db
      .select()
      .from(attendance)
      .where(eq(attendance.bookingId, parsed.bookingId))
      .get()
    if (existing) {
      await db
        .update(attendance)
        .set({ notes: parsed.notes ?? null, checkedInBy: actor })
        .where(eq(attendance.bookingId, parsed.bookingId))
        .run()
    }
    else {
      await db.insert(attendance).values({
        bookingId: parsed.bookingId,
        checkedInBy: actor,
        notes: parsed.notes ?? null,
      }).run()
    }
    void logAudit({
      actor,
      action: 'attendance.check',
      targetType: 'booking',
      targetId: parsed.bookingId,
      metadata: { slotId, notes: parsed.notes },
    })
  }
  else {
    await db.delete(attendance).where(eq(attendance.bookingId, parsed.bookingId)).run()
    void logAudit({
      actor,
      action: 'attendance.uncheck',
      targetType: 'booking',
      targetId: parsed.bookingId,
      metadata: { slotId },
    })
  }

  return { ok: true as const }
})
