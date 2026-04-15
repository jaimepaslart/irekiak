import { and, eq, ne } from 'drizzle-orm'
import { Resend } from 'resend'
import { createError, defineEventHandler, readValidatedBody } from 'h3'
import { z } from 'zod'
import { useRuntimeConfig } from '#imports'
import { db } from '../../db'
import { bookings, timeSlots } from '../../db/schema'
import { logAudit } from '../../utils/audit'
import { withEmailRetry } from '../../utils/email-retry'
import { requireAdminToken } from '../../utils/require-admin'

const schema = z.object({
  scope: z.discriminatedUnion('type', [
    z.object({ type: z.literal('all') }),
    z.object({ type: z.literal('date'), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }),
    z.object({ type: z.literal('slot'), slotId: z.string().min(1) }),
  ]),
  subject: z.string().trim().min(3).max(200),
  body: z.string().trim().min(10).max(5000),
})

function escHtml(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildHtml(subject: string, body: string): string {
  const paragraphs = body.split(/\n\n+/).map(p => `<p style="margin:0 0 16px 0;">${escHtml(p).replace(/\n/g, '<br>')}</p>`).join('')
  return `<!doctype html>
<html><body style="margin:0;padding:0;background-color:#001E33;font-family:Inter,Arial,sans-serif;color:#ffffff;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#001E33;padding:32px 0;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#003153;border-radius:12px;padding:32px;">
      <tr><td>
        <h1 style="margin:0 0 8px 0;font-size:22px;color:#ffffff;">Irekiak Gallery Weekend</h1>
        <p style="margin:0 0 24px 0;font-size:14px;color:rgba(255,255,255,0.7);">Donostia / San Sebastián — 29-31.05.2026</p>
        <h2 style="margin:0 0 16px 0;font-size:16px;border-top:1px solid rgba(255,255,255,0.15);padding-top:16px;">${escHtml(subject)}</h2>
        <div style="font-size:15px;line-height:1.6;color:#ffffff;">${paragraphs}</div>
        <p style="margin:32px 0 0 0;font-size:12px;color:rgba(255,255,255,0.5);border-top:1px solid rgba(255,255,255,0.15);padding-top:16px;">Irekiak Gallery Weekend — DAGGE</p>
      </td></tr>
    </table>
  </td></tr>
</table></body></html>`
}

/**
 * POST /api/admin/blast — Send email to all confirmed attendees matching scope.
 */
export default defineEventHandler(async (event) => {
  requireAdminToken(event)

  const parsed = await readValidatedBody(event, (body) => {
    const r = schema.safeParse(body)
    if (!r.success) throw createError({ statusCode: 400, statusMessage: 'Invalid', data: r.error.flatten() })
    return r.data
  })

  // Collect recipients
  let recipients: Array<{ id: string, email: string }> = []
  const allConfirmed = await db
    .select({ id: bookings.id, email: bookings.email, slotId: bookings.slotId, slotDate: timeSlots.date })
    .from(bookings)
    .innerJoin(timeSlots, eq(bookings.slotId, timeSlots.id))
    .where(ne(bookings.status, 'cancelled'))
    .all()

  if (parsed.scope.type === 'all') {
    recipients = allConfirmed
  }
  else if (parsed.scope.type === 'date') {
    recipients = allConfirmed.filter(r => r.slotDate === parsed.scope.date)
  }
  else {
    recipients = allConfirmed.filter(r => r.slotId === parsed.scope.slotId)
  }

  // Dedupe by email
  const uniqEmails = [...new Set(recipients.map(r => r.email))]

  const config = useRuntimeConfig()
  if (!config.resendApiKey) {
    throw createError({ statusCode: 503, statusMessage: 'Resend not configured' })
  }
  const resend = new Resend(config.resendApiKey)
  const html = buildHtml(parsed.subject, parsed.body)

  let sent = 0
  let failed = 0
  for (const email of uniqEmails) {
    try {
      await withEmailRetry(async () => {
        const { error } = await resend.emails.send({
          from: 'Irekiak <irekiak@irekiak.eus>',
          to: email,
          subject: parsed.subject,
          html,
        })
        if (error) throw new Error(`Resend: ${error.message ?? 'unknown'}`)
      }, { channel: 'admin.blast', recipient: email })
      sent++
    }
    catch {
      failed++
    }
  }

  void logAudit({
    actor: 'admin',
    action: 'blast.send',
    targetType: 'blast',
    metadata: { scope: parsed.scope, subject: parsed.subject, recipients: uniqEmails.length, sent, failed },
  })

  return { ok: true, recipients: uniqEmails.length, sent, failed }
})
