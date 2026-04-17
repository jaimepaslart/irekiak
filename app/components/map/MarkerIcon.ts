import L from 'leaflet'

export function createGalleryMarker(galleryName: string, color: string = '#FFFFFF') {
  const initial = galleryName.charAt(0).toUpperCase()
  return L.divIcon({
    className: 'gallery-marker',
    html: `
      <div class="relative flex items-center justify-center w-10 h-10">
        <div class="absolute w-10 h-10 rounded-full animate-ping opacity-30" style="background-color: ${color}"></div>
        <div class="relative w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs font-bold text-white" style="background-color: ${color}">
          ${initial}
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  })
}

export function createUserLocationMarker() {
  return L.divIcon({
    className: 'user-location-marker',
    html: `
      <div class="relative flex items-center justify-center w-5 h-5">
        <div class="absolute w-5 h-5 rounded-full bg-sky-400/30 animate-ping"></div>
        <div class="relative w-3 h-3 rounded-full bg-sky-400 ring-2 ring-white shadow-md"></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}
