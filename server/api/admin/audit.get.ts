import { desc } from 'drizzle-orm'
import { defineEventHandler, getQuery } from 'h3'
import { db } from '../../db'
import { auditLog } from '../../db/schema'
import { requireAdminToken } from '../../utils/require-admin'

/**
 * GET /api/admin/audit?limit=200 — Last audit log entries newest first.
 */
export default defineEventHandler(async (event) => {
  requireAdminToken(event)

  const query = getQuery(event)
  const limitRaw = Number(query.limit ?? 200)
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 && limitRaw <= 1000 ? limitRaw : 200

  const rows = await db
    .select()
    .from(auditLog)
    .orderBy(desc(auditLog.timestamp))
    .limit(limit)

  return rows.map(r => ({
    id: r.id,
    timestamp: r.timestamp,
    actor: r.actor,
    action: r.action,
    targetType: r.targetType,
    targetId: r.targetId,
    metadata: r.metadata ? JSON.parse(r.metadata) : null,
  }))
})
