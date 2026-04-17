import type L from 'leaflet'

export function useLeaflet(): typeof L {
  return useNuxtApp().$L as typeof L
}
