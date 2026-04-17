<script setup lang="ts">
import { galleries } from '@data/galleries'
import { tourRoutes } from '@data/tours'
import { createGalleryMarker } from '~/components/map/MarkerIcon'
import type { Map as LeafletMap, Marker, Polyline } from 'leaflet'

const { t } = useI18n()
const localePath = useLocalePath()
const tr = useTranslated()

usePageSeo('map')

// Center on Donostia
const MAP_CENTER: [number, number] = [43.32, -1.98]
const MAP_ZOOM = 15

const selectedGallery = ref<string | null>(null)
const mapContainer = ref<HTMLElement | null>(null)
const mobileSheetOpen = ref(false)
const showIntro = ref(true)

let map: LeafletMap | null = null
const markersByGalleryId = new Map<string, Marker>()
const polylines: Polyline[] = []
let userMarker: Marker | null = null
const isLocating = ref(false)

/**
 * Returns the color of the first tour route that contains this gallery.
 * Defaults to white if no route references it.
 */
function getGalleryColor(galleryId: string): string {
  const route = tourRoutes.find(r => r.galleryIds.includes(galleryId))
  return route?.color ?? '#FFFFFF'
}

function locateMe() {
  if (!navigator.geolocation || !map) {
    alert(t('map.locateError'))
    return
  }
  isLocating.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      isLocating.value = false
      if (!map) return
      const { latitude, longitude } = pos.coords
      const { $L } = useNuxtApp()
      const L = $L as typeof import('leaflet')
      if (userMarker) {
        userMarker.setLatLng([latitude, longitude])
      }
      else {
        userMarker = L.marker([latitude, longitude], {
          icon: L.divIcon({
            className: 'user-location-marker',
            html: '<div class="relative flex items-center justify-center w-5 h-5"><div class="absolute w-5 h-5 rounded-full bg-sky-400/30 animate-ping"></div><div class="relative w-3 h-3 rounded-full bg-sky-400 ring-2 ring-white shadow-md"></div></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          }),
          interactive: false,
        }).addTo(map)
      }
      map.flyTo([latitude, longitude], 16, { duration: 0.8 })
    },
    () => {
      isLocating.value = false
      alert(t('map.locateError'))
    },
    { enableHighAccuracy: true, timeout: 10_000 },
  )
}

function directionsHref(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}

function selectGallery(id: string) {
  const wasSelected = selectedGallery.value === id
  selectedGallery.value = wasSelected ? null : id

  if (!wasSelected && map) {
    const gallery = galleries.find(g => g.id === id)
    if (gallery) {
      map.flyTo([gallery.coordinates.lat, gallery.coordinates.lng], 17, {
        duration: 0.8,
      })
      const marker = markersByGalleryId.get(id)
      marker?.openPopup()
    }
    // Close the mobile sheet so the selected gallery is actually visible on the map.
    mobileSheetOpen.value = false
  }
}

function buildPopupHtml(galleryId: string): string {
  const gallery = galleries.find(g => g.id === galleryId)
  if (!gallery) return ''
  const detailHref = localePath(`/galleries/${gallery.slug}`)
  const learnMore = t('common.learnMore')
  return `
    <div class="font-sans text-sm min-w-[200px]">
      <h3 class="font-bold text-base mb-1">${gallery.name}</h3>
      <p class="text-xs opacity-70 mb-1">${gallery.address}</p>
      <p class="text-xs opacity-70 mb-2">${tr(gallery.openingHours)}</p>
      <a href="${detailHref}" class="text-xs font-medium underline">${learnMore} &rarr;</a>
    </div>
  `
}

onMounted(async () => {
  // Hide the intro card after 3 seconds
  setTimeout(() => { showIntro.value = false }, 3000)

  // Wait for the ClientOnly wrapper to render the container
  await nextTick()
  if (!mapContainer.value) return

  const { $L } = useNuxtApp()
  const L = $L as typeof import('leaflet')

  map = L.map(mapContainer.value, {
    center: MAP_CENTER,
    zoom: MAP_ZOOM,
    zoomControl: false,
    attributionControl: false,
  })

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
    subdomains: 'abcd',
    maxZoom: 20,
  }).addTo(map)

  // Tour route polylines
  for (const route of tourRoutes) {
    const latlngs = route.galleryIds
      .map((gid) => {
        const g = galleries.find(x => x.id === gid)
        return g ? [g.coordinates.lat, g.coordinates.lng] as [number, number] : null
      })
      .filter((v): v is [number, number] => v !== null)

    if (latlngs.length >= 2) {
      const pl = L.polyline(latlngs, {
        color: route.color,
        weight: 4,
        opacity: 0.75,
        dashArray: '6, 8',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map)
      polylines.push(pl)
    }
  }

  // Marker cluster group
  // @ts-expect-error markerClusterGroup is added by leaflet.markercluster
  const cluster = L.markerClusterGroup({
    showCoverageOnHover: false,
    spiderfyOnMaxZoom: true,
    maxClusterRadius: 40,
  })

  // Gallery markers
  for (const gallery of galleries) {
    const color = getGalleryColor(gallery.id)
    const marker = L.marker(
      [gallery.coordinates.lat, gallery.coordinates.lng],
      { icon: createGalleryMarker(gallery.name, color) },
    )
    marker.bindPopup(buildPopupHtml(gallery.id))
    marker.on('click', () => {
      selectedGallery.value = gallery.id
    })
    markersByGalleryId.set(gallery.id, marker)
    cluster.addLayer(marker)
  }

  map.addLayer(cluster)
})

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
  markersByGalleryId.clear()
  polylines.length = 0
  userMarker = null
})
</script>

<template>
  <div class="flex flex-col md:flex-row min-h-[calc(100vh-4rem)] pt-16">
    <!-- Sidebar (desktop always visible · mobile full overlay toggled by FAB) -->
    <aside
      class="md:w-80 md:shrink-0 border-r border-white/10 bg-edition-dark overflow-y-auto transition-transform md:translate-y-0 md:static md:block md:[animation:fade-in-right_500ms_cubic-bezier(0.23,1,0.32,1)_forwards]"
      :class="[
        'fixed md:relative inset-0 z-[1001]',
        mobileSheetOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0',
      ]"
    >
      <!-- Mobile close button -->
      <button
        type="button"
        class="md:hidden absolute top-4 right-4 p-2 text-white/60 hover:text-white"
        :aria-label="t('common.close')"
        @click="mobileSheetOpen = false"
      >
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <div class="p-6">
        <h1 class="hidden md:block text-xl font-bold mb-6">{{ t('nav.map') }}</h1>

        <!-- Routes legend -->
        <div class="mb-6">
          <p class="text-xs uppercase tracking-wider text-white/40 font-mono mb-3">{{ t('map.routes') }}</p>
          <div class="space-y-2">
            <div v-for="route in tourRoutes" :key="route.id" class="group flex items-center gap-2 cursor-default">
              <span class="w-2.5 h-2.5 rounded-full shrink-0 transition-transform duration-300 group-hover:scale-150" :style="{ backgroundColor: route.color }" />
              <span class="text-sm text-white/70 group-hover:text-white transition-colors">{{ tr(route.name) }}</span>
            </div>
          </div>
        </div>

        <!-- Gallery list -->
        <p class="text-xs uppercase tracking-wider text-white/40 font-mono mb-3">{{ t('nav.galleries') }}</p>
        <ul class="space-y-1">
          <li v-for="gallery in galleries" :key="gallery.id">
            <button
              class="w-full text-left px-3 py-2.5 text-sm rounded-sm transition-all duration-200 flex items-start gap-2"
              :class="selectedGallery === gallery.id
                ? 'bg-white/15 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/5'"
              @click="selectGallery(gallery.id)"
            >
              <span
                class="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5"
                :style="{ backgroundColor: getGalleryColor(gallery.id) }"
              />
              <span class="flex-1">
                <span class="block font-medium">{{ gallery.name }}</span>
                <span class="block text-xs text-white/40 mt-0.5">{{ gallery.address }}</span>
              </span>
            </button>
          </li>
        </ul>

        <footer class="mt-8 pt-4 border-t border-white/5 text-[10px] text-white/25 font-mono leading-relaxed">
          ©
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener" class="hover:text-white/50 underline-offset-2 hover:underline">OpenStreetMap</a>
          · ©
          <a href="https://carto.com/attributions" target="_blank" rel="noopener" class="hover:text-white/50 underline-offset-2 hover:underline">CARTO</a>
        </footer>
      </div>
    </aside>

    <!-- Map area -->
    <div class="flex-1 relative bg-edition-dark min-h-[60vh]">
      <ClientOnly>
        <div ref="mapContainer" class="absolute inset-0" />
        <template #fallback>
          <div class="absolute inset-0 flex items-center justify-center">
            <p class="text-white/40 font-mono text-sm">{{ t('common.loading') }}</p>
          </div>
        </template>
      </ClientOnly>

      <!-- Locate me button (top-right overlay) -->
      <button
        type="button"
        class="absolute top-4 right-4 z-[999] w-11 h-11 rounded-full bg-[var(--color-edition)]/90 backdrop-blur-sm border border-white/15 text-white shadow-lg flex items-center justify-center hover:bg-[var(--color-edition)] transition-colors disabled:opacity-60"
        :aria-label="t('map.locate')"
        :title="isLocating ? t('map.locating') : t('map.locate')"
        :disabled="isLocating"
        @click="locateMe"
      >
        <svg v-if="!isLocating" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <circle cx="12" cy="12" r="8" />
          <line x1="12" y1="2" x2="12" y2="4" />
          <line x1="12" y1="20" x2="12" y2="22" />
          <line x1="2" y1="12" x2="4" y2="12" />
          <line x1="20" y1="12" x2="22" y2="12" />
        </svg>
        <span v-else class="inline-block w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
      </button>

      <!-- Intro card (fades out after 3s) -->
      <Transition name="fade-intro">
        <div
          v-if="showIntro"
          class="hidden md:block absolute top-6 left-1/2 -translate-x-1/2 z-[999] pointer-events-none"
        >
          <div class="glass-strong px-6 py-3 rounded-sm">
            <p class="text-xs uppercase tracking-[0.2em] text-white/70 font-mono whitespace-nowrap">
              {{ galleries.length }} {{ t('nav.galleries') }} &middot; {{ tourRoutes.length }} {{ t('map.routesSuffix') }} &middot; Donostia
            </p>
          </div>
        </div>
      </Transition>

      <!-- Mobile FAB to toggle sidebar -->
      <button
        v-if="!mobileSheetOpen"
        class="md:hidden fixed bottom-6 right-6 z-[1000] w-14 h-14 rounded-full bg-white text-[var(--color-edition)] shadow-lg flex items-center justify-center scale-press"
        :aria-label="t('nav.galleries')"
        @click="mobileSheetOpen = true"
      >
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      </button>

      <!-- Gallery info panel (when selected) -->
      <Transition name="slide">
        <div
          v-if="selectedGallery"
          class="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-80 z-[1000]
                 bg-[var(--color-edition)]/95 backdrop-blur-sm border border-white/15 rounded-sm p-5"
        >
          <template v-for="gallery in galleries" :key="gallery.id">
            <div v-if="gallery.id === selectedGallery">
              <div class="flex justify-between items-start mb-3">
                <h3 class="text-lg font-bold text-white">{{ gallery.name }}</h3>
                <button class="text-white/40 hover:text-white text-lg" @click="selectedGallery = null">&times;</button>
              </div>
              <p class="text-sm text-white/60 mb-2">{{ gallery.address }}</p>
              <p class="text-sm text-white/60 mb-4">{{ tr(gallery.openingHours) }}</p>
              <div class="flex flex-wrap items-center gap-x-5 gap-y-2">
                <NuxtLink
                  :to="localePath(`/galleries/${gallery.slug}`)"
                  class="text-sm text-white hover:text-white/80 transition-colors"
                >
                  {{ t('common.learnMore') }} &rarr;
                </NuxtLink>
                <a
                  :href="directionsHref(gallery.coordinates.lat, gallery.coordinates.lng)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-sm text-sky-300 hover:text-sky-200 transition-colors inline-flex items-center gap-1.5"
                >
                  {{ t('map.directions') }}
                  <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M7 17L17 7" />
                    <path d="M7 7h10v10" />
                  </svg>
                </a>
              </div>
            </div>
          </template>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 200ms ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(1rem);
}

.fade-intro-enter-active {
  transition: all 400ms cubic-bezier(0.23, 1, 0.32, 1);
}
.fade-intro-leave-active {
  transition: all 600ms cubic-bezier(0.23, 1, 0.32, 1);
}
.fade-intro-enter-from,
.fade-intro-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px);
}
</style>

<style>
/* Leaflet marker custom styles (not scoped so they apply to divIcon HTML) */
.gallery-marker {
  background: transparent;
  border: none;
}

/* Popup styling aligned with violet theme */
.leaflet-popup-content-wrapper {
  background-color: #003153;
  color: #ffffff;
  border-radius: 2px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}
.leaflet-popup-content {
  margin: 12px 14px;
  color: #ffffff;
}
.leaflet-popup-content a {
  color: #ffffff;
}
.leaflet-popup-tip {
  background-color: #003153;
}
.leaflet-popup-close-button {
  color: rgba(255, 255, 255, 0.7) !important;
}

/* Controls dark style */
.leaflet-bar a,
.leaflet-bar a:hover {
  background-color: #003153;
  color: #ffffff;
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

/* GeoSearch bar */
.leaflet-control-geosearch form {
  background-color: #003153;
  border-color: rgba(255, 255, 255, 0.15);
}
.leaflet-control-geosearch form input {
  color: #ffffff;
  background-color: #003153;
}
.leaflet-control-geosearch form input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}
.leaflet-control-geosearch .results > * {
  background-color: #003153;
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.1);
}
.leaflet-control-geosearch .results > *:hover,
.leaflet-control-geosearch .results > .active {
  background-color: rgba(255, 255, 255, 0.15);
}

/* Marker cluster (violet tint) */
.marker-cluster-small,
.marker-cluster-medium,
.marker-cluster-large {
  background-color: rgba(78, 0, 65, 0.6);
}
.marker-cluster-small div,
.marker-cluster-medium div,
.marker-cluster-large div {
  background-color: #003153;
  color: #ffffff;
  font-weight: 600;
}

/* Gesture handling message overlay */
.leaflet-gesture-handling-touch-warning,
.leaflet-gesture-handling-scroll-warning {
  background-color: rgba(78, 0, 65, 0.85) !important;
  color: #ffffff !important;
}
</style>
