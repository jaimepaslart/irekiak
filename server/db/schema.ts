import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const tourRoutes = sqliteTable('tour_routes', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull(),
  nameEu: text('name_eu').notNull(),
  nameEs: text('name_es').notNull(),
  nameFr: text('name_fr').notNull(),
  nameEn: text('name_en').notNull(),
  color: text('color').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  distanceMeters: integer('distance_meters').notNull(),
})

export const timeSlots = sqliteTable('time_slots', {
  id: text('id').primaryKey(),
  tourRouteId: text('tour_route_id')
    .notNull()
    .references(() => tourRoutes.id),
  date: text('date').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  language: text('language').notNull(),
  maxParticipants: integer('max_participants').notNull(),
  bookedCount: integer('booked_count').notNull().default(0),
  version: integer('version').notNull().default(1),
})

export const bookings = sqliteTable('bookings', {
  id: text('id').primaryKey(),
  slotId: text('slot_id')
    .notNull()
    .references(() => timeSlots.id),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  numberOfPeople: integer('number_of_people').notNull(),
  language: text('language').notNull(),
  specialNeeds: text('special_needs'),
  status: text('status', { enum: ['confirmed', 'cancelled', 'waitlist'] }).notNull(),
  confirmToken: text('confirm_token').notNull().unique(),
  acceptsMarketing: integer('accepts_marketing', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const auditLog = sqliteTable('audit_log', {
  id: text('id').primaryKey(),
  timestamp: text('timestamp').notNull().default(sql`(datetime('now'))`),
  actor: text('actor').notNull(),
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: text('target_id'),
  metadata: text('metadata'),
})

export type TourRouteRow = typeof tourRoutes.$inferSelect
export type TimeSlotRow = typeof timeSlots.$inferSelect
export type BookingRow = typeof bookings.$inferSelect
export type AuditLogRow = typeof auditLog.$inferSelect
