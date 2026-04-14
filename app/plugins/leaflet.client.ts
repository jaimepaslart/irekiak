import L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet-gesture-handling'
import { locate as locateControl, LocateControl } from 'leaflet.locatecontrol'
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch'

// leaflet.locatecontrol v0.89+ ne patch plus L.control.locate automatiquement (breaking change).
// On restaure manuellement l'API retrocompatible.
;(L.Control as unknown as { Locate: typeof LocateControl }).Locate = LocateControl
;(L.control as unknown as { locate: typeof locateControl }).locate = locateControl

// Fix default icon paths (Leaflet icon bug with bundlers)
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default defineNuxtPlugin(() => {
  return {
    provide: { L, GeoSearchControl, OpenStreetMapProvider },
  }
})
