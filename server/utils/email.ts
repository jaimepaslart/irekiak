import { Resend } from 'resend'
import { useRuntimeConfig } from '#imports'
import { withEmailRetry } from './email-retry'
import {
  cta,
  dataTable,
  divider,
  escapeHtml,
  footer,
  header,
  hero,
  paragraph,
  section,
  shell,
  tokens,
  type DataRow,
} from './email-templates'
import { getSiteUrl } from './site-url'

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
  galleries?: string[]
  meetingPoint?: string | null
}

// ---------- LOCALES ----------

interface ConfirmationStrings {
  subjectPrefix: string
  subjectFor: (date: string) => string
  preheader: string
  eyebrow: string
  title: string
  lead: string
  details: string
  rowDate: string
  rowTime: string
  rowRoute: string
  rowGalleries: string
  rowGuests: string
  rowLanguage: string
  rowReference: string
  ctaLabel: string
  meetingTitle: string
  meetingLead: string
  ticketTitle: string
  ticketLead: string
  icsNote: string
}

const confirmationLocales: Record<BookingLanguage, ConfirmationStrings> = {
  eu: {
    subjectPrefix: 'Irekiak',
    subjectFor: d => `Zure sarrera ${d} egunerako`,
    preheader: 'Zure bisita gidatua berretsita dago. Goazen kuratzen dugun mundua ezagutzera.',
    eyebrow: 'Berretsita',
    title: 'Hor zaude',
    lead: 'Zure erreserba berretsi dugu. Goazen elkarrekin Irekiak bizitzera.',
    details: 'Bisitaren xehetasunak',
    rowDate: 'Data',
    rowTime: 'Ordua',
    rowRoute: 'Ibilbidea',
    rowGalleries: 'Galeriak',
    rowGuests: 'Lekuak',
    rowLanguage: 'Hizkuntza',
    rowReference: 'Erreferentzia',
    ctaLabel: 'Sarrera ikusi',
    meetingTitle: 'Topagunea',
    meetingLead: 'Animatu zaitez 10 minutu lehenago iristen.',
    ticketTitle: 'Zure sarrera digitala',
    ticketLead: 'QR kodea zure sarreran dago. Erakutsi sarreran.',
    icsNote: 'Egutegirako fitxategia eranskinean duzu (.ics).',
  },
  es: {
    subjectPrefix: 'Irekiak',
    subjectFor: d => `Su entrada para el ${d}`,
    preheader: 'Su visita guiada está confirmada. Le esperamos.',
    eyebrow: 'Confirmación',
    title: 'Está dentro',
    lead: 'Hemos confirmado su reserva. Será un placer recibirle durante el Gallery Weekend.',
    details: 'Detalles de la visita',
    rowDate: 'Fecha',
    rowTime: 'Hora',
    rowRoute: 'Recorrido',
    rowGalleries: 'Galerías',
    rowGuests: 'Plazas',
    rowLanguage: 'Idioma',
    rowReference: 'Referencia',
    ctaLabel: 'Ver mi entrada',
    meetingTitle: 'Punto de encuentro',
    meetingLead: 'Le recomendamos llegar 10 minutos antes.',
    ticketTitle: 'Su entrada digital',
    ticketLead: 'El código QR está en su entrada. Muéstrelo a la entrada.',
    icsNote: 'Encontrará un archivo de calendario adjunto (.ics).',
  },
  fr: {
    subjectPrefix: 'Irekiak',
    subjectFor: d => `Votre billet pour ${d}`,
    preheader: 'Votre visite guidée est confirmée. Au plaisir de vous accueillir.',
    eyebrow: 'Confirmation',
    title: 'Vous y êtes',
    lead: 'Nous avons confirmé votre réservation. Au plaisir de partager avec vous le Gallery Weekend.',
    details: 'Détails de la visite',
    rowDate: 'Date',
    rowTime: 'Horaire',
    rowRoute: 'Parcours',
    rowGalleries: 'Galeries',
    rowGuests: 'Places',
    rowLanguage: 'Langue',
    rowReference: 'Référence',
    ctaLabel: 'Voir mon billet',
    meetingTitle: 'Point de rendez-vous',
    meetingLead: 'Nous vous recommandons d\'arriver 10 minutes en avance.',
    ticketTitle: 'Votre billet numérique',
    ticketLead: 'Le QR code se trouve sur votre billet. Présentez-le à l\'entrée.',
    icsNote: 'Un fichier calendrier (.ics) est joint à cet email.',
  },
  en: {
    subjectPrefix: 'Irekiak',
    subjectFor: d => `Your ticket for ${d}`,
    preheader: 'Your guided tour is confirmed. We look forward to welcoming you.',
    eyebrow: 'Confirmation',
    title: 'You\'re in',
    lead: 'Your booking is confirmed. We look forward to sharing the Gallery Weekend with you.',
    details: 'Visit details',
    rowDate: 'Date',
    rowTime: 'Time',
    rowRoute: 'Route',
    rowGalleries: 'Galleries',
    rowGuests: 'Seats',
    rowLanguage: 'Language',
    rowReference: 'Reference',
    ctaLabel: 'View my ticket',
    meetingTitle: 'Meeting point',
    meetingLead: 'We recommend arriving 10 minutes early.',
    ticketTitle: 'Your digital ticket',
    ticketLead: 'The QR code is on your ticket. Please present it at the entrance.',
    icsNote: 'A calendar file (.ics) is attached to this email.',
  },
}

interface CancellationStrings {
  subject: string
  preheader: string
  eyebrow: string
  title: string
  lead: string
  details: string
  rowDate: string
  rowTime: string
  rowRoute: string
  rowReference: string
  changeMindLead: string
  ctaLabel: string
}

const cancellationLocales: Record<BookingLanguage, CancellationStrings> = {
  eu: {
    subject: 'Irekiak · Zure erreserba bertan behera utzi da',
    preheader: 'Zure erreserba bertan behera utzi dugu. Hurrengo edizioan elkar ikusi arte.',
    eyebrow: 'Bertan behera',
    title: 'Erreserba bertan behera',
    lead: 'Zure erreserba behar bezala bertan behera utzi da. Eskerrik asko Irekiak ezagutzeagatik.',
    details: 'Bertan behera utzitako bisita',
    rowDate: 'Data',
    rowTime: 'Ordua',
    rowRoute: 'Ibilbidea',
    rowReference: 'Erreferentzia',
    changeMindLead: 'Iritziz aldatu? Lekuak eskuragarri daude oraindik.',
    ctaLabel: 'Berriz erreserbatu',
  },
  es: {
    subject: 'Irekiak · Su reserva ha sido cancelada',
    preheader: 'Hemos cancelado su reserva. Hasta la próxima edición.',
    eyebrow: 'Cancelación',
    title: 'Reserva cancelada',
    lead: 'Su reserva ha sido cancelada correctamente. Gracias por su interés en Irekiak.',
    details: 'Visita cancelada',
    rowDate: 'Fecha',
    rowTime: 'Hora',
    rowRoute: 'Recorrido',
    rowReference: 'Referencia',
    changeMindLead: '¿Ha cambiado de opinión? Aún quedan plazas disponibles.',
    ctaLabel: 'Reservar de nuevo',
  },
  fr: {
    subject: 'Irekiak · Votre réservation a été annulée',
    preheader: 'Votre réservation a bien été annulée. Au plaisir de vous retrouver.',
    eyebrow: 'Annulation',
    title: 'Réservation annulée',
    lead: 'Votre réservation a bien été annulée. Merci de votre intérêt pour Irekiak.',
    details: 'Visite annulée',
    rowDate: 'Date',
    rowTime: 'Horaire',
    rowRoute: 'Parcours',
    rowReference: 'Référence',
    changeMindLead: 'Vous changez d\'avis ? Il reste encore des places.',
    ctaLabel: 'Réserver à nouveau',
  },
  en: {
    subject: 'Irekiak · Your booking has been cancelled',
    preheader: 'Your booking has been cancelled. We hope to see you next time.',
    eyebrow: 'Cancellation',
    title: 'Booking cancelled',
    lead: 'Your booking has been successfully cancelled. Thank you for your interest in Irekiak.',
    details: 'Cancelled visit',
    rowDate: 'Date',
    rowTime: 'Time',
    rowRoute: 'Route',
    rowReference: 'Reference',
    changeMindLead: 'Changed your mind? Seats are still available.',
    ctaLabel: 'Book again',
  },
}

function resolveLang(language: string): BookingLanguage {
  if (language === 'eu' || language === 'es' || language === 'fr' || language === 'en') {
    return language
  }
  return 'en'
}

// ---------- BUILDERS ----------

export function buildConfirmationEmail(
  params: SendBookingConfirmationParams,
  confirmUrl: string,
): { subject: string, html: string, text: string } {
  const lang = resolveLang(params.language)
  const s = confirmationLocales[lang]

  const dataRows: DataRow[] = [
    { label: s.rowDate, value: escapeHtml(params.date) },
    { label: s.rowTime, value: `${escapeHtml(params.startTime)}&nbsp;—&nbsp;${escapeHtml(params.endTime)}` },
    { label: s.rowRoute, value: `<strong style="font-weight:600;">${escapeHtml(params.routeName)}</strong>` },
  ]
  if (params.galleries && params.galleries.length > 0) {
    dataRows.push({
      label: s.rowGalleries,
      value: params.galleries.map(g => escapeHtml(g)).join('<br/>'),
    })
  }
  dataRows.push(
    { label: s.rowGuests, value: String(params.guests) },
    { label: s.rowLanguage, value: escapeHtml(lang.toUpperCase()) },
    { label: s.rowReference, value: escapeHtml(params.bookingId), mono: true },
  )

  const meetingHtml = params.meetingPoint
    ? `<p style="margin:0 0 6px 0;font-family:'Inter',Arial,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(245,241,232,0.65);font-weight:600;">${escapeHtml(s.meetingTitle)}</p>
       <p style="margin:0 0 6px 0;font-family:'Inter',Arial,sans-serif;font-size:14px;line-height:1.55;color:#F5F1E8;">${escapeHtml(params.meetingPoint)}</p>
       <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:13px;line-height:1.55;color:rgba(245,241,232,0.65);">${escapeHtml(s.meetingLead)}</p>`
    : ''

  const meetingSection = meetingHtml
    ? `<tr><td class="px" style="padding:0 40px 36px 40px;border-top:1px solid rgba(245,241,232,0.12);padding-top:32px;">${meetingHtml}</td></tr>`
    : ''

  const html = shell({
    title: s.subjectFor(params.date),
    preheader: s.preheader,
    lang,
    body: [
      header({}),
      hero({ eyebrow: s.eyebrow, title: s.title, lead: s.lead }),
      dataTable({ rows: dataRows, title: s.details }),
      cta({ href: confirmUrl, label: s.ctaLabel, variant: 'primary' }),
      meetingSection,
      paragraph({ text: s.icsNote, muted: true }),
      footer({ locale: lang }),
    ].join('\n'),
  })

  const subject = `${s.subjectPrefix} · ${s.subjectFor(params.date)}`

  const text = [
    s.title,
    '',
    s.lead,
    '',
    `${s.rowDate}: ${params.date}`,
    `${s.rowTime}: ${params.startTime} — ${params.endTime}`,
    `${s.rowRoute}: ${params.routeName}`,
    params.galleries && params.galleries.length > 0 ? `${s.rowGalleries}: ${params.galleries.join(', ')}` : '',
    `${s.rowGuests}: ${params.guests}`,
    `${s.rowLanguage}: ${lang.toUpperCase()}`,
    `${s.rowReference}: ${params.bookingId}`,
    '',
    `${s.ctaLabel}: ${confirmUrl}`,
    params.meetingPoint ? '' : '',
    params.meetingPoint ? `${s.meetingTitle}: ${params.meetingPoint}` : '',
    params.meetingPoint ? s.meetingLead : '',
    '',
    s.icsNote,
    '',
    '— Irekiak Gallery Weekend · Donostia / San Sebastián',
  ].filter(Boolean).join('\n')

  return { subject, html, text }
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
  const siteUrl = (config.public?.siteUrl as string | undefined) ?? 'https://irekiak.eus'
  const confirmUrl = `${siteUrl.replace(/\/$/, '')}/bookings/${params.confirmToken}`

  const { subject, html, text } = buildConfirmationEmail(params, confirmUrl)

  await withEmailRetry(async () => {
    const { error } = await resend.emails.send({
      from: config.fromEmail,
      to: params.to,
      subject,
      html,
      text,
      attachments: [
        {
          filename: 'irekiak-booking.ics',
          content: Buffer.from(params.icsContent, 'utf8'),
          contentType: 'text/calendar; charset=utf-8; method=REQUEST',
        },
      ],
    })
    if (error) {
      throw new Error(`Resend: ${error.message ?? 'unknown error'}`)
    }
  }, {
    channel: 'booking.confirmation',
    targetType: 'booking',
    targetId: params.bookingId,
    recipient: params.to,
  })
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

export function buildCancellationEmail(
  params: SendBookingCancellationParams,
  rebookUrl: string,
): { subject: string, html: string, text: string } {
  const lang = resolveLang(params.language)
  const s = cancellationLocales[lang]

  const html = shell({
    title: s.title,
    preheader: s.preheader,
    lang,
    body: [
      header({}),
      hero({ eyebrow: s.eyebrow, title: s.title, lead: s.lead }),
      dataTable({
        title: s.details,
        rows: [
          { label: s.rowDate, value: escapeHtml(params.date) },
          { label: s.rowTime, value: `${escapeHtml(params.startTime)}&nbsp;—&nbsp;${escapeHtml(params.endTime)}` },
          { label: s.rowRoute, value: escapeHtml(params.routeName) },
          { label: s.rowReference, value: escapeHtml(params.bookingId), mono: true },
        ],
      }),
      divider(),
      paragraph({ text: s.changeMindLead, muted: true }),
      cta({ href: rebookUrl, label: s.ctaLabel, variant: 'secondary' }),
      footer({ locale: lang }),
    ].join('\n'),
  })

  const text = [
    s.title,
    '',
    s.lead,
    '',
    `${s.rowDate}: ${params.date}`,
    `${s.rowTime}: ${params.startTime} — ${params.endTime}`,
    `${s.rowRoute}: ${params.routeName}`,
    `${s.rowReference}: ${params.bookingId}`,
    '',
    s.changeMindLead,
    `${s.ctaLabel}: ${rebookUrl}`,
    '',
    '— Irekiak Gallery Weekend · Donostia / San Sebastián',
  ].join('\n')

  return { subject: s.subject, html, text }
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
    const siteUrl = (config.public?.siteUrl as string | undefined) ?? 'https://irekiak.eus'
    const rebookUrl = `${siteUrl.replace(/\/$/, '')}/visites`
    const { subject, html, text } = buildCancellationEmail(params, rebookUrl)

    const resend = new Resend(config.resendApiKey)
    await withEmailRetry(async () => {
      const { error } = await resend.emails.send({
        from: config.fromEmail,
        to: params.to,
        subject,
        html,
        text,
      })
      if (error) throw new Error(`Resend: ${error.message ?? 'unknown'}`)
    }, {
      channel: 'booking.cancellation',
      targetType: 'booking',
      targetId: params.bookingId,
      recipient: params.to,
    })
  }
  catch (err) {
    console.error('[email] cancellation final failure:', err)
  }
}

// ---------- LOOKUP (retrieve my bookings) ----------

export interface LookupBookingEntry {
  confirmToken: string
  routeName: string
  date: string
  startTime: string
  endTime: string
  guests: number
}

interface SendLookupParams {
  to: string
  bookings: LookupBookingEntry[]
  language: string
}

interface LookupStrings {
  subject: string
  preheader: string
  eyebrow: string
  title: string
  lead: (count: number) => string
  singleBookingLead: string
  dateLabel: string
  timeLabel: string
  guestsLabel: string
  ctaLabel: string
  notYouTitle: string
  notYouLead: string
}

const lookupLocales: Record<BookingLanguage, LookupStrings> = {
  eu: {
    subject: 'Irekiak · Zure erreserbak',
    preheader: 'Hemen dituzu helbide honi lotutako erreserbak.',
    eyebrow: 'Zure erreserbak',
    title: 'Zure erreserbak hemen dituzu',
    lead: count => count === 1
      ? 'Helbide honi lotutako erreserba bat aurkitu dugu.'
      : `Helbide honi lotutako ${count} erreserba aurkitu ditugu.`,
    singleBookingLead: 'Sakatu beheko botoia xehetasunak ikusteko, QR kodea eskuratzeko edo erreserba bertan behera uzteko.',
    dateLabel: 'Data',
    timeLabel: 'Ordua',
    guestsLabel: 'Lekuak',
    ctaLabel: 'Erreserba ikusi',
    notYouTitle: 'Zu ez bazara?',
    notYouLead: 'Mezu hau ez bazenuen espero, ez ikusiarena egin dezakezu. Ez dugu beste ezer egin.',
  },
  es: {
    subject: 'Irekiak · Sus reservas',
    preheader: 'Aquí están las reservas asociadas a esta dirección.',
    eyebrow: 'Sus reservas',
    title: 'Aquí están sus reservas',
    lead: count => count === 1
      ? 'Hemos encontrado una reserva asociada a esta dirección.'
      : `Hemos encontrado ${count} reservas asociadas a esta dirección.`,
    singleBookingLead: 'Pulse el botón para ver los detalles, acceder al código QR o cancelar la reserva.',
    dateLabel: 'Fecha',
    timeLabel: 'Hora',
    guestsLabel: 'Plazas',
    ctaLabel: 'Ver mi reserva',
    notYouTitle: '¿No es usted?',
    notYouLead: 'Si no esperaba este mensaje, puede ignorarlo. No hemos hecho ningún cambio.',
  },
  fr: {
    subject: 'Irekiak · Vos réservations',
    preheader: 'Voici les réservations associées à cette adresse.',
    eyebrow: 'Vos réservations',
    title: 'Voici vos réservations',
    lead: count => count === 1
      ? 'Nous avons trouvé une réservation associée à cette adresse.'
      : `Nous avons trouvé ${count} réservations associées à cette adresse.`,
    singleBookingLead: 'Cliquez sur le bouton pour consulter les détails, accéder au QR code ou annuler la réservation.',
    dateLabel: 'Date',
    timeLabel: 'Horaire',
    guestsLabel: 'Places',
    ctaLabel: 'Voir ma réservation',
    notYouTitle: 'Ce n\'est pas vous ?',
    notYouLead: 'Si vous ne vous attendiez pas à ce message, vous pouvez l\'ignorer. Aucun changement n\'a été effectué.',
  },
  en: {
    subject: 'Irekiak · Your bookings',
    preheader: 'Here are the bookings associated with this address.',
    eyebrow: 'Your bookings',
    title: 'Here are your bookings',
    lead: count => count === 1
      ? 'We found one booking associated with this address.'
      : `We found ${count} bookings associated with this address.`,
    singleBookingLead: 'Tap the button to view details, access the QR code or cancel the booking.',
    dateLabel: 'Date',
    timeLabel: 'Time',
    guestsLabel: 'Seats',
    ctaLabel: 'View my booking',
    notYouTitle: 'Not you?',
    notYouLead: 'If you did not expect this message, you can ignore it. No changes were made.',
  },
}

function renderLookupCard(
  entry: LookupBookingEntry,
  s: LookupStrings,
  url: string,
): string {
  const t = tokens
  return `<div style="padding:20px;border:1px solid ${t.colors.border};border-radius:3px;background-color:${t.colors.bgSubtle};">
  <p style="margin:0 0 6px 0;font-family:${t.fonts.sans};font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${t.colors.accent};font-weight:600;">
    ${escapeHtml(entry.date)}
  </p>
  <p style="margin:0 0 14px 0;font-family:${t.fonts.serif};font-size:20px;line-height:1.25;color:${t.colors.text};font-weight:400;letter-spacing:-0.005em;">
    ${escapeHtml(entry.routeName)}
  </p>
  <p style="margin:0 0 16px 0;font-family:${t.fonts.sans};font-size:13px;line-height:1.6;color:${t.colors.textMuted};">
    ${escapeHtml(s.timeLabel)} · ${escapeHtml(entry.startTime)}&nbsp;—&nbsp;${escapeHtml(entry.endTime)}
    <br/>
    ${escapeHtml(s.guestsLabel)} · ${entry.guests}
  </p>
  <a href="${escapeHtml(url)}" style="display:inline-block;padding:10px 18px;font-family:${t.fonts.sans};font-size:11px;letter-spacing:0.22em;text-transform:uppercase;font-weight:600;color:${t.colors.text};text-decoration:none;border:1px solid ${t.colors.text};border-radius:2px;">
    ${escapeHtml(s.ctaLabel)}
  </a>
</div>`
}

export function buildLookupEmail(
  params: SendLookupParams,
  siteUrl: string,
): { subject: string, html: string, text: string } {
  const lang = resolveLang(params.language)
  const s = lookupLocales[lang]
  const base = siteUrl.replace(/\/$/, '')
  const count = params.bookings.length

  const rendered = params.bookings.map((b) => {
    const url = `${base}/bookings/${b.confirmToken}`
    return {
      html: renderLookupCard(b, s, url),
      text: [
        `${s.dateLabel}: ${b.date}`,
        `${s.timeLabel}: ${b.startTime} — ${b.endTime}`,
        `${s.guestsLabel}: ${b.guests}`,
        b.routeName,
        `${s.ctaLabel}: ${url}`,
        '',
      ],
    }
  })

  const cards = rendered
    .map(r => r.html)
    .join('<div style="height:12px;line-height:0;font-size:0;">&nbsp;</div>')

  const singleLead = count === 1 ? paragraph({ text: s.singleBookingLead, muted: true }) : ''

  const html = shell({
    title: s.title,
    preheader: s.preheader,
    lang,
    body: [
      header({}),
      hero({ eyebrow: s.eyebrow, title: s.title, lead: s.lead(count) }),
      section({ html: cards, paddingBottom: 36 }),
      singleLead,
      divider(),
      paragraph({ text: `<strong style="color:${tokens.colors.text};font-weight:600;">${escapeHtml(s.notYouTitle)}</strong> ${escapeHtml(s.notYouLead)}`, muted: true, html: true }),
      footer({ locale: lang }),
    ].join('\n'),
  })

  const text = [
    s.title,
    '',
    s.lead(count),
    '',
    ...rendered.flatMap(r => r.text),
    s.notYouTitle,
    s.notYouLead,
    '',
    '— Irekiak Gallery Weekend · Donostia / San Sebastián',
  ].join('\n')

  return { subject: s.subject, html, text }
}

/**
 * Sends a booking lookup email listing all confirmed bookings for a given email.
 * Non-blocking: errors are logged but never thrown (caller does fire-and-forget).
 */
export async function sendLookupEmail(params: SendLookupParams): Promise<void> {
  const config = useRuntimeConfig()
  if (!config.resendApiKey) {
    console.warn('[email] No RESEND_API_KEY, skipping lookup email')
    return
  }
  if (params.bookings.length === 0) return

  try {
    const { subject, html, text } = buildLookupEmail(params, getSiteUrl())

    const resend = new Resend(config.resendApiKey)
    await withEmailRetry(async () => {
      const { error } = await resend.emails.send({
        from: config.fromEmail,
        to: params.to,
        subject,
        html,
        text,
      })
      if (error) throw new Error(`Resend: ${error.message ?? 'unknown'}`)
    }, {
      channel: 'booking.lookup',
      targetType: 'booking',
      recipient: params.to,
    })
  }
  catch (err) {
    console.error('[email] lookup final failure:', err)
  }
}
