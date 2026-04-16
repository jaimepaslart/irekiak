import { Resend } from 'resend'
import { createError, defineEventHandler, readValidatedBody } from 'h3'
import { z } from 'zod'
import { useRuntimeConfig } from '#imports'
import { logAudit } from '../../../utils/audit'
import { ALLOWED_ROUTE_SLUGS, signRouteToken } from '../../../utils/galeriste-token'
import { requireAdminToken } from '../../../utils/require-admin'
import { cta, footer, header, hero, paragraph, shell } from '../../../utils/email-templates'

const schema = z.object({
  routeSlug: z.enum(ALLOWED_ROUTE_SLUGS),
  to: z.string().trim().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email'),
})

function buildMagicLinkEmail(routeSlug: string, magicUrl: string): { subject: string, html: string, text: string } {
  const subject = 'Irekiak · Votre accès galeriste'
  const title = 'Votre espace galeriste'
  const lead = 'Voici votre lien d\'accès personnel à votre espace check-in. Cliquez le lien ci-dessous depuis votre téléphone le jour de l\'événement pour pointer les visiteurs présents.'

  const html = shell({
    title,
    preheader: 'Lien d\'accès personnel à votre espace check-in.',
    lang: 'fr',
    body: [
      header({}),
      hero({ eyebrow: 'Espace galeriste', title, lead }),
      paragraph({
        text: `Parcours : <strong style="color:#F5F1E8;">${routeSlug}</strong>. Conservez cet email, il contient votre lien personnel.`,
        html: true,
      }),
      cta({ href: magicUrl, label: 'Accéder à mon espace', variant: 'primary' }),
      paragraph({
        text: 'Le lien fonctionne sur mobile. Aucun mot de passe n\'est nécessaire — gardez cet email à portée de main.',
        muted: true,
      }),
      footer({ locale: 'fr' }),
    ].join('\n'),
  })

  const text = [
    title,
    '',
    lead,
    '',
    `Parcours : ${routeSlug}`,
    '',
    `Accéder à mon espace : ${magicUrl}`,
    '',
    '— Irekiak Gallery Weekend · Donostia / San Sebastián',
  ].join('\n')

  return { subject, html, text }
}

export default defineEventHandler(async (event) => {
  requireAdminToken(event)

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

  const token = signRouteToken(parsed.routeSlug)
  const siteUrl = (config.public?.siteUrl as string | undefined) ?? 'https://irekiak.eus'
  const magicUrl = `${siteUrl.replace(/\/$/, '')}/galeristes/${parsed.routeSlug}?key=${token}`

  const { subject, html, text } = buildMagicLinkEmail(parsed.routeSlug, magicUrl)
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
        { name: 'channel', value: 'galeriste-magic-link' },
        { name: 'route', value: parsed.routeSlug },
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
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    const message = err instanceof Error ? err.message : 'Unknown error'
    throw createError({ statusCode: 500, statusMessage: `Magic link send failed: ${message}` })
  }

  void logAudit({
    actor: 'admin',
    action: 'galeriste.linkSent',
    targetType: 'route',
    targetId: parsed.routeSlug,
    metadata: { to: parsed.to, resendId: id },
  })

  return { id, success: true as const }
})
