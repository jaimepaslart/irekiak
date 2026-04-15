import { desc, sql } from 'drizzle-orm'
import { defineEventHandler, getQuery } from 'h3'
import { db } from '../../db'
import { auditLog } from '../../db/schema'
import { requireAdminToken } from '../../utils/require-admin'

/**
 * GET /api/admin/audit?limit=50&offset=0 — Paginated audit log, newest first.
 */
export default defineEventHandler(async (event) => {
  requireAdminToken(event)

  const query = getQuery(event)
  const limitRaw = Number(query.limit ?? 50)
  const offsetRaw = Number(query.offset ?? 0)
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 && limitRaw <= 500 ? limitRaw : 50
  const offset = Number.isFinite(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0

  const [rows, countRow] = await Promise.all([
    db.select()
      .from(auditLog)
      .orderBy(desc(auditLog.timestamp))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(auditLog).get(),
  ])

  return {
    entries: rows.map(r => ({
      id: r.id,
      timestamp: r.timestamp,
      actor: r.actor,
      action: r.action,
      targetType: r.targetType,
      targetId: r.targetId,
      metadata: r.metadata ? JSON.parse(r.metadata) : null,
    })),
    total: countRow?.count ?? 0,
    limit,
    offset,
  }
})
