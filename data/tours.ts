import type { TourRoute, TourSlot } from '#types/tour'

// Irekiak 2026 — 3 itinéraires de 2 galeries, guidés par Rita (Paolita + Nora)
// Samedi 30 mai : 11h30 + 17h00
// Dimanche 31 mai : 11h30
// Langues : eu + es uniquement pour l'édition 2026

export const tourRoutes: TourRoute[] = [
  {
    id: 'route-arteko-cibrian',
    slug: 'arteko-cibrian',
    name: {
      eu: 'Arteko - Cibrián',
      es: 'Arteko - Cibrián',
      fr: 'Arteko - Cibrián',
      en: 'Arteko - Cibrián',
    },
    description: {
      eu: 'Gros auzoko bi galerietan zeharreko ibilbidea: Arteko eta Cibrián.',
      es: 'Recorrido por dos galerías del barrio de Gros: Arteko y Cibrián.',
      fr: 'Parcours dans deux galeries du quartier de Gros : Arteko et Cibrián.',
      en: 'A tour of two galleries in the Gros neighborhood: Arteko and Cibrián.',
    },
    galleryIds: ['gal-001', 'gal-003'],
    duration: {
      eu: '1h 30min',
      es: '1h 30min',
      fr: '1h 30min',
      en: '1h 30min',
    },
    distance: {
      eu: '0,6 km',
      es: '0,6 km',
      fr: '0,6 km',
      en: '0.6 km',
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
    id: 'route-central-sakana',
    slug: 'la-central-sakana',
    name: {
      eu: 'La Central - Sakana',
      es: 'La Central - Sakana',
      fr: 'La Central - Sakana',
      en: 'La Central - Sakana',
    },
    description: {
      eu: 'Gros-Egia arteko ibilbidea: LA Central Art Gallery eta SakanaGallery.',
      es: 'Recorrido Gros-Egia: LA Central Art Gallery y SakanaGallery.',
      fr: 'Parcours Gros-Egia : LA Central Art Gallery et SakanaGallery.',
      en: 'Gros to Egia route: LA Central Art Gallery and SakanaGallery.',
    },
    galleryIds: ['gal-005', 'gal-006'],
    duration: {
      eu: '1h 30min',
      es: '1h 30min',
      fr: '1h 30min',
      en: '1h 30min',
    },
    distance: {
      eu: '0,8 km',
      es: '0,8 km',
      fr: '0,8 km',
      en: '0.8 km',
    },
    meetingPoint: {
      name: {
        eu: 'LA Central Art Gallery-ren aurrean',
        es: 'Frente a LA Central Art Gallery',
        fr: 'Devant LA Central Art Gallery',
        en: 'In front of LA Central Art Gallery',
      },
      address: 'Kale Berria 5, Donostia',
      coordinates: { lat: 43.322560, lng: -1.976262 },
    },
    color: '#457b9d',
  },
  {
    id: 'route-arteztu-ekain',
    slug: 'arteztu-ekain',
    name: {
      eu: 'Arteztu - Ekain',
      es: 'Arteztu - Ekain',
      fr: 'Arteztu - Ekain',
      en: 'Arteztu - Ekain',
    },
    description: {
      eu: 'Antigua eta Parte Zaharra arteko ibilbidea: Arteztu eta Ekain Arte Lanak.',
      es: 'Recorrido entre Antigua y Parte Vieja: Arteztu y Ekain Arte Lanak.',
      fr: 'Parcours entre Antigua et la Vieille Ville : Arteztu et Ekain Arte Lanak.',
      en: 'A route between Antigua and the Old Town: Arteztu and Ekain Arte Lanak.',
    },
    galleryIds: ['gal-002', 'gal-004'],
    duration: {
      eu: '1h 45min',
      es: '1h 45min',
      fr: '1h 45min',
      en: '1h 45min',
    },
    distance: {
      eu: '2,8 km',
      es: '2,8 km',
      fr: '2,8 km',
      en: '2.8 km',
    },
    meetingPoint: {
      name: {
        eu: 'Arteztu galeriaren aurrean',
        es: 'Frente a la galería Arteztu',
        fr: 'Devant la galerie Arteztu',
        en: 'In front of Arteztu gallery',
      },
      address: 'Resurrección María de Azkue 12, Donostia',
      coordinates: { lat: 43.310039, lng: -2.009040 },
    },
    color: '#2a9d8f',
  },
]

// Irekiak 2026 — official schedule (Rita x Paolita + Nora)
// Sábado 30/05 11h30  EU : Arteko + Cibrián
//                      ES : La Central + Sakana
// Sábado 30/05 17h00  EU : Arteztu + Ekain
//                      ES : Arteko + Cibrián
// Domingo 31/05 11h30 EU : La Central + Sakana
//                      ES : Arteztu + Ekain

export const tourSlots: TourSlot[] = [
  {
    id: 'slot-sat-1130-ac-eu',
    routeId: 'route-arteko-cibrian',
    date: '2026-05-30',
    startTime: '11:30',
    endTime: '13:00',
    maxParticipants: 12,
    language: 'eu',
  },
  {
    id: 'slot-sat-1130-cs-es',
    routeId: 'route-central-sakana',
    date: '2026-05-30',
    startTime: '11:30',
    endTime: '13:00',
    maxParticipants: 12,
    language: 'es',
  },
  {
    id: 'slot-sat-1700-ae-eu',
    routeId: 'route-arteztu-ekain',
    date: '2026-05-30',
    startTime: '17:00',
    endTime: '18:30',
    maxParticipants: 12,
    language: 'eu',
  },
  {
    id: 'slot-sat-1700-ac-es',
    routeId: 'route-arteko-cibrian',
    date: '2026-05-30',
    startTime: '17:00',
    endTime: '18:30',
    maxParticipants: 12,
    language: 'es',
  },
  {
    id: 'slot-sun-1130-cs-eu',
    routeId: 'route-central-sakana',
    date: '2026-05-31',
    startTime: '11:30',
    endTime: '13:00',
    maxParticipants: 12,
    language: 'eu',
  },
  {
    id: 'slot-sun-1130-ae-es',
    routeId: 'route-arteztu-ekain',
    date: '2026-05-31',
    startTime: '11:30',
    endTime: '13:00',
    maxParticipants: 12,
    language: 'es',
  },
]
