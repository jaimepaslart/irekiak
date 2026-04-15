import { randomUUID } from 'node:crypto'
import { db } from '../db'
import { auditLog } from '../db/schema'

export interface AuditEntry {
  actor: string
  action: string
  targetType?: string
  targetId?: string
  metadata?: Record<string, unknown>
}

/**
 * Insert an audit log entry. Never throws: failures are logged but don't break
 * the calling handler (audit is non-critical, the action itself already succeeded).
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLog).values({
      id: randomUUID(),
      actor: entry.actor,
      action: entry.action,
      targetType: entry.targetType ?? null,
      targetId: entry.targetId ?? null,
      metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
    }).run()
  }
  catch (err) {
    console.error('[audit] insert failed:', err)
  }
}
