import { Resend } from 'resend'
import { useRuntimeConfig } from '#imports'
import { withEmailRetry } from './email-retry'
import { ALLOWED_ROUTE_SLUGS, signRouteToken } from './galeriste-token'
import {
  cta,
  dataTable,
  escapeHtml,
  footer,
  header,
  hero,
  paragraph,
  shell,
  type DataRow,
} from './email-templates'

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
    id: string
    name: string
    galleries: string[]
  }
  action: 'booked' | 'cancelled'
}

const galeristeCtaLabels: Record<Language, string> = {
  eu: 'Nire erreserbak ikusi',
  es: 'Ver mis reservas',
  fr: 'Voir mes réservations',
  en: 'View my bookings',
}

const ALLOWED_GALERISTE_SLUGS = new Set<string>(ALLOWED_ROUTE_SLUGS)

function buildGaleristeUrl(routeId: string): string | null {
  const slug = routeId.startsWith('route-') ? routeId.slice('route-'.length) : routeId
  if (!ALLOWED_GALERISTE_SLUGS.has(slug)) return null
  let token: string
  try {
    token = signRouteToken(slug)
  }
  catch {
    return null
  }
  const config = useRuntimeConfig()
  const siteUrl = (config.public?.siteUrl as string | undefined) ?? 'https://irekiak.eus'
  return `${siteUrl.replace(/\/$/, '')}/galeristes/${slug}?key=${token}`
}

interface Strings {
  subjectBooked: (gallery: string, date: string, time: string) => string
  subjectCancelled: (gallery: string, date: string, time: string) => string
  preheaderBooked: (name: string) => string
  preheaderCancelled: (name: string) => string
  eyebrowBooked: string
  eyebrowCancelled: string
  titleBooked: string
  titleCancelled: string
  leadBooked: string
  leadCancelled: string
  sectionVisit: string
  sectionVisitor: string
  rowRoute: string
  rowGalleries: string
  rowDate: string
  rowTime: string
  rowVisitor: string
  rowGuests: string
  rowLanguage: string
  rowEmail: string
  rowPhone: string
  rowNotes: string
  rowReference: string
  greetingLead: (gallery: string) => string
}

const locales: Record<Language, Strings> = {
  eu: {
    subjectBooked: (g, d, t) => `Irekiak · Erreserba berria · ${g} · ${d} ${t}`,
    subjectCancelled: (g, d, t) => `Irekiak · Erreserba bertan behera · ${g} · ${d} ${t}`,
    preheaderBooked: n => `${n}-k bisita bat erreserbatu du.`,
    preheaderCancelled: n => `${n}-k bere erreserba bertan behera utzi du.`,
    eyebrowBooked: 'Erreserba',
    eyebrowCancelled: 'Bertan behera',
    titleBooked: 'Bisitari berri bat',
    titleCancelled: 'Erreserba bat bertan behera',
    leadBooked: 'Bisita gidatu baten erreserba jaso duzue. Hona hemen xehetasunak.',
    leadCancelled: 'Bisita gidatu baten erreserba bertan behera utzi da.',
    sectionVisit: 'Bisita',
    sectionVisitor: 'Bisitaria',
    rowRoute: 'Ibilbidea',
    rowGalleries: 'Galeriak',
    rowDate: 'Data',
    rowTime: 'Ordua',
    rowVisitor: 'Izena',
    rowGuests: 'Lagunkide',
    rowLanguage: 'Hizkuntza',
    rowEmail: 'Emaila',
    rowPhone: 'Telefonoa',
    rowNotes: 'Oharrak',
    rowReference: 'Erref.',
    greetingLead: g => `Kaixo ${g},`,
  },
  es: {
    subjectBooked: (g, d, t) => `Irekiak · Nueva reserva · ${g} · ${d} ${t}`,
    subjectCancelled: (g, d, t) => `Irekiak · Reserva cancelada · ${g} · ${d} ${t}`,
    preheaderBooked: n => `${n} ha reservado una visita.`,
    preheaderCancelled: n => `${n} ha cancelado su reserva.`,
    eyebrowBooked: 'Reserva',
    eyebrowCancelled: 'Cancelación',
    titleBooked: 'Nuevo visitante',
    titleCancelled: 'Reserva cancelada',
    leadBooked: 'Se ha registrado una reserva para una visita guiada que pasará por su galería.',
    leadCancelled: 'Una reserva de visita guiada ha sido cancelada.',
    sectionVisit: 'La visita',
    sectionVisitor: 'El visitante',
    rowRoute: 'Recorrido',
    rowGalleries: 'Galerías',
    rowDate: 'Fecha',
    rowTime: 'Hora',
    rowVisitor: 'Nombre',
    rowGuests: 'Personas',
    rowLanguage: 'Idioma',
    rowEmail: 'Email',
    rowPhone: 'Teléfono',
    rowNotes: 'Notas',
    rowReference: 'Ref.',
    greetingLead: g => `Estimada galería ${g},`,
  },
  fr: {
    subjectBooked: (g, d, t) => `Irekiak · Nouvelle réservation · ${g} · ${d} ${t}`,
    subjectCancelled: (g, d, t) => `Irekiak · Réservation annulée · ${g} · ${d} ${t}`,
    preheaderBooked: n => `${n} a réservé une visite.`,
    preheaderCancelled: n => `${n} a annulé sa réservation.`,
    eyebrowBooked: 'Réservation',
    eyebrowCancelled: 'Annulation',
    titleBooked: 'Nouveau visiteur',
    titleCancelled: 'Réservation annulée',
    leadBooked: 'Une réservation a été enregistrée pour une visite guidée qui passera dans votre galerie.',
    leadCancelled: 'Une réservation de visite guidée a été annulée.',
    sectionVisit: 'La visite',
    sectionVisitor: 'Le visiteur',
    rowRoute: 'Parcours',
    rowGalleries: 'Galeries',
    rowDate: 'Date',
    rowTime: 'Horaire',
    rowVisitor: 'Nom',
    rowGuests: 'Personnes',
    rowLanguage: 'Langue',
    rowEmail: 'Email',
    rowPhone: 'Téléphone',
    rowNotes: 'Notes',
    rowReference: 'Réf.',
    greetingLead: g => `Bonjour ${g},`,
  },
  en: {
    subjectBooked: (g, d, t) => `Irekiak · New booking · ${g} · ${d} ${t}`,
    subjectCancelled: (g, d, t) => `Irekiak · Booking cancelled · ${g} · ${d} ${t}`,
    preheaderBooked: n => `${n} has booked a visit.`,
    preheaderCancelled: n => `${n} has cancelled their booking.`,
    eyebrowBooked: 'Booking',
    eyebrowCancelled: 'Cancellation',
    titleBooked: 'New visitor',
    titleCancelled: 'Booking cancelled',
    leadBooked: 'A new booking has been registered for a guided tour visiting your gallery.',
    leadCancelled: 'A guided tour booking has been cancelled.',
    sectionVisit: 'The visit',
    sectionVisitor: 'The visitor',
    rowRoute: 'Route',
    rowGalleries: 'Galleries',
    rowDate: 'Date',
    rowTime: 'Time',
    rowVisitor: 'Name',
    rowGuests: 'Guests',
    rowLanguage: 'Language',
    rowEmail: 'Email',
    rowPhone: 'Phone',
    rowNotes: 'Notes',
    rowReference: 'Ref.',
    greetingLead: g => `Dear ${g} team,`,
  },
}

export function buildGalleryNotificationEmail(p: GalleryNotificationParams): {
  subject: string
  html: string
  text: string
} {
  const s = locales[p.contactLanguage] ?? locales.en
  const fullName = `${p.booking.firstName} ${p.booking.lastName}`.trim()
  const isBooked = p.action === 'booked'

  const visitRows: DataRow[] = [
    { label: s.rowRoute, value: `<strong style="font-weight:600;">${escapeHtml(p.route.name)}</strong>` },
    { label: s.rowGalleries, value: p.route.galleries.map(g => escapeHtml(g)).join('<br/>') },
    { label: s.rowDate, value: escapeHtml(p.slot.date) },
    { label: s.rowTime, value: `${escapeHtml(p.slot.startTime)}&nbsp;—&nbsp;${escapeHtml(p.slot.endTime)}` },
  ]

  const visitorRows: DataRow[] = [
    { label: s.rowVisitor, value: `<strong style="font-weight:600;">${escapeHtml(fullName)}</strong>` },
    { label: s.rowGuests, value: String(p.booking.numberOfPeople) },
    { label: s.rowLanguage, value: escapeHtml(p.booking.language.toUpperCase()) },
    {
      label: s.rowEmail,
      value: `<a href="mailto:${escapeHtml(p.booking.email)}" style="color:#F5F1E8;text-decoration:underline;">${escapeHtml(p.booking.email)}</a>`,
    },
  ]
  if (p.booking.phone) {
    visitorRows.push({
      label: s.rowPhone,
      value: `<a href="tel:${escapeHtml(p.booking.phone)}" style="color:#F5F1E8;text-decoration:underline;">${escapeHtml(p.booking.phone)}</a>`,
    })
  }
  if (p.booking.specialNeeds) {
    visitorRows.push({ label: s.rowNotes, value: escapeHtml(p.booking.specialNeeds) })
  }
  visitorRows.push({ label: s.rowReference, value: escapeHtml(p.booking.id), mono: true })

  const eyebrow = isBooked ? s.eyebrowBooked : s.eyebrowCancelled
  const title = isBooked ? s.titleBooked : s.titleCancelled
  const lead = isBooked ? s.leadBooked : s.leadCancelled

  const subject = isBooked
    ? s.subjectBooked(p.galleryName, p.slot.date, p.slot.startTime)
    : s.subjectCancelled(p.galleryName, p.slot.date, p.slot.startTime)

  const preheader = isBooked ? s.preheaderBooked(fullName) : s.preheaderCancelled(fullName)

  const galeristeUrl = buildGaleristeUrl(p.route.id)
  const galeristeCta = galeristeUrl
    ? cta({
        href: galeristeUrl,
        label: galeristeCtaLabels[p.contactLanguage] ?? galeristeCtaLabels.en,
        variant: 'secondary',
      })
    : ''

  const html = shell({
    title,
    preheader,
    lang: p.contactLanguage,
    body: [
      header({}),
      hero({ eyebrow, title, lead }),
      paragraph({ text: s.greetingLead(p.galleryName), muted: true }),
      dataTable({ title: s.sectionVisit, rows: visitRows }),
      dataTable({ title: s.sectionVisitor, rows: visitorRows }),
      galeristeCta,
      footer({ locale: p.contactLanguage }),
    ].join('\n'),
  })

  const textLines = [
    title.toUpperCase(),
    '',
    lead,
    '',
    `${s.sectionVisit.toUpperCase()}`,
    `${s.rowRoute}: ${p.route.name}`,
    `${s.rowGalleries}: ${p.route.galleries.join(', ')}`,
    `${s.rowDate}: ${p.slot.date}`,
    `${s.rowTime}: ${p.slot.startTime} — ${p.slot.endTime}`,
    '',
    `${s.sectionVisitor.toUpperCase()}`,
    `${s.rowVisitor}: ${fullName}`,
    `${s.rowGuests}: ${p.booking.numberOfPeople}`,
    `${s.rowLanguage}: ${p.booking.language.toUpperCase()}`,
    `${s.rowEmail}: ${p.booking.email}`,
    p.booking.phone ? `${s.rowPhone}: ${p.booking.phone}` : '',
    p.booking.specialNeeds ? `${s.rowNotes}: ${p.booking.specialNeeds}` : '',
    `${s.rowReference}: ${p.booking.id}`,
    '',
    '— Irekiak Gallery Weekend · Donostia / San Sebastián',
  ].filter(Boolean).join('\n')

  return { subject, html, text: textLines }
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
    const { subject, html, text } = buildGalleryNotificationEmail(params)
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
