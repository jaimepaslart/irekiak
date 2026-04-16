import { Resend } from 'resend'
import { createError, defineEventHandler, readValidatedBody } from 'h3'
import { z } from 'zod'
import { useRuntimeConfig } from '#imports'
import { logAudit } from '../../utils/audit'
import { enforceRateLimit } from '../../utils/rate-limit'
import { requireAdminToken } from '../../utils/require-admin'

const LANGUAGES = ['eu', 'es', 'fr', 'en'] as const
const TEMPLATES = ['plain', 'confirmation', 'cancellation', 'gallery_notification'] as const

type Language = (typeof LANGUAGES)[number]
type Template = (typeof TEMPLATES)[number]

const schema = z.object({
  to: z.string().trim().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email'),
  language: z.enum(LANGUAGES),
  template: z.enum(TEMPLATES),
})

function esc(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildShellHtml(title: string, body: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background-color:#001E33;font-family:Inter,Arial,sans-serif;color:#ffffff;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#001E33;padding:32px 0;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#003153;border-radius:12px;padding:32px;">
      <tr><td>
        <p style="margin:0 0 8px 0;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#ffd86b;">TEST EMAIL</p>
        <h1 style="margin:0 0 8px 0;font-size:22px;color:#ffffff;">${esc(title)}</h1>
        <p style="margin:0 0 24px 0;font-size:14px;color:rgba(255,255,255,0.7);">Irekiak Gallery Weekend — Donostia / San Sebastián</p>
        ${body}
        <p style="margin:32px 0 0 0;font-size:12px;color:rgba(255,255,255,0.5);border-top:1px solid rgba(255,255,255,0.15);padding-top:16px;">Ceci est un email de test envoyé depuis l'admin Irekiak.</p>
      </td></tr>
    </table>
  </td></tr>
</table></body></html>`
}

function plainText(title: string, lines: string[]): string {
  return `[TEST] ${title}\n\n${lines.join('\n')}\n\n— Irekiak Gallery Weekend`
}

interface Preview {
  subject: string
  html: string
  text: string
}

function buildPreview(template: Template, language: Language): Preview {
  // Fake fixture data
  const fake = {
    firstName: 'Test',
    lastName: 'Visitor',
    email: 'test@example.com',
    phone: '+34 600 000 000',
    guests: 2,
    routeName: 'Arteko + Cibrián',
    date: '2026-05-30',
    startTime: '11:30',
    endTime: '13:00',
    galleryName: 'Galería Test',
    bookingRef: 'TEST-1234-ABCD',
    galleries: ['Arteko', 'Cibrián'],
  }

  const langLabel = language.toUpperCase()

  if (template === 'plain') {
    const subject = `[TEST] Irekiak · plain`
    const htmlBody = `
        <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;">Bonjour,</p>
        <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;">Ceci est un email de test simple (template "plain") envoyé en <strong>${esc(langLabel)}</strong>.</p>
        <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;">Il sert à vérifier que la configuration Resend fonctionne correctement (domaine, DKIM, adresse d'expédition).</p>
    `
    const text = plainText(subject, [
      'Ceci est un email de test simple (template "plain").',
      `Langue demandée : ${langLabel}`,
      'Il sert à vérifier la configuration Resend.',
    ])
    return { subject, html: buildShellHtml('Test · plain', htmlBody), text }
  }

  if (template === 'confirmation') {
    const subject = `[TEST] Irekiak · confirmation`
    const htmlBody = `
        <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;">Bonjour ${esc(fake.firstName)},</p>
        <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;">Aperçu du template <strong>confirmation</strong> de réservation (langue : ${esc(langLabel)}).</p>
        <h2 style="margin:24px 0 12px 0;font-size:16px;border-top:1px solid rgba(255,255,255,0.15);padding-top:16px;">Détails de la réservation</h2>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;">
          <tr><td style="padding:6px 0;color:rgba(255,255,255,0.7);">Parcours</td><td style="padding:6px 0;text-align:right;">${esc(fake.routeName)}</td></tr>
          <tr><td style="padding:6px 0;color:rgba(255,255,255,0.7);">Date</td><td style="padding:6px 0;text-align:right;">${esc(fake.date)}</td></tr>
          <tr><td style="padding:6px 0;color:rgba(255,255,255,0.7);">Horaire</td><td style="padding:6px 0;text-align:right;">${esc(fake.startTime)} — ${esc(fake.endTime)}</td></tr>
          <tr><td style="padding:6px 0;color:rgba(255,255,255,0.7);">Participants</td><td style="padding:6px 0;text-align:right;">${fake.guests}</td></tr>
          <tr><td style="padding:6px 0;color:rgba(255,255,255,0.7);">Référence</td><td style="padding:6px 0;text-align:right;font-family:'JetBrains Mono',monospace;font-size:12px;">${esc(fake.bookingRef)}</td></tr>
        </table>
    `
    const text = plainText(subject, [
      `Bonjour ${fake.firstName},`,
      `Aperçu confirmation (langue : ${langLabel}).`,
      `Parcours : ${fake.routeName}`,
      `Date : ${fake.date}`,
      `Horaire : ${fake.startTime} — ${fake.endTime}`,
      `Participants : ${fake.guests}`,
      `Référence : ${fake.bookingRef}`,
    ])
    return { subject, html: buildShellHtml('Test · confirmation', htmlBody), text }
  }

  if (template === 'cancellation') {
    const subject = `[TEST] Irekiak · cancellation`
    const htmlBody = `
        <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;">Bonjour ${esc(fake.firstName)},</p>
        <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;">Aperçu du template <strong>annulation</strong> (langue : ${esc(langLabel)}).</p>
        <h2 style="margin:24px 0 12px 0;font-size:16px;border-top:1px solid rgba(255,255,255,0.15);padding-top:16px;">Réservation annulée</h2>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;">
          <tr><td style="padding:6px 0;color:rgba(255,255,255,0.7);">Parcours</td><td style="padding:6px 0;text-align:right;">${esc(fake.routeName)}</td></tr>
          <tr><td style="padding:6px 0;color:rgba(255,255,255,0.7);">Date</td><td style="padding:6px 0;text-align:right;">${esc(fake.date)}</td></tr>
          <tr><td style="padding:6px 0;color:rgba(255,255,255,0.7);">Horaire</td><td style="padding:6px 0;text-align:right;">${esc(fake.startTime)} — ${esc(fake.endTime)}</td></tr>
          <tr><td style="padding:6px 0;color:rgba(255,255,255,0.7);">Référence</td><td style="padding:6px 0;text-align:right;font-family:'JetBrains Mono',monospace;font-size:12px;">${esc(fake.bookingRef)}</td></tr>
        </table>
    `
    const text = plainText(subject, [
      `Bonjour ${fake.firstName},`,
      `Aperçu annulation (langue : ${langLabel}).`,
      `Parcours : ${fake.routeName}`,
      `Date : ${fake.date} · ${fake.startTime} — ${fake.endTime}`,
      `Référence : ${fake.bookingRef}`,
    ])
    return { subject, html: buildShellHtml('Test · cancellation', htmlBody), text }
  }

  // gallery_notification
  const subject = `[TEST] Irekiak · gallery_notification`
  const htmlBody = `
        <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;">Bonjour ${esc(fake.galleryName)},</p>
        <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;">Aperçu du template <strong>notification galerie</strong> (langue : ${esc(langLabel)}).</p>
        <h2 style="margin:24px 0 12px 0;font-size:16px;border-top:1px solid rgba(255,255,255,0.15);padding-top:16px;">Détails</h2>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;">
          <tr><td style="padding:6px 0;color:rgba(255,255,255,0.7);">Parcours</td><td style="padding:6px 0;text-align:right;"><strong>${esc(fake.routeName)}</strong></td></tr>
          <tr><td style="padding:6px 0;color:rgba(255,255,255,0.7);">Galeries du parcours</td><td style="padding:6px 0;text-align:right;">${esc(fake.galleries.join(' · '))}</td></tr>
          <tr><td style="padding:6px 0;color:rgba(255,255,255,0.7);">Date</td><td style="padding:6px 0;text-align:right;">${esc(fake.date)}</td></tr>
          <tr><td style="padding:6px 0;color:rgba(255,255,255,0.7);">Horaire</td><td style="padding:6px 0;text-align:right;">${esc(fake.startTime)} — ${esc(fake.endTime)}</td></tr>
        </table>
        <h2 style="margin:24px 0 12px 0;font-size:16px;border-top:1px solid rgba(255,255,255,0.15);padding-top:16px;">Visiteur</h2>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;">
          <tr><td style="padding:6px 0;color:rgba(255,255,255,0.7);">Nom</td><td style="padding:6px 0;text-align:right;"><strong>${esc(fake.firstName)} ${esc(fake.lastName)}</strong></td></tr>
          <tr><td style="padding:6px 0;color:rgba(255,255,255,0.7);">Email</td><td style="padding:6px 0;text-align:right;">${esc(fake.email)}</td></tr>
          <tr><td style="padding:6px 0;color:rgba(255,255,255,0.7);">Téléphone</td><td style="padding:6px 0;text-align:right;">${esc(fake.phone)}</td></tr>
          <tr><td style="padding:6px 0;color:rgba(255,255,255,0.7);">Participants</td><td style="padding:6px 0;text-align:right;">${fake.guests}</td></tr>
          <tr><td style="padding:6px 0;color:rgba(255,255,255,0.7);">Référence</td><td style="padding:6px 0;text-align:right;font-family:'JetBrains Mono',monospace;font-size:11px;">${esc(fake.bookingRef)}</td></tr>
        </table>
  `
  const text = plainText(subject, [
    `Bonjour ${fake.galleryName},`,
    `Aperçu notification galerie (langue : ${langLabel}).`,
    `Parcours : ${fake.routeName} (${fake.galleries.join(' · ')})`,
    `Date : ${fake.date} · ${fake.startTime} — ${fake.endTime}`,
    `Visiteur : ${fake.firstName} ${fake.lastName} (${fake.email}, ${fake.phone})`,
    `Participants : ${fake.guests}`,
    `Référence : ${fake.bookingRef}`,
  ])
  return { subject, html: buildShellHtml('Test · gallery_notification', htmlBody), text }
}

/**
 * POST /api/admin/test-email
 * Sends a preview/test email to an arbitrary address, for verifying
 * Resend config and template rendering. Bypasses withEmailRetry so the
 * raw error from Resend surfaces back to the admin UI.
 */
export default defineEventHandler(async (event) => {
  requireAdminToken(event)
  enforceRateLimit(event, { key: 'admin.test-email', windowMs: 10 * 60 * 1000, max: 10 })

  const parsed = await readValidatedBody(event, (body) => {
    const r = schema.safeParse(body)
    if (!r.success) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid body', data: r.error.flatten() })
    }
    return r.data
  })

  const config = useRuntimeConfig()
  if (!config.resendApiKey) {
    throw createError({ statusCode: 503, statusMessage: 'Resend not configured' })
  }

  const { subject, html, text } = buildPreview(parsed.template, parsed.language)
  const resend = new Resend(config.resendApiKey)

  let id = ''
  try {
    const { data, error } = await resend.emails.send({
      from: config.fromEmail,
      to: parsed.to,
      subject,
      html,
      text,
      tags: [
        { name: 'environment', value: 'test' },
        { name: 'template', value: parsed.template },
      ],
    })
    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: `Resend error: ${error.message ?? 'unknown'}`,
        data: { name: error.name, message: error.message },
      })
    }
    id = data?.id ?? ''
  }
  catch (err: unknown) {
    // Re-throw if already an h3 error; otherwise wrap
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    const message = err instanceof Error ? err.message : 'Unknown error'
    throw createError({ statusCode: 500, statusMessage: `Test email send failed: ${message}` })
  }

  void logAudit({
    actor: 'admin',
    action: 'email.test',
    targetType: 'email',
    targetId: parsed.to,
    metadata: { template: parsed.template, language: parsed.language, resendId: id },
  })

  return { id, success: true as const }
})
