import { desc, sql } from 'drizzle-orm'
import { defineEventHandler, getQuery } from 'h3'
import { db } from '../../db'
import { emailEvents } from '../../db/schema'
import { requireAdminToken } from '../../utils/require-admin'

export default defineEventHandler(async (event) => {
  requireAdminToken(event)

  const query = getQuery(event)
  const limitRaw = Number(query.limit ?? 100)
  const offsetRaw = Number(query.offset ?? 0)
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 && limitRaw <= 500 ? limitRaw : 100
  const offset = Number.isFinite(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0

  const [rows, countRow] = await Promise.all([
    db.select().from(emailEvents).orderBy(desc(emailEvents.timestamp)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(emailEvents).get(),
  ])

  return {
    entries: rows.map(r => ({
      id: r.id,
      timestamp: r.timestamp,
      bookingId: r.bookingId,
      channel: r.channel,
      recipient: r.recipient,
      eventType: r.eventType,
    })),
    total: countRow?.count ?? 0,
    limit,
    offset,
  }
})
