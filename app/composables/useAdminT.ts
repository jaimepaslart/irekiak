import type { Ref } from 'vue'
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

export function useAdminT(): {
  t: (key: string, params?: Record<string, string | number>) => string
  locale: Ref<AdminLocale>
  setLocale: (loc: AdminLocale) => void
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

  return { t, locale, setLocale }
}
