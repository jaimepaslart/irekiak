import { randomUUID } from 'node:crypto'
import { createError, defineEventHandler, getHeader, readRawBody } from 'h3'
import { Webhook } from 'svix'
import { useRuntimeConfig } from '#imports'
import { db } from '../../db'
import { emailEvents } from '../../db/schema'
import { logAudit } from '../../utils/audit'

/**
 * POST /api/webhooks/resend — Receives delivery events from Resend.
 * Signature verified via Svix (RESEND_WEBHOOK_SECRET).
 *
 * Event types: email.sent, email.delivered, email.bounced, email.complained,
 *              email.delivery_delayed, email.opened, email.clicked.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const secret = (config as unknown as { resendWebhookSecret?: string }).resendWebhookSecret
  if (!secret) {
    throw createError({ statusCode: 503, statusMessage: 'Webhook not configured' })
  }

  const svixId = getHeader(event, 'svix-id')
  const svixTimestamp = getHeader(event, 'svix-timestamp')
  const svixSignature = getHeader(event, 'svix-signature')
  if (!svixId || !svixTimestamp || !svixSignature) {
    throw createError({ statusCode: 400, statusMessage: 'Missing Svix headers' })
  }

  const payload = await readRawBody(event)
  if (!payload) {
    throw createError({ statusCode: 400, statusMessage: 'Empty payload' })
  }

  let verified: Record<string, unknown>
  try {
    const wh = new Webhook(secret)
    verified = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as Record<string, unknown>
  }
  catch {
    throw createError({ statusCode: 401, statusMessage: 'Invalid signature' })
  }

  const type = String(verified.type ?? 'unknown')
  const data = (verified.data ?? {}) as Record<string, unknown>
  const resendId = String(data.email_id ?? data.id ?? '')
  const recipient = Array.isArray(data.to) ? String(data.to[0]) : String(data.to ?? '')
  const tags = data.tags as Array<{ name: string, value: string }> | undefined
  const bookingIdTag = tags?.find(t => t.name === 'booking_id')?.value ?? null
  const channelTag = tags?.find(t => t.name === 'channel')?.value ?? null

  try {
    await db.insert(emailEvents).values({
      id: randomUUID(),
      bookingId: bookingIdTag,
      resendId: resendId || null,
      channel: channelTag ?? 'unknown',
      recipient,
      eventType: type,
      metadata: JSON.stringify(verified),
    }).run()
  }
  catch (err) {
    console.error('[webhook:resend] insert failed:', err)
  }

  // Log bounces/complaints prominently
  if (type === 'email.bounced' || type === 'email.complained') {
    void logAudit({
      actor: 'system',
      action: `email.${type.replace('email.', '')}`,
      targetType: 'email',
      targetId: resendId,
      metadata: { recipient, bookingId: bookingIdTag, channel: channelTag },
    })
  }

  return { ok: true }
})
