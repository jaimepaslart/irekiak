import { Resend } from 'resend'
import { useRuntimeConfig } from '#imports'

type BookingLanguage = 'eu' | 'es' | 'fr' | 'en'

interface SendBookingConfirmationParams {
  to: string
  bookingId: string
  confirmToken: string
  routeName: string
  date: string
  startTime: string
  endTime: string
  guests: number
  language: string
  icsContent: string
}

interface LocaleStrings {
  subject: string
  greeting: (firstNameOrEmail: string) => string
  intro: string
  details: string
  route: string
  dateLabel: string
  time: string
  guests: string
  bookingRef: string
  viewBooking: string
  icsNote: string
  footer: string
}

const locales: Record<BookingLanguage, LocaleStrings> = {
  eu: {
    subject: 'Irekiak Gallery Weekend - Zure erreserba berretsita',
    greeting: n => `Kaixo ${n},`,
    intro: 'Zure erreserba berretsi dugu. Eskerrik asko Irekiak ekitaldian parte hartzeagatik.',
    details: 'Erreserbaren xehetasunak',
    route: 'Ibilbidea',
    dateLabel: 'Data',
    time: 'Ordua',
    guests: 'Parte-hartzaileak',
    bookingRef: 'Erreserba erreferentzia',
    viewBooking: 'Ikusi nire erreserba',
    icsNote: 'Eranskinean egutegian gehitzeko fitxategia duzu.',
    footer: 'Irekiak Gallery Weekend - Donostia / San Sebastian',
  },
  es: {
    subject: 'Irekiak Gallery Weekend - Reserva confirmada',
    greeting: n => `Hola ${n},`,
    intro: 'Hemos confirmado tu reserva. Gracias por participar en Irekiak.',
    details: 'Detalles de la reserva',
    route: 'Recorrido',
    dateLabel: 'Fecha',
    time: 'Hora',
    guests: 'Participantes',
    bookingRef: 'Referencia',
    viewBooking: 'Ver mi reserva',
    icsNote: 'Encontrarás adjunto un archivo para añadir a tu calendario.',
    footer: 'Irekiak Gallery Weekend - Donostia / San Sebastian',
  },
  fr: {
    subject: 'Irekiak Gallery Weekend - Réservation confirmée',
    greeting: n => `Bonjour ${n},`,
    intro: 'Votre réservation est confirmée. Merci de participer à Irekiak.',
    details: 'Détails de la réservation',
    route: 'Parcours',
    dateLabel: 'Date',
    time: 'Horaire',
    guests: 'Participants',
    bookingRef: 'Référence',
    viewBooking: 'Voir ma réservation',
    icsNote: 'Un fichier calendrier est joint à cet email.',
    footer: 'Irekiak Gallery Weekend - Donostia / San Sebastian',
  },
  en: {
    subject: 'Irekiak Gallery Weekend - Booking confirmed',
    greeting: n => `Hello ${n},`,
    intro: 'Your booking is confirmed. Thank you for joining Irekiak.',
    details: 'Booking details',
    route: 'Route',
    dateLabel: 'Date',
    time: 'Time',
    guests: 'Guests',
    bookingRef: 'Booking reference',
    viewBooking: 'View my booking',
    icsNote: 'A calendar file is attached to this email.',
    footer: 'Irekiak Gallery Weekend - Donostia / San Sebastian',
  },
}

function resolveLocale(language: string): LocaleStrings {
  if (language === 'eu' || language === 'es' || language === 'fr' || language === 'en') {
    return locales[language]
  }
  return locales.en
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildHtml(params: SendBookingConfirmationParams, strings: LocaleStrings, confirmUrl: string): string {
  const safeRoute = escapeHtml(params.routeName)
  const safeDate = escapeHtml(params.date)
  const safeStart = escapeHtml(params.startTime)
  const safeEnd = escapeHtml(params.endTime)
  const safeRef = escapeHtml(params.bookingId)
  const safeGreeting = escapeHtml(strings.greeting(params.to))

  return `<!doctype html>
<html lang="${escapeHtml(params.language)}">
  <body style="margin:0;padding:0;background-color:#001E33;font-family:Inter,Arial,sans-serif;color:#ffffff;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#001E33;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#003153;border-radius:12px;padding:32px;">
            <tr>
              <td>
                <h1 style="margin:0 0 8px 0;font-size:22px;color:#ffffff;">Irekiak Gallery Weekend</h1>
                <p style="margin:0 0 24px 0;font-size:14px;color:rgba(255,255,255,0.7);">Donostia / San Sebastian</p>
                <p style="margin:0 0 16px 0;font-size:16px;color:#ffffff;">${safeGreeting}</p>
                <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#ffffff;">${escapeHtml(strings.intro)}</p>

                <h2 style="margin:24px 0 12px 0;font-size:16px;color:#ffffff;border-top:1px solid rgba(255,255,255,0.15);padding-top:16px;">${escapeHtml(strings.details)}</h2>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;color:#ffffff;">
                  <tr>
                    <td style="padding:6px 0;color:rgba(255,255,255,0.7);">${escapeHtml(strings.route)}</td>
                    <td style="padding:6px 0;text-align:right;">${safeRoute}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:rgba(255,255,255,0.7);">${escapeHtml(strings.dateLabel)}</td>
                    <td style="padding:6px 0;text-align:right;">${safeDate}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:rgba(255,255,255,0.7);">${escapeHtml(strings.time)}</td>
                    <td style="padding:6px 0;text-align:right;">${safeStart} - ${safeEnd}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:rgba(255,255,255,0.7);">${escapeHtml(strings.guests)}</td>
                    <td style="padding:6px 0;text-align:right;">${params.guests}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:rgba(255,255,255,0.7);">${escapeHtml(strings.bookingRef)}</td>
                    <td style="padding:6px 0;text-align:right;font-family:'JetBrains Mono',monospace;font-size:12px;">${safeRef}</td>
                  </tr>
                </table>

                <p style="margin:28px 0 0 0;text-align:center;">
                  <a href="${escapeHtml(confirmUrl)}" style="display:inline-block;background-color:#ffffff;color:#003153;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">${escapeHtml(strings.viewBooking)}</a>
                </p>

                <p style="margin:28px 0 0 0;font-size:12px;color:rgba(255,255,255,0.6);line-height:1.5;">${escapeHtml(strings.icsNote)}</p>
                <p style="margin:24px 0 0 0;font-size:12px;color:rgba(255,255,255,0.5);border-top:1px solid rgba(255,255,255,0.15);padding-top:16px;">${escapeHtml(strings.footer)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

/**
 * Sends the booking confirmation email via Resend with an attached .ics file.
 * If RESEND_API_KEY is missing, logs a warning and resolves silently (dev mode).
 */
export async function sendBookingConfirmation(params: SendBookingConfirmationParams): Promise<void> {
  const config = useRuntimeConfig()
  if (!config.resendApiKey) {
    console.warn('[email] No RESEND_API_KEY, skipping email')
    return
  }

  const resend = new Resend(config.resendApiKey)
  const strings = resolveLocale(params.language)
  const siteUrl = (config.public?.siteUrl as string | undefined) ?? 'https://irekiak.eus'
  const confirmUrl = `${siteUrl.replace(/\/$/, '')}/bookings/${params.confirmToken}`

  const html = buildHtml(params, strings, confirmUrl)

  const { error } = await resend.emails.send({
    from: 'Irekiak <irekiak@irekiak.eus>',
    to: params.to,
    subject: strings.subject,
    html,
    attachments: [
      {
        filename: 'irekiak-booking.ics',
        content: Buffer.from(params.icsContent, 'utf8'),
        contentType: 'text/calendar; charset=utf-8; method=REQUEST',
      },
    ],
  })

  if (error) {
    console.error('[email] Resend error:', error)
    throw new Error(`Failed to send booking email: ${error.message ?? 'unknown error'}`)
  }
}

interface SendBookingCancellationParams {
  to: string
  bookingId: string
  routeName: string
  date: string
  startTime: string
  endTime: string
  guests: number
  language: string
}

const cancelLocales: Record<BookingLanguage, { subject: string, greeting: string, intro: string, details: string, route: string, dateLabel: string, time: string, guests: string, bookingRef: string, footer: string }> = {
  eu: {
    subject: 'Irekiak Gallery Weekend — Erreserba bertan behera utzi da',
    greeting: 'Kaixo',
    intro: 'Zure erreserba behar bezala bertan behera utzi da. Eskerrik asko Irekiak ezagutzeagatik — beste edizio batean elkar ikusiko dugu!',
    details: 'Bertan behera utzi den erreserbaren xehetasunak',
    route: 'Ibilbidea',
    dateLabel: 'Data',
    time: 'Ordua',
    guests: 'Parte-hartzaileak',
    bookingRef: 'Erreferentzia',
    footer: 'Irekiak Gallery Weekend — Donostia / San Sebastián',
  },
  es: {
    subject: 'Irekiak Gallery Weekend — Reserva cancelada',
    greeting: 'Hola',
    intro: 'Tu reserva ha sido cancelada correctamente. Gracias por tu interés en Irekiak — ¡hasta la próxima edición!',
    details: 'Detalles de la reserva cancelada',
    route: 'Recorrido',
    dateLabel: 'Fecha',
    time: 'Hora',
    guests: 'Participantes',
    bookingRef: 'Referencia',
    footer: 'Irekiak Gallery Weekend — Donostia / San Sebastián',
  },
  fr: {
    subject: 'Irekiak Gallery Weekend — Réservation annulée',
    greeting: 'Bonjour',
    intro: 'Votre réservation a été annulée avec succès. Merci de votre intérêt pour Irekiak — au plaisir de vous retrouver lors d\'une prochaine édition !',
    details: 'Détails de la réservation annulée',
    route: 'Parcours',
    dateLabel: 'Date',
    time: 'Horaire',
    guests: 'Participants',
    bookingRef: 'Référence',
    footer: 'Irekiak Gallery Weekend — Donostia / San Sebastián',
  },
  en: {
    subject: 'Irekiak Gallery Weekend — Booking cancelled',
    greeting: 'Hello',
    intro: 'Your booking has been cancelled successfully. Thank you for your interest in Irekiak — see you at a future edition!',
    details: 'Cancelled booking details',
    route: 'Route',
    dateLabel: 'Date',
    time: 'Time',
    guests: 'Guests',
    bookingRef: 'Reference',
    footer: 'Irekiak Gallery Weekend — Donostia / San Sebastián',
  },
}

/**
 * Sends a booking cancellation email (no ICS attachment — the event is cancelled).
 * Non-blocking: errors are logged but never thrown.
 */
export async function sendBookingCancellation(params: SendBookingCancellationParams): Promise<void> {
  const config = useRuntimeConfig()
  if (!config.resendApiKey) {
    console.warn('[email] No RESEND_API_KEY, skipping cancellation email')
    return
  }
  try {
    const lang = (params.language === 'eu' || params.language === 'es' || params.language === 'fr' || params.language === 'en')
      ? params.language as BookingLanguage
      : 'en'
    const s = cancelLocales[lang]

    const html = `<!doctype html>
<html lang="${escapeHtml(lang)}">
  <body style="margin:0;padding:0;background-color:#001E33;font-family:Inter,Arial,sans-serif;color:#ffffff;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#001E33;padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#003153;border-radius:12px;padding:32px;">
          <tr><td>
            <h1 style="margin:0 0 8px 0;font-size:22px;color:#ffffff;">Irekiak Gallery Weekend</h1>
            <p style="margin:0 0 24px 0;font-size:14px;color:rgba(255,255,255,0.7);">Donostia / San Sebastián</p>
            <p style="margin:0 0 16px 0;font-size:16px;">${escapeHtml(s.greeting)},</p>
            <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;">${escapeHtml(s.intro)}</p>

            <h2 style="margin:24px 0 12px 0;font-size:16px;border-top:1px solid rgba(255,255,255,0.15);padding-top:16px;">${escapeHtml(s.details)}</h2>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;">
              <tr><td style="padding:6px 0;color:rgba(255,255,255,0.7);">${escapeHtml(s.route)}</td><td style="padding:6px 0;text-align:right;">${escapeHtml(params.routeName)}</td></tr>
              <tr><td style="padding:6px 0;color:rgba(255,255,255,0.7);">${escapeHtml(s.dateLabel)}</td><td style="padding:6px 0;text-align:right;">${escapeHtml(params.date)}</td></tr>
              <tr><td style="padding:6px 0;color:rgba(255,255,255,0.7);">${escapeHtml(s.time)}</td><td style="padding:6px 0;text-align:right;">${escapeHtml(params.startTime)} — ${escapeHtml(params.endTime)}</td></tr>
              <tr><td style="padding:6px 0;color:rgba(255,255,255,0.7);">${escapeHtml(s.guests)}</td><td style="padding:6px 0;text-align:right;">${params.guests}</td></tr>
              <tr><td style="padding:6px 0;color:rgba(255,255,255,0.7);">${escapeHtml(s.bookingRef)}</td><td style="padding:6px 0;text-align:right;font-family:'JetBrains Mono',monospace;font-size:12px;">${escapeHtml(params.bookingId)}</td></tr>
            </table>

            <p style="margin:24px 0 0 0;font-size:12px;color:rgba(255,255,255,0.5);border-top:1px solid rgba(255,255,255,0.15);padding-top:16px;">${escapeHtml(s.footer)}</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`

    const resend = new Resend(config.resendApiKey)
    const { error } = await resend.emails.send({
      from: 'Irekiak <irekiak@irekiak.eus>',
      to: params.to,
      subject: s.subject,
      html,
    })
    if (error) {
      console.error('[email] cancellation Resend error:', error)
    }
  }
  catch (err) {
    console.error('[email] cancellation unexpected failure:', err)
  }
}
