import { and, eq } from 'drizzle-orm'
import { createError, defineEventHandler, getRouterParam, readValidatedBody } from 'h3'
import { z } from 'zod'
import { db, sqlite } from '../../../../db'
import { bookings, timeSlots } from '../../../../db/schema'
import { logAudit } from '../../../../utils/audit'
import { requireAdminToken } from '../../../../utils/require-admin'

const editSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  email: z.string().trim().toLowerCase().email().max(255).optional(),
  phone: z.string().trim().max(50).nullable().optional(),
  specialNeeds: z.string().trim().max(1000).nullable().optional(),
  numberOfPeople: z.number().int().min(1).max(4).optional(),
})

/**
 * PATCH /api/admin/bookings/:id/edit — Update mutable fields.
 * If numberOfPeople changes, atomically adjusts slot.bookedCount with capacity check.
 */
export default defineEventHandler(async (event) => {
  requireAdminToken(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const parsed = await readValidatedBody(event, (body) => {
    const r = editSchema.safeParse(body)
    if (!r.success) throw createError({ statusCode: 400, statusMessage: 'Invalid', data: r.error.flatten() })
    return r.data
  })

  const current = await db.select().from(bookings).where(eq(bookings.id, id)).get()
  if (!current) throw createError({ statusCode: 404, statusMessage: 'Booking not found' })

  const diff: Record<string, { from: unknown, to: unknown }> = {}

  // Handle numberOfPeople change with capacity check
  if (parsed.numberOfPeople !== undefined && parsed.numberOfPeople !== current.numberOfPeople) {
    const delta = parsed.numberOfPeople - current.numberOfPeople
    const tx = sqlite.transaction(() => {
      const slot = db.select().from(timeSlots).where(eq(timeSlots.id, current.slotId)).get()
      if (!slot) throw createError({ statusCode: 500, statusMessage: 'Slot not found' })
      const newBookedCount = slot.bookedCount + delta
      if (newBookedCount > slot.maxParticipants) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Slot would exceed capacity',
          data: { remaining: slot.maxParticipants - slot.bookedCount },
        })
      }
      const updated = db.update(timeSlots)
        .set({ bookedCount: newBookedCount, version: slot.version + 1 })
        .where(and(eq(timeSlots.id, slot.id), eq(timeSlots.version, slot.version)))
        .run()
      if (updated.changes === 0) {
        throw createError({ statusCode: 409, statusMessage: 'Slot was modified concurrently' })
      }
    })
    tx()
    diff.numberOfPeople = { from: current.numberOfPeople, to: parsed.numberOfPeople }
  }

  // Build update set
  const toUpdate: Partial<typeof bookings.$inferInsert> = {}
  for (const field of ['firstName', 'lastName', 'email', 'phone', 'specialNeeds', 'numberOfPeople'] as const) {
    const value = parsed[field]
    if (value !== undefined && value !== (current as Record<string, unknown>)[field]) {
      ;(toUpdate as Record<string, unknown>)[field] = value
      if (field !== 'numberOfPeople') {
        diff[field] = { from: (current as Record<string, unknown>)[field], to: value }
      }
    }
  }

  if (Object.keys(toUpdate).length > 0) {
    await db.update(bookings).set(toUpdate).where(eq(bookings.id, id)).run()
  }

  void logAudit({
    actor: 'admin',
    action: 'booking.edit',
    targetType: 'booking',
    targetId: id,
    metadata: { diff },
  })

  const updated = await db.select().from(bookings).where(eq(bookings.id, id)).get()
  return { ok: true, booking: updated, diff }
})
