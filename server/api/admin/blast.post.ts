import { eq, ne } from 'drizzle-orm'
import { Resend } from 'resend'
import { createError, defineEventHandler, readValidatedBody } from 'h3'
import { z } from 'zod'
import { useRuntimeConfig } from '#imports'
import { db } from '../../db'
import { bookings, timeSlots } from '../../db/schema'
import { logAudit } from '../../utils/audit'
import { withEmailRetry } from '../../utils/email-retry'
import { requireAdminToken } from '../../utils/require-admin'

type Lang = 'eu' | 'es' | 'fr' | 'en'

const localizedString = z.object({
  eu: z.string().trim().max(5000).optional(),
  es: z.string().trim().max(5000).optional(),
  fr: z.string().trim().min(1).max(5000),
  en: z.string().trim().max(5000).optional(),
})

const schema = z.object({
  scope: z.discriminatedUnion('type', [
    z.object({ type: z.literal('all') }),
    z.object({ type: z.literal('date'), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }),
    z.object({ type: z.literal('slot'), slotId: z.string().min(1) }),
  ]),
  subject: localizedString,
  message: localizedString,
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

function pickLocalized(dict: { eu?: string, es?: string, fr: string, en?: string }, lang: Lang): string {
  const v = dict[lang]
  if (v && v.trim().length > 0) return v
  return dict.fr
}

function normalizeLang(raw: string): Lang {
  const v = raw.toLowerCase()
  if (v === 'eu' || v === 'es' || v === 'fr' || v === 'en') return v
  return 'fr'
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

  let recipients: Array<{ id: string, email: string, language: string, slotId: string, slotDate: string }> = []
  const allConfirmed = await db
    .select({ id: bookings.id, email: bookings.email, language: bookings.language, slotId: bookings.slotId, slotDate: timeSlots.date })
    .from(bookings)
    .innerJoin(timeSlots, eq(bookings.slotId, timeSlots.id))
    .where(ne(bookings.status, 'cancelled'))
    .all()

  const scope = parsed.scope
  if (scope.type === 'all') {
    recipients = allConfirmed
  }
  else if (scope.type === 'date') {
    recipients = allConfirmed.filter(r => r.slotDate === scope.date)
  }
  else {
    recipients = allConfirmed.filter(r => r.slotId === scope.slotId)
  }

  const byEmail = new Map<string, Lang>()
  for (const r of recipients) {
    if (!byEmail.has(r.email)) byEmail.set(r.email, normalizeLang(r.language))
  }

  const config = useRuntimeConfig()
  if (!config.resendApiKey) {
    throw createError({ statusCode: 503, statusMessage: 'Resend not configured' })
  }
  const resend = new Resend(config.resendApiKey)

  let sent = 0
  let failed = 0
  for (const [email, lang] of byEmail) {
    const subject = pickLocalized(parsed.subject, lang)
    const body = pickLocalized(parsed.message, lang)
    const html = buildHtml(subject, body)
    try {
      await withEmailRetry(async () => {
        const { error } = await resend.emails.send({
          from: config.fromEmail,
          to: email,
          subject,
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
    metadata: {
      scope,
      subjectFr: parsed.subject.fr,
      languages: (['eu', 'es', 'fr', 'en'] as const).filter(k => parsed.subject[k]),
      recipients: byEmail.size,
      sent,
      failed,
    },
  })

  return { ok: true, recipients: byEmail.size, sent, failed }
})
