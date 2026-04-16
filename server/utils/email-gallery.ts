import { Resend } from 'resend'
import { useRuntimeConfig } from '#imports'
import { withEmailRetry } from './email-retry'

type Language = 'eu' | 'es' | 'fr' | 'en'

interface GalleryNotificationParams {
  to: string
  galleryName: string
  contactLanguage: Language
  booking: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string | null
    numberOfPeople: number
    language: Language
    specialNeeds?: string | null
  }
  slot: {
    date: string
    startTime: string
    endTime: string
  }
  route: {
    name: string
    galleries: string[]
  }
  action: 'booked' | 'cancelled'
}

interface Strings {
  subjectBooked: (route: string, date: string) => string
  subjectCancelled: (route: string, date: string) => string
  greeting: (gallery: string) => string
  introBooked: string
  introCancelled: string
  details: string
  route: string
  galleriesInRoute: string
  dateLabel: string
  time: string
  visitor: string
  guests: string
  language: string
  contactEmail: string
  contactPhone: string
  specialNeeds: string
  bookingRef: string
  footer: string
}

const locales: Record<Language, Strings> = {
  eu: {
    subjectBooked: (r, d) => `[Irekiak] Erreserba berria: ${r} — ${d}`,
    subjectCancelled: (r, d) => `[Irekiak] Erreserba bertan behera: ${r} — ${d}`,
    greeting: g => `Kaixo ${g},`,
    introBooked: 'Erreserba berri bat jaso duzue zure galerian egingo den bisita gidatu baterako.',
    introCancelled: 'Bisita gidatu baterako erreserba bat bertan behera utzi da.',
    details: 'Xehetasunak',
    route: 'Ibilbidea',
    galleriesInRoute: 'Ibilbideko galeriak',
    dateLabel: 'Data',
    time: 'Ordua',
    visitor: 'Bisitaria',
    guests: 'Parte-hartzaileak',
    language: 'Hizkuntza',
    contactEmail: 'Emaila',
    contactPhone: 'Telefonoa',
    specialNeeds: 'Behar bereziak',
    bookingRef: 'Erreferentzia',
    footer: 'Irekiak Gallery Weekend — DAGGE',
  },
  es: {
    subjectBooked: (r, d) => `[Irekiak] Nueva reserva: ${r} — ${d}`,
    subjectCancelled: (r, d) => `[Irekiak] Reserva cancelada: ${r} — ${d}`,
    greeting: g => `Hola ${g},`,
    introBooked: 'Se ha realizado una nueva reserva para una visita guiada que pasará por vuestra galería.',
    introCancelled: 'Una reserva de visita guiada ha sido cancelada.',
    details: 'Detalles',
    route: 'Recorrido',
    galleriesInRoute: 'Galerías del recorrido',
    dateLabel: 'Fecha',
    time: 'Hora',
    visitor: 'Visitante',
    guests: 'Participantes',
    language: 'Idioma',
    contactEmail: 'Email',
    contactPhone: 'Teléfono',
    specialNeeds: 'Necesidades especiales',
    bookingRef: 'Referencia',
    footer: 'Irekiak Gallery Weekend — DAGGE',
  },
  fr: {
    subjectBooked: (r, d) => `[Irekiak] Nouvelle réservation : ${r} — ${d}`,
    subjectCancelled: (r, d) => `[Irekiak] Réservation annulée : ${r} — ${d}`,
    greeting: g => `Bonjour ${g},`,
    introBooked: 'Une nouvelle réservation vient d\'être enregistrée pour une visite guidée qui passera dans votre galerie.',
    introCancelled: 'Une réservation de visite guidée a été annulée.',
    details: 'Détails',
    route: 'Parcours',
    galleriesInRoute: 'Galeries du parcours',
    dateLabel: 'Date',
    time: 'Horaire',
    visitor: 'Visiteur',
    guests: 'Participants',
    language: 'Langue',
    contactEmail: 'Email',
    contactPhone: 'Téléphone',
    specialNeeds: 'Besoins spécifiques',
    bookingRef: 'Référence',
    footer: 'Irekiak Gallery Weekend — DAGGE',
  },
  en: {
    subjectBooked: (r, d) => `[Irekiak] New booking: ${r} — ${d}`,
    subjectCancelled: (r, d) => `[Irekiak] Booking cancelled: ${r} — ${d}`,
    greeting: g => `Hello ${g},`,
    introBooked: 'A new booking has been made for a guided tour that will visit your gallery.',
    introCancelled: 'A guided tour booking has been cancelled.',
    details: 'Details',
    route: 'Route',
    galleriesInRoute: 'Galleries on this route',
    dateLabel: 'Date',
    time: 'Time',
    visitor: 'Visitor',
    guests: 'Guests',
    language: 'Language',
    contactEmail: 'Email',
    contactPhone: 'Phone',
    specialNeeds: 'Special needs',
    bookingRef: 'Reference',
    footer: 'Irekiak Gallery Weekend — DAGGE',
  },
}

function esc(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function buildHtml(p: GalleryNotificationParams, s: Strings): string {
  const intro = p.action === 'booked' ? s.introBooked : s.introCancelled
  const fullName = `${p.booking.firstName} ${p.booking.lastName}`
  const specialRow = p.booking.specialNeeds
    ? `<tr><td style="padding:6px 0;color:rgba(255,255,255,0.7);">${esc(s.specialNeeds)}</td><td style="padding:6px 0;text-align:right;">${esc(p.booking.specialNeeds)}</td></tr>`
    : ''
  const phoneRow = p.booking.phone
    ? `<tr><td style="padding:6px 0;color:rgba(255,255,255,0.7);">${esc(s.contactPhone)}</td><td style="padding:6px 0;text-align:right;"><a href="tel:${esc(p.booking.phone)}" style="color:#ffffff;">${esc(p.booking.phone)}</a></td></tr>`
    : ''
  const statusBadge = p.action === 'cancelled'
    ? `<span style="display:inline-block;background:rgba(255,80,80,0.25);color:#ffd0d0;padding:2px 10px;border-radius:999px;font-size:11px;margin-left:8px;">${p.action.toUpperCase()}</span>`
    : `<span style="display:inline-block;background:rgba(80,255,180,0.18);color:#b8ffd6;padding:2px 10px;border-radius:999px;font-size:11px;margin-left:8px;">${p.action.toUpperCase()}</span>`

  return `<!doctype html>
<html lang="${esc(p.contactLanguage)}">
  <body style="margin:0;padding:0;background-color:#001E33;font-family:Inter,Arial,sans-serif;color:#ffffff;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#001E33;padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#003153;border-radius:12px;padding:32px;">
          <tr><td>
            <h1 style="margin:0 0 8px 0;font-size:22px;color:#ffffff;">Irekiak Gallery Weekend ${statusBadge}</h1>
            <p style="margin:0 0 24px 0;font-size:14px;color:rgba(255,255,255,0.7);">Donostia / San Sebastián — 29-31.05.2026</p>
            <p style="margin:0 0 16px 0;font-size:16px;color:#ffffff;">${esc(s.greeting(p.galleryName))}</p>
            <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;">${esc(intro)}</p>

            <h2 style="margin:24px 0 12px 0;font-size:16px;border-top:1px solid rgba(255,255,255,0.15);padding-top:16px;">${esc(s.details)}</h2>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;">
              <tr><td style="padding:6px 0;color:rgba(255,255,255,0.7);">${esc(s.route)}</td><td style="padding:6px 0;text-align:right;"><strong>${esc(p.route.name)}</strong></td></tr>
              <tr><td style="padding:6px 0;color:rgba(255,255,255,0.7);">${esc(s.galleriesInRoute)}</td><td style="padding:6px 0;text-align:right;">${esc(p.route.galleries.join(' · '))}</td></tr>
              <tr><td style="padding:6px 0;color:rgba(255,255,255,0.7);">${esc(s.dateLabel)}</td><td style="padding:6px 0;text-align:right;">${esc(p.slot.date)}</td></tr>
              <tr><td style="padding:6px 0;color:rgba(255,255,255,0.7);">${esc(s.time)}</td><td style="padding:6px 0;text-align:right;">${esc(p.slot.startTime)} — ${esc(p.slot.endTime)}</td></tr>
              <tr><td style="padding:6px 0;color:rgba(255,255,255,0.7);">${esc(s.language)}</td><td style="padding:6px 0;text-align:right;">${esc(p.booking.language.toUpperCase())}</td></tr>
            </table>

            <h2 style="margin:24px 0 12px 0;font-size:16px;border-top:1px solid rgba(255,255,255,0.15);padding-top:16px;">${esc(s.visitor)}</h2>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;">
              <tr><td style="padding:6px 0;color:rgba(255,255,255,0.7);">${esc(s.visitor)}</td><td style="padding:6px 0;text-align:right;"><strong>${esc(fullName)}</strong></td></tr>
              <tr><td style="padding:6px 0;color:rgba(255,255,255,0.7);">${esc(s.guests)}</td><td style="padding:6px 0;text-align:right;">${p.booking.numberOfPeople}</td></tr>
              <tr><td style="padding:6px 0;color:rgba(255,255,255,0.7);">${esc(s.contactEmail)}</td><td style="padding:6px 0;text-align:right;"><a href="mailto:${esc(p.booking.email)}" style="color:#ffffff;">${esc(p.booking.email)}</a></td></tr>
              ${phoneRow}
              ${specialRow}
              <tr><td style="padding:6px 0;color:rgba(255,255,255,0.7);">${esc(s.bookingRef)}</td><td style="padding:6px 0;text-align:right;font-family:'JetBrains Mono',monospace;font-size:11px;">${esc(p.booking.id)}</td></tr>
            </table>

            <p style="margin:24px 0 0 0;font-size:12px;color:rgba(255,255,255,0.5);border-top:1px solid rgba(255,255,255,0.15);padding-top:16px;">${esc(s.footer)}</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
}

/**
 * Sends a booking notification to a gallery contact. Non-blocking — errors
 * are logged but never thrown (notifications are nice-to-have, not critical).
 */
export async function sendGalleryBookingNotification(params: GalleryNotificationParams): Promise<void> {
  const config = useRuntimeConfig()
  if (!config.resendApiKey) {
    console.warn('[email-gallery] No RESEND_API_KEY, skipping')
    return
  }
  try {
    const resend = new Resend(config.resendApiKey)
    const strings = locales[params.contactLanguage] ?? locales.es
    const subject = params.action === 'booked'
      ? strings.subjectBooked(params.route.name, params.slot.date)
      : strings.subjectCancelled(params.route.name, params.slot.date)
    const html = buildHtml(params, strings)
    await withEmailRetry(async () => {
      const { error } = await resend.emails.send({
        from: config.fromEmail,
        to: params.to,
        subject,
        html,
      })
      if (error) throw new Error(`Resend: ${error.message ?? 'unknown'}`)
    }, {
      channel: `gallery.${params.action}`,
      targetType: 'booking',
      targetId: params.booking.id,
      recipient: params.to,
    })
  }
  catch (err) {
    console.error('[email-gallery] final failure:', err)
  }
}
