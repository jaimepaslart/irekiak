import type { TourRoute, TourSlot } from '~/types/tour'

export const tourRoutes: TourRoute[] = [
  {
    id: 'route-gros',
    slug: 'gros',
    name: {
      eu: 'Gros',
      es: 'Gros',
      fr: 'Gros',
      en: 'Gros',
    },
    description: {
      eu: 'Gros auzoko galerien ibilbidea: Arteko, Cibrián eta LA Central Art Gallery.',
      es: 'Recorrido por las galerías del barrio de Gros: Arteko, Cibrián y LA Central Art Gallery.',
      fr: 'Parcours des galeries du quartier de Gros : Arteko, Cibrián et LA Central Art Gallery.',
      en: 'A tour through the galleries of the Gros neighborhood: Arteko, Cibrián and LA Central Art Gallery.',
    },
    galleryIds: ['gal-001', 'gal-003', 'gal-005'],
    duration: {
      eu: '1h 30min',
      es: '1h 30min',
      fr: '1h 30min',
      en: '1h 30min',
    },
    distance: {
      eu: '1,5 km',
      es: '1,5 km',
      fr: '1,5 km',
      en: '1.5 km',
    },
    meetingPoint: {
      name: {
        eu: 'Arteko galeriaren aurrean',
        es: 'Frente a la galería Arteko',
        fr: 'Devant la galerie Arteko',
        en: 'In front of Arteko gallery',
      },
      address: 'Calle las Dunas 1, Donostia',
      coordinates: { lat: 43.323260, lng: -1.976246 },
    },
    color: '#e63946',
  },
  {
    id: 'route-vieja-antigua',
    slug: 'parte-vieja-antigua',
    name: {
      eu: 'Parte Zaharra / Antigua',
      es: 'Parte Vieja / Antigua',
      fr: 'Vieille Ville / Antigua',
      en: 'Old Town / Antigua',
    },
    description: {
      eu: 'Parte Zaharratik Antigua auzora: Ekain Arte Lanak eta Arteztu galeria.',
      es: 'Del Casco Viejo al barrio de Antigua: Ekain Arte Lanak y galería Arteztu.',
      fr: 'De la Vieille Ville au quartier d\'Antigua : Ekain Arte Lanak et galerie Arteztu.',
      en: 'From the Old Town to the Antigua neighborhood: Ekain Arte Lanak and Arteztu gallery.',
    },
    galleryIds: ['gal-004', 'gal-002'],
    duration: {
      eu: '1h 45min',
      es: '1h 45min',
      fr: '1h 45min',
      en: '1h 45min',
    },
    distance: {
      eu: '2,5 km',
      es: '2,5 km',
      fr: '2,5 km',
      en: '2.5 km',
    },
    meetingPoint: {
      name: {
        eu: 'Ekain galeriaren aurrean',
        es: 'Frente a la galería Ekain',
        fr: 'Devant la galerie Ekain',
        en: 'In front of Ekain gallery',
      },
      address: 'Iñigo Kalea 4, Donostia',
      coordinates: { lat: 43.323835, lng: -1.984397 },
    },
    color: '#457b9d',
  },
  {
    id: 'route-egia',
    slug: 'egia',
    name: {
      eu: 'Egia',
      es: 'Egia',
      fr: 'Egia',
      en: 'Egia',
    },
    description: {
      eu: 'Egia auzoko ibilbidea: SakanaGallery eta Tabakalera.',
      es: 'Recorrido por el barrio de Egia: SakanaGallery y Tabakalera.',
      fr: 'Parcours dans le quartier d\'Egia : SakanaGallery et Tabakalera.',
      en: 'A tour through the Egia neighborhood: SakanaGallery and Tabakalera.',
    },
    galleryIds: ['gal-006', 'gal-007'],
    duration: {
      eu: '1h',
      es: '1h',
      fr: '1h',
      en: '1h',
    },
    distance: {
      eu: '0,8 km',
      es: '0,8 km',
      fr: '0,8 km',
      en: '0.8 km',
    },
    meetingPoint: {
      name: {
        eu: 'SakanaGallery-ren aurrean',
        es: 'Frente a SakanaGallery',
        fr: 'Devant SakanaGallery',
        en: 'In front of SakanaGallery',
      },
      address: 'Alkolea Pasaia 1, Donostia',
      coordinates: { lat: 43.316202, lng: -1.974398 },
    },
    color: '#2a9d8f',
  },
]

// Generator: Saturday 30 May + Sunday 31 May 2026
// 3 time windows × 3 routes × 4 languages = 36 slots
function buildSlots(): TourSlot[] {
  const routes: TourSlot['routeId'][] = ['route-gros', 'route-vieja-antigua', 'route-egia']
  const routeSuffix: Record<string, string> = {
    'route-gros': 'gros',
    'route-vieja-antigua': 'vieja',
    'route-egia': 'egia',
  }
  const languages: TourSlot['language'][] = ['eu', 'es', 'fr', 'en']
  const windows = [
    { key: 'sat-1100', date: '2026-05-30', startTime: '11:00', endTime: '12:30' },
    { key: 'sat-1700', date: '2026-05-30', startTime: '17:00', endTime: '18:30' },
    { key: 'sun-1100', date: '2026-05-31', startTime: '11:00', endTime: '12:30' },
  ]

  const slots: TourSlot[] = []
  for (const w of windows) {
    for (const r of routes) {
      for (const lang of languages) {
        slots.push({
          id: `slot-${w.key}-${routeSuffix[r]}-${lang}`,
          routeId: r,
          date: w.date,
          startTime: w.startTime,
          endTime: w.endTime,
          maxParticipants: 12,
          language: lang,
        })
      }
    }
  }
  return slots
}

export const tourSlots: TourSlot[] = buildSlots()
