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
