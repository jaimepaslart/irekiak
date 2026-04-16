import { Resend } from 'resend'
import { createError, defineEventHandler, readValidatedBody } from 'h3'
import { z } from 'zod'
import { useRuntimeConfig } from '#imports'
import { logAudit } from '../../utils/audit'
import { enforceRateLimit } from '../../utils/rate-limit'
import { requireAdminToken } from '../../utils/require-admin'
import { buildConfirmationEmail, buildCancellationEmail } from '../../utils/email'
import { buildGalleryNotificationEmail } from '../../utils/email-gallery'
import { cta, dataTable, footer, header, hero, paragraph, shell } from '../../utils/email-templates'

const LANGUAGES = ['eu', 'es', 'fr', 'en'] as const
const TEMPLATES = ['plain', 'confirmation', 'cancellation', 'gallery_notification'] as const

type Language = (typeof LANGUAGES)[number]
type Template = (typeof TEMPLATES)[number]

const schema = z.object({
  to: z.string().trim().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email'),
  language: z.enum(LANGUAGES),
  template: z.enum(TEMPLATES),
})

interface Preview {
  subject: string
  html: string
  text: string
}

const PLAIN_LOCALES: Record<Language, { eyebrow: string, title: string, lead: string, ctaLabel: string }> = {
  eu: { eyebrow: 'Proba', title: 'Konfigurazio proba', lead: 'Mezu hau Resend konfigurazioa egiaztatzeko bidaltzen da (DKIM, domeinua, igorlearen helbidea).', ctaLabel: 'Webgunea ireki' },
  es: { eyebrow: 'Prueba', title: 'Prueba de configuración', lead: 'Este mensaje se envía para verificar la configuración de Resend (DKIM, dominio, dirección de envío).', ctaLabel: 'Abrir el sitio' },
  fr: { eyebrow: 'Test', title: 'Test de configuration', lead: 'Ce message est envoyé pour vérifier la configuration Resend (DKIM, domaine, adresse d\'expédition).', ctaLabel: 'Ouvrir le site' },
  en: { eyebrow: 'Test', title: 'Configuration test', lead: 'This message is sent to verify the Resend configuration (DKIM, domain, sending address).', ctaLabel: 'Open the site' },
}

function buildPlainTest(language: Language): Preview {
  const s = PLAIN_LOCALES[language]
  const html = shell({
    title: s.title,
    preheader: s.lead,
    lang: language,
    body: [
      header({}),
      hero({ eyebrow: `[TEST] ${s.eyebrow}`, title: s.title, lead: s.lead }),
      dataTable({
        rows: [
          { label: 'Environment', value: 'test' },
          { label: 'Language', value: language.toUpperCase() },
          { label: 'Template', value: 'plain' },
        ],
      }),
      cta({ href: 'https://irekiak.eus', label: s.ctaLabel, variant: 'primary' }),
      paragraph({ text: 'Email envoyé depuis l\'admin Irekiak — aucun visiteur n\'est concerné.', muted: true }),
      footer({ locale: language }),
    ].join('\n'),
  })
  const text = `[TEST] ${s.title}\n\n${s.lead}\n\nLanguage: ${language.toUpperCase()}\nTemplate: plain\n\n— Irekiak Gallery Weekend`
  return { subject: `[TEST] Irekiak · plain · ${language.toUpperCase()}`, html, text }
}

function buildConfirmationTest(language: Language): Preview {
  const built = buildConfirmationEmail(
    {
      to: 'test@example.com',
      bookingId: 'TEST-1234-ABCD',
      confirmToken: 'preview-token',
      routeName: 'Arteko + Cibrián',
      date: '2026-05-30',
      startTime: '11:30',
      endTime: '13:00',
      guests: 2,
      language,
      icsContent: '',
      galleries: ['Arteko', 'Cibrián', 'Galería Test'],
      meetingPoint: 'Plaza de la Constitución, 1 — Donostia',
    },
    'https://irekiak.eus/bookings/preview-token',
  )
  return {
    subject: `[TEST] ${built.subject}`,
    html: built.html,
    text: `[TEST]\n\n${built.text}`,
  }
}

function buildCancellationTest(language: Language): Preview {
  const built = buildCancellationEmail(
    {
      to: 'test@example.com',
      bookingId: 'TEST-1234-ABCD',
      routeName: 'Arteko + Cibrián',
      date: '2026-05-30',
      startTime: '11:30',
      endTime: '13:00',
      guests: 2,
      language,
    },
    'https://irekiak.eus/visites',
  )
  return {
    subject: `[TEST] ${built.subject}`,
    html: built.html,
    text: `[TEST]\n\n${built.text}`,
  }
}

function buildGalleryTest(language: Language): Preview {
  const built = buildGalleryNotificationEmail({
    to: 'test@example.com',
    galleryName: 'Galería Test',
    contactLanguage: language,
    booking: {
      id: 'TEST-1234-ABCD',
      firstName: 'Test',
      lastName: 'Visitor',
      email: 'visitor@example.com',
      phone: '+34 600 000 000',
      numberOfPeople: 2,
      language,
      specialNeeds: 'Accès PMR souhaité',
    },
    slot: {
      date: '2026-05-30',
      startTime: '11:30',
      endTime: '13:00',
    },
    route: {
      name: 'Arteko + Cibrián',
      galleries: ['Arteko', 'Cibrián', 'Galería Test'],
    },
    action: 'booked',
  })
  return {
    subject: `[TEST] ${built.subject}`,
    html: built.html,
    text: `[TEST]\n\n${built.text}`,
  }
}

function buildPreview(template: Template, language: Language): Preview {
  switch (template) {
    case 'plain': return buildPlainTest(language)
    case 'confirmation': return buildConfirmationTest(language)
    case 'cancellation': return buildCancellationTest(language)
    case 'gallery_notification': return buildGalleryTest(language)
  }
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
