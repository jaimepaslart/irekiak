import { createError, defineEventHandler, readValidatedBody } from 'h3'
import { z } from 'zod'
import { logAudit } from '../../utils/audit'
import { setSetting } from '../../utils/admin-settings'
import { requireAdminToken } from '../../utils/require-admin'

const schema = z.object({
  key: z.enum(['bookings.accept', 'emergency.message', 'notifications.enabled']),
  value: z.string().max(2000),
})

export default defineEventHandler(async (event) => {
  requireAdminToken(event)

  const parsed = await readValidatedBody(event, (body) => {
    const r = schema.safeParse(body)
    if (!r.success) throw createError({ statusCode: 400, statusMessage: 'Invalid', data: r.error.flatten() })
    return r.data
  })

  setSetting(parsed.key, parsed.value, 'admin')

  void logAudit({
    actor: 'admin',
    action: 'settings.update',
    targetType: 'setting',
    targetId: parsed.key,
    metadata: { value: parsed.value },
  })

  return { ok: true }
})
