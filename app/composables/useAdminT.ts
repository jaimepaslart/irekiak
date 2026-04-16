import type { Ref } from 'vue'
import type { TranslatedText } from '#types/gallery'
import fr from '../../i18n/admin/fr.json'
import es from '../../i18n/admin/es.json'

type AdminLocale = 'fr' | 'es'
type Dict = Record<string, unknown>

const dicts: Record<AdminLocale, Dict> = {
  fr: fr as Dict,
  es: es as Dict,
}

function resolveKey(dict: Dict, key: string): string | undefined {
  const parts = key.split('.')
  let node: unknown = dict
  for (const p of parts) {
    if (node && typeof node === 'object' && p in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[p]
    } else {
      return undefined
    }
  }
  return typeof node === 'string' ? node : undefined
}

function interpolate(str: string, params?: Record<string, string | number>): string {
  if (!params) return str
  return str.replace(/\{(\w+)\}/g, (_, name) => {
    const v = params[name]
    return v === undefined || v === null ? `{${name}}` : String(v)
  })
}

const INTL_LOCALE: Record<AdminLocale, string> = { fr: 'fr-FR', es: 'es-ES' }

export function useAdminT(): {
  t: (key: string, params?: Record<string, string | number>) => string
  locale: Ref<AdminLocale>
  setLocale: (loc: AdminLocale) => void
  /** Formate une date ISO (YYYY-MM-DD) via Intl selon la locale admin. Première lettre capitalisée. */
  formatLongDate: (iso: string, options?: Intl.DateTimeFormatOptions) => string
  /** Formate un timestamp ISO complet en { date: "15 avril", time: "14:32" } selon la locale admin. */
  formatShortDateTime: (iso: string) => { date: string, time: string }
  /** Retourne la variante FR ou ES d'un TranslatedText selon la locale admin. */
  localized: (text: TranslatedText) => string
} {
  const cookie = useCookie<AdminLocale>('irekiak_admin_lang', {
    default: () => 'fr',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  })

  const locale = useState<AdminLocale>('adminLocale', () => (cookie.value === 'es' ? 'es' : 'fr'))

  const setLocale = (loc: AdminLocale) => {
    cookie.value = loc
    locale.value = loc
  }

  const t = (key: string, params?: Record<string, string | number>): string => {
    const dict = dicts[locale.value] ?? dicts.fr
    const raw = resolveKey(dict, key) ?? resolveKey(dicts.fr, key)
    if (raw === undefined) return key
    return interpolate(raw, params)
  }

  const defaultLongDate: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }

  // Cache des Intl.DateTimeFormat : (locale + signature d'options) → formatter.
  // Créer un Intl.DateTimeFormat coûte ~50-200 µs ; l'appeler dans un v-for de
  // 50 lignes = 2-10 ms perdus par render. On les ré-utilise donc.
  const formatterCache = new Map<string, Intl.DateTimeFormat>()

  const getFormatter = (loc: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat => {
    const key = `${loc}|${JSON.stringify(options)}`
    let fmt = formatterCache.get(key)
    if (!fmt) {
      fmt = new Intl.DateTimeFormat(loc, options)
      formatterCache.set(key, fmt)
    }
    return fmt
  }

  const formatLongDate = (iso: string, options?: Intl.DateTimeFormatOptions): string => {
    const d = new Date(`${iso}T00:00:00`)
    const intl = getFormatter(INTL_LOCALE[locale.value], options ?? defaultLongDate)
    return intl.format(d).replace(/^./, c => c.toUpperCase())
  }

  // Options constantes hoistées pour ne pas recréer de nouvelle signature à chaque appel
  // (le cache de getFormatter se base sur JSON.stringify des options).
  const shortDateOpts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }
  const shortTimeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }

  const formatShortDateTime = (iso: string): { date: string, time: string } => {
    const ts = Date.parse(iso)
    if (!Number.isFinite(ts)) return { date: iso, time: '' }
    const d = new Date(ts)
    const loc = INTL_LOCALE[locale.value]
    return {
      date: getFormatter(loc, shortDateOpts).format(d),
      time: getFormatter(loc, shortTimeOpts).format(d),
    }
  }

  const localized = (text: TranslatedText): string => text[locale.value]

  return { t, locale, setLocale, formatLongDate, formatShortDateTime, localized }
}
