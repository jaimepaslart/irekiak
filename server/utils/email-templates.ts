/**
 * Email design system — Irekiak Gallery Weekend
 *
 * Editorial museum-invitation aesthetic. Prussian Blue background, cream
 * primary text, sparing gold accent for CTAs and eyebrow labels. Components
 * are rendered with inline styles + table-based layout for maximum email
 * client compatibility (Gmail Web, Apple Mail, Outlook 365, iOS Mail).
 *
 * Composition pattern:
 *   shell({ title, body: header() + hero() + dataTable() + cta() + footer() })
 */

export interface BrandTokens {
  colors: {
    bg: string
    bgSubtle: string
    text: string
    textMuted: string
    textDim: string
    accent: string
    border: string
    ctaBg: string
    ctaText: string
  }
  fonts: {
    sans: string
    serif: string
    mono: string
  }
  layout: {
    containerWidth: number
    padding: number
  }
}

export const tokens: BrandTokens = {
  colors: {
    bg: '#003153',
    bgSubtle: '#002a48',
    text: '#F5F1E8',
    textMuted: 'rgba(245, 241, 232, 0.65)',
    textDim: 'rgba(245, 241, 232, 0.45)',
    accent: '#D4B062',
    border: 'rgba(245, 241, 232, 0.12)',
    ctaBg: '#F5F1E8',
    ctaText: '#003153',
  },
  fonts: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
    serif: "'Playfair Display', Georgia, 'Times New Roman', serif",
    mono: "'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, monospace",
  },
  layout: {
    containerWidth: 560,
    padding: 40,
  },
}

const EVENT_DATES = '29 — 31 MAI 2026'
const LOGO_URL = 'https://irekiak.art/logo-email-bg.png'
const SITE_URL = 'https://irekiak.art'

export function escapeHtml(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ---------- SHELL ----------

interface ShellOpts {
  title: string
  body: string
  preheader?: string
  lang?: string
}

export function shell(opts: ShellOpts): string {
  const { title, body, preheader = '', lang = 'fr' } = opts
  const t = tokens
  return `<!doctype html>
<html lang="${escapeHtml(lang)}" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="dark light" />
  <meta name="supported-color-schemes" content="dark light" />
  <title>${escapeHtml(title)}</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; display: block; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    a { color: ${t.colors.text}; }
    .preheader { display:none !important; visibility:hidden; mso-hide:all; font-size:1px; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; max-width: 100% !important; }
      .px { padding-left: 24px !important; padding-right: 24px !important; }
      .py { padding-top: 32px !important; padding-bottom: 32px !important; }
      .h1 { font-size: 26px !important; line-height: 1.2 !important; }
      .h2 { font-size: 17px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${t.colors.bg};">
  <div class="preheader">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${t.colors.bg};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" class="container" width="${t.layout.containerWidth}" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:${t.layout.containerWidth}px;background-color:${t.colors.bg};">
          ${body}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ---------- HEADER ----------

interface HeaderOpts {
  dates?: string
}

export function header(opts: HeaderOpts = {}): string {
  const { dates = EVENT_DATES } = opts
  const t = tokens
  return `<tr>
  <td class="px py" align="center" bgcolor="${t.colors.bg}" style="padding:8px ${t.layout.padding}px 32px ${t.layout.padding}px;background-color:${t.colors.bg};">
    <a href="${SITE_URL}" style="text-decoration:none;color:${t.colors.text};">
      <img src="${LOGO_URL}" width="240" alt="IREKIAK · Gallery Weekend Donostia · San Sebastián" border="0" style="display:block;width:240px;max-width:70%;height:auto;margin:0 auto;border:0;outline:none;text-decoration:none;background:${t.colors.bg};" />
    </a>
    <p style="margin:18px 0 0 0;font-family:${t.fonts.sans};font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:${t.colors.accent};font-feature-settings:'tnum';">
      ${escapeHtml(dates)}
    </p>
    <p style="margin:6px 0 0 0;font-family:${t.fonts.sans};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${t.colors.textMuted};">
      Donostia &middot; San Sebastián
    </p>
  </td>
</tr>`
}

// ---------- HERO ----------

interface HeroOpts {
  eyebrow?: string
  title: string
  lead?: string
}

export function hero(opts: HeroOpts): string {
  const t = tokens
  const eyebrow = opts.eyebrow
    ? `<p style="margin:0 0 18px 0;font-family:${t.fonts.sans};font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:${t.colors.accent};">${escapeHtml(opts.eyebrow)}</p>`
    : ''
  const lead = opts.lead
    ? `<p style="margin:18px 0 0 0;font-family:${t.fonts.sans};font-size:15px;line-height:1.6;color:${t.colors.textMuted};">${escapeHtml(opts.lead)}</p>`
    : ''
  return `<tr>
  <td class="px" style="padding:0 ${t.layout.padding}px 36px ${t.layout.padding}px;border-top:1px solid ${t.colors.border};padding-top:36px;">
    ${eyebrow}
    <h1 class="h1" style="margin:0;font-family:${t.fonts.serif};font-size:30px;line-height:1.15;font-weight:400;color:${t.colors.text};letter-spacing:-0.01em;">
      ${escapeHtml(opts.title)}
    </h1>
    ${lead}
  </td>
</tr>`
}

// ---------- DATA TABLE ----------

export interface DataRow {
  label: string
  value: string
  mono?: boolean
}

interface DataTableOpts {
  rows: DataRow[]
  title?: string
}

export function dataTable(opts: DataTableOpts): string {
  const t = tokens
  const titleHtml = opts.title
    ? `<p class="h2" style="margin:0 0 18px 0;font-family:${t.fonts.sans};font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:${t.colors.textMuted};font-weight:600;">${escapeHtml(opts.title)}</p>`
    : ''

  const rowsHtml = opts.rows.map((row, idx) => {
    const isLast = idx === opts.rows.length - 1
    const valueStyle = row.mono
      ? `font-family:${t.fonts.mono};font-size:12px;letter-spacing:0.04em;`
      : `font-family:${t.fonts.sans};font-size:14px;font-feature-settings:'tnum';`
    const borderBottom = isLast ? '' : `border-bottom:1px solid ${t.colors.border};`
    return `<tr>
  <td valign="top" style="padding:14px 0;${borderBottom}width:38%;font-family:${t.fonts.sans};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${t.colors.textMuted};font-weight:500;">
    ${escapeHtml(row.label)}
  </td>
  <td valign="top" align="right" style="padding:14px 0;${borderBottom}color:${t.colors.text};${valueStyle}">
    ${row.value}
  </td>
</tr>`
  }).join('\n')

  return `<tr>
  <td class="px" style="padding:0 ${t.layout.padding}px 36px ${t.layout.padding}px;">
    ${titleHtml}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-top:1px solid ${t.colors.border};">
      ${rowsHtml}
    </table>
  </td>
</tr>`
}

// ---------- CTA ----------

interface CtaOpts {
  href: string
  label: string
  variant?: 'primary' | 'secondary'
}

export function cta(opts: CtaOpts): string {
  const t = tokens
  const variant = opts.variant ?? 'primary'
  const bg = variant === 'primary' ? t.colors.ctaBg : 'transparent'
  const fg = variant === 'primary' ? t.colors.ctaText : t.colors.text
  const border = variant === 'primary' ? t.colors.ctaBg : t.colors.text
  return `<tr>
  <td class="px" align="center" style="padding:0 ${t.layout.padding}px 36px ${t.layout.padding}px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="border-radius:2px;background-color:${bg};">
          <a href="${escapeHtml(opts.href)}"
             style="display:inline-block;padding:16px 32px;font-family:${t.fonts.sans};font-size:12px;letter-spacing:0.22em;text-transform:uppercase;font-weight:600;color:${fg};text-decoration:none;border:1px solid ${border};border-radius:2px;">
            ${escapeHtml(opts.label)}
          </a>
        </td>
      </tr>
    </table>
  </td>
</tr>`
}

// ---------- DIVIDER ----------

export function divider(): string {
  const t = tokens
  return `<tr>
  <td class="px" style="padding:0 ${t.layout.padding}px;">
    <div style="border-top:1px solid ${t.colors.border};line-height:0;font-size:0;">&nbsp;</div>
  </td>
</tr>`
}

// ---------- PARAGRAPH ----------

interface ParagraphOpts {
  text: string
  muted?: boolean
  html?: boolean
}

export function paragraph(opts: ParagraphOpts): string {
  const t = tokens
  const color = opts.muted ? t.colors.textMuted : t.colors.text
  const inner = opts.html ? opts.text : escapeHtml(opts.text)
  return `<tr>
  <td class="px" style="padding:0 ${t.layout.padding}px 28px ${t.layout.padding}px;">
    <p style="margin:0;font-family:${t.fonts.sans};font-size:14px;line-height:1.65;color:${color};">
      ${inner}
    </p>
  </td>
</tr>`
}

// ---------- FOOTER ----------

const footerStrings: Record<'eu' | 'es' | 'fr' | 'en', { event: string, location: string, unsubscribe: string, privacyLabel: string }> = {
  eu: {
    event: 'Irekiak Gallery Weekend',
    location: '8 galeria · Donostia · San Sebastián',
    unsubscribe: 'Harpidetza utzi',
    privacyLabel: 'Pribatutasun politika',
  },
  es: {
    event: 'Irekiak Gallery Weekend',
    location: '8 galerías · Donostia · San Sebastián',
    unsubscribe: 'Darse de baja',
    privacyLabel: 'Política de privacidad',
  },
  fr: {
    event: 'Irekiak Gallery Weekend',
    location: '8 galeries · Donostia · San Sebastián',
    unsubscribe: 'Se désabonner',
    privacyLabel: 'Politique de confidentialité',
  },
  en: {
    event: 'Irekiak Gallery Weekend',
    location: '8 galleries · Donostia · San Sebastián',
    unsubscribe: 'Unsubscribe',
    privacyLabel: 'Privacy policy',
  },
}

interface FooterOpts {
  unsubscribeUrl?: string
  locale: 'eu' | 'es' | 'fr' | 'en'
  dates?: string
}

export function footer(opts: FooterOpts): string {
  const t = tokens
  const s = footerStrings[opts.locale] ?? footerStrings.en
  const dates = opts.dates ?? EVENT_DATES
  const unsubscribeLink = opts.unsubscribeUrl
    ? `&nbsp;&middot;&nbsp;<a href="${escapeHtml(opts.unsubscribeUrl)}" style="color:${t.colors.textDim};text-decoration:underline;">${escapeHtml(s.unsubscribe)}</a>`
    : ''
  return `<tr>
  <td class="px" style="padding:8px ${t.layout.padding}px 40px ${t.layout.padding}px;border-top:1px solid ${t.colors.border};padding-top:32px;">
    <p style="margin:0;font-family:${t.fonts.sans};font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${t.colors.textMuted};">
      ${escapeHtml(s.event)}
    </p>
    <p style="margin:6px 0 0 0;font-family:${t.fonts.sans};font-size:11px;letter-spacing:0.04em;color:${t.colors.textDim};">
      ${escapeHtml(dates)} &middot; ${escapeHtml(s.location)}
    </p>
    <p style="margin:14px 0 0 0;font-family:${t.fonts.sans};font-size:11px;color:${t.colors.textDim};">
      <a href="${SITE_URL}" style="color:${t.colors.textDim};text-decoration:none;">irekiak.eus</a>${unsubscribeLink}
    </p>
  </td>
</tr>`
}

// ---------- SECTION (semantic wrapper for raw HTML) ----------

interface SectionOpts {
  html: string
  paddingBottom?: number
}

export function section(opts: SectionOpts): string {
  const t = tokens
  const pb = opts.paddingBottom ?? 36
  return `<tr>
  <td class="px" style="padding:0 ${t.layout.padding}px ${pb}px ${t.layout.padding}px;">
    ${opts.html}
  </td>
</tr>`
}
