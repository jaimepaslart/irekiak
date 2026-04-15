import { existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import { tourRoutes, tourSlots } from '../../data/tours'

const DB_PATH = process.env.DATABASE_PATH || '.data/irekiak.db'

const dir = dirname(DB_PATH)
if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

const sqlite = new Database(DB_PATH)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

// Auto-init schema on first run (idempotent - uses IF NOT EXISTS)
// This avoids needing `drizzle-kit push` access on locked-down hosts
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS tour_routes (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name_eu TEXT NOT NULL,
    name_es TEXT NOT NULL,
    name_fr TEXT NOT NULL,
    name_en TEXT NOT NULL,
    color TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    distance_meters INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS time_slots (
    id TEXT PRIMARY KEY,
    tour_route_id TEXT NOT NULL REFERENCES tour_routes(id),
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    language TEXT NOT NULL,
    max_participants INTEGER NOT NULL DEFAULT 12,
    booked_count INTEGER NOT NULL DEFAULT 0,
    version INTEGER NOT NULL DEFAULT 1
  );
  CREATE INDEX IF NOT EXISTS idx_time_slots_route ON time_slots(tour_route_id);
  CREATE INDEX IF NOT EXISTS idx_time_slots_date ON time_slots(date);

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    slot_id TEXT NOT NULL REFERENCES time_slots(id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    number_of_people INTEGER NOT NULL,
    language TEXT NOT NULL,
    special_needs TEXT,
    status TEXT NOT NULL DEFAULT 'confirmed',
    confirm_token TEXT NOT NULL UNIQUE,
    accepts_marketing INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_bookings_slot ON bookings(slot_id);
  CREATE INDEX IF NOT EXISTS idx_bookings_token ON bookings(confirm_token);

  CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    metadata TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
  CREATE INDEX IF NOT EXISTS idx_audit_log_target ON audit_log(target_type, target_id);

  CREATE TABLE IF NOT EXISTS attendance (
    booking_id TEXT PRIMARY KEY REFERENCES bookings(id),
    checked_in_at TEXT NOT NULL DEFAULT (datetime('now')),
    checked_in_by TEXT NOT NULL,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_by TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS gallery_contact_overrides (
    gallery_id TEXT PRIMARY KEY,
    email TEXT,
    name TEXT,
    phone TEXT,
    preferred_language TEXT,
    notify_on_booking INTEGER,
    receive_daily_digest INTEGER,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_by TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS email_events (
    id TEXT PRIMARY KEY,
    booking_id TEXT,
    resend_id TEXT,
    channel TEXT NOT NULL,
    recipient TEXT NOT NULL,
    event_type TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    metadata TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_email_events_booking ON email_events(booking_id);
  CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(event_type);
`)

// Idempotent additive migrations (SQLite: ALTER TABLE ADD COLUMN only runs
// if the column doesn't already exist — we catch the "duplicate column" error).
function safeAddColumn(table: string, columnDef: string): void {
  try {
    sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`)
  }
  catch (err) {
    const msg = (err as Error).message ?? ''
    if (!msg.includes('duplicate column')) {
      console.warn(`[db] migration ALTER ${table} failed:`, msg)
    }
  }
}
safeAddColumn('bookings', 'accepts_marketing INTEGER NOT NULL DEFAULT 0')

// Auto-seed if tables are empty (idempotent)
try {
  const routeCount = sqlite.prepare('SELECT COUNT(*) as n FROM tour_routes').get() as { n: number }
  if (routeCount.n === 0) {
    const parseMinutes = (s: string): number => {
      const m = s.match(/(\d+)\s*h/i)
      const mm = s.match(/(\d+)\s*min/i)
      return (m ? parseInt(m[1]) * 60 : 0) + (mm ? parseInt(mm[1]) : 0)
    }
    const parseMeters = (s: string): number => {
      const km = s.match(/([\d.]+)\s*km/i)
      return km ? Math.round(parseFloat(km[1]) * 1000) : 0
    }

    const insertRoute = sqlite.prepare(`
      INSERT OR IGNORE INTO tour_routes
      (id, slug, name_eu, name_es, name_fr, name_en, color, duration_minutes, distance_meters)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const insertSlot = sqlite.prepare(`
      INSERT OR IGNORE INTO time_slots
      (id, tour_route_id, date, start_time, end_time, language, max_participants)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    sqlite.transaction(() => {
      for (const r of tourRoutes) {
        insertRoute.run(
          r.id, r.slug,
          r.name.eu, r.name.es, r.name.fr, r.name.en,
          r.color,
          parseMinutes(r.duration.eu || ''),
          parseMeters(r.distance.eu || ''),
        )
      }
      for (const s of tourSlots) {
        insertSlot.run(
          s.id, s.routeId, s.date, s.startTime, s.endTime,
          s.language, s.maxParticipants,
        )
      }
    })()
    console.log('[db] Auto-seeded', tourRoutes.length, 'routes,', tourSlots.length, 'slots')
  }
}
catch (err) {
  console.warn('[db] Auto-seed skipped:', (err as Error).message)
}

export const db = drizzle(sqlite, { schema })
export { schema }
export { sqlite }
