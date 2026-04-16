import type { Ref } from 'vue'

interface AuthedFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: Record<string, unknown> | null
  headers?: Record<string, string>
  query?: Record<string, string | number | boolean | undefined>
}

export interface UseGaleristeReturn {
  token: Ref<string | null>
  setToken: (value: string) => void
  clearToken: () => void
  authedFetch: <T>(url: string, opts?: AuthedFetchOptions) => Promise<T>
}

export function useGaleriste(routeSlug: string): UseGaleristeReturn {
  const KEY = `irekiak_galeriste_key_${routeSlug}`
  const token = useState<string | null>(`gal-${routeSlug}`, () => null)

  if (typeof window !== 'undefined' && !token.value) {
    const stored = window.localStorage.getItem(KEY)
    if (stored) token.value = stored
  }

  function setToken(value: string): void {
    token.value = value
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(KEY, value)
    }
  }

  function clearToken(): void {
    token.value = null
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(KEY)
    }
  }

  async function authedFetch<T>(url: string, opts: AuthedFetchOptions = {}): Promise<T> {
    const fetchOpts = {
      ...opts,
      headers: {
        ...(opts.headers ?? {}),
        'x-galeriste-key': token.value ?? '',
      },
    } as Parameters<typeof $fetch>[1]
    const res = await $fetch(url, fetchOpts)
    return res as T
  }

  return { token, setToken, clearToken, authedFetch }
}
