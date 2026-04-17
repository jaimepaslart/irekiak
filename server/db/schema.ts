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

export const attendance = sqliteTable('attendance', {
  bookingId: text('booking_id').primaryKey().references(() => bookings.id),
  checkedInAt: text('checked_in_at').notNull().default(sql`(datetime('now'))`),
  checkedInBy: text('checked_in_by').notNull(),
  notes: text('notes'),
})

export const appSettings = sqliteTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
  updatedBy: text('updated_by').notNull(),
})

export const galleryContactOverrides = sqliteTable('gallery_contact_overrides', {
  galleryId: text('gallery_id').primaryKey(),
  email: text('email'),
  name: text('name'),
  phone: text('phone'),
  preferredLanguage: text('preferred_language'),
  notifyOnBooking: integer('notify_on_booking', { mode: 'boolean' }),
  receiveDailyDigest: integer('receive_daily_digest', { mode: 'boolean' }),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
  updatedBy: text('updated_by').notNull(),
})

export const exhibitionOverrides = sqliteTable('exhibition_overrides', {
  exhibitionId: text('exhibition_id').primaryKey(),
  artistName: text('artist_name'),
  titleEu: text('title_eu'),
  titleEs: text('title_es'),
  titleFr: text('title_fr'),
  titleEn: text('title_en'),
  descriptionEu: text('description_eu'),
  descriptionEs: text('description_es'),
  descriptionFr: text('description_fr'),
  descriptionEn: text('description_en'),
  externalUrl: text('external_url'),
  imageFilename: text('image_filename'),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
  updatedBy: text('updated_by').notNull(),
})

export const emailEvents = sqliteTable('email_events', {
  id: text('id').primaryKey(),
  bookingId: text('booking_id'),
  resendId: text('resend_id'),
  channel: text('channel').notNull(),
  recipient: text('recipient').notNull(),
  eventType: text('event_type').notNull(),
  timestamp: text('timestamp').notNull().default(sql`(datetime('now'))`),
  metadata: text('metadata'),
})

export type TourRouteRow = typeof tourRoutes.$inferSelect
export type TimeSlotRow = typeof timeSlots.$inferSelect
export type BookingRow = typeof bookings.$inferSelect
export type AuditLogRow = typeof auditLog.$inferSelect
export type AttendanceRow = typeof attendance.$inferSelect
export type AppSettingRow = typeof appSettings.$inferSelect
export type GalleryContactOverrideRow = typeof galleryContactOverrides.$inferSelect
export type ExhibitionOverrideRow = typeof exhibitionOverrides.$inferSelect
export type EmailEventRow = typeof emailEvents.$inferSelect
