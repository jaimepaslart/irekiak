import type { ScheduleEvent } from '~/types/schedule'

// Irekiak Gallery Weekend 2026 — 29-31 May
// Friday: Opening. Saturday + Sunday: galleries open + guided tours.
// No film screenings at Kursaal this edition.

export const schedule: ScheduleEvent[] = [
  // Friday 29 May — Opening of all galleries
  {
    id: 'evt-opening',
    day: 'friday',
    startTime: '17:30',
    endTime: '21:00',
    type: 'opening',
    title: {
      eu: 'Galeriak inauguratzea',
      es: 'Inauguración de las galerías',
      fr: 'Inauguration des galeries',
      en: 'Galleries opening',
    },
    description: {
      eu: 'Irekiak 2026aren inaugurazio ofiziala. Galeria guztiak irekita daude bisitarientzat, artistekin zuzeneko elkarrizketa posibilitatearekin.',
      es: 'Inauguración oficial de Irekiak 2026. Todas las galerías abiertas para visitantes, con posibilidad de conversar directamente con los artistas.',
      fr: 'Inauguration officielle d\'Irekiak 2026. Toutes les galeries ouvertes aux visiteurs, avec possibilité de dialoguer directement avec les artistes.',
      en: 'Official opening of Irekiak 2026. All galleries open for visitors, with the opportunity to engage directly with the artists.',
    },
    location: {
      eu: 'Galeria guztiak',
      es: 'Todas las galerías',
      fr: 'Toutes les galeries',
      en: 'All galleries',
    },
    isFree: true,
    requiresBooking: false,
  },

  // Saturday 30 May — Guided tours morning
  {
    id: 'evt-sat-tour-morning',
    day: 'saturday',
    startTime: '11:00',
    endTime: '12:30',
    type: 'guided-tour',
    title: {
      eu: 'Bisita gidatuak (goizekoak)',
      es: 'Visitas guiadas (mañana)',
      fr: 'Visites guidées (matin)',
      en: 'Guided tours (morning)',
    },
    description: {
      eu: 'Bisita gidatuak hiru ibilbidetan: Gros, Parte Zaharra / Antigua, eta Egia.',
      es: 'Visitas guiadas en tres rutas: Gros, Parte Vieja / Antigua y Egia.',
      fr: 'Visites guidées sur trois itinéraires : Gros, Vieille Ville / Antigua et Egia.',
      en: 'Guided tours on three routes: Gros, Old Town / Antigua and Egia.',
    },
    location: {
      eu: 'Ibilbide desberdinak',
      es: 'Diferentes rutas',
      fr: 'Différents itinéraires',
      en: 'Various routes',
    },
    isFree: true,
    requiresBooking: true,
    maxParticipants: 12,
  },

  // Saturday 30 May — Guided tours afternoon
  {
    id: 'evt-sat-tour-afternoon',
    day: 'saturday',
    startTime: '17:00',
    endTime: '18:30',
    type: 'guided-tour',
    title: {
      eu: 'Bisita gidatuak (arratsaldekoak)',
      es: 'Visitas guiadas (tarde)',
      fr: 'Visites guidées (après-midi)',
      en: 'Guided tours (afternoon)',
    },
    description: {
      eu: 'Arratsaldeko bisita gidatuak hiru ibilbidetan.',
      es: 'Visitas guiadas vespertinas en tres rutas.',
      fr: 'Visites guidées de l\'après-midi sur trois itinéraires.',
      en: 'Afternoon guided tours on three routes.',
    },
    location: {
      eu: 'Ibilbide desberdinak',
      es: 'Diferentes rutas',
      fr: 'Différents itinéraires',
      en: 'Various routes',
    },
    isFree: true,
    requiresBooking: true,
    maxParticipants: 12,
  },

  // Sunday 31 May — Guided tours morning
  {
    id: 'evt-sun-tour-morning',
    day: 'sunday',
    startTime: '11:00',
    endTime: '12:30',
    type: 'guided-tour',
    title: {
      eu: 'Bisita gidatuak (igandea)',
      es: 'Visitas guiadas (domingo)',
      fr: 'Visites guidées (dimanche)',
      en: 'Guided tours (Sunday)',
    },
    description: {
      eu: 'Igandeko bisita gidatuak hiru ibilbidetan.',
      es: 'Visitas guiadas dominicales en tres rutas.',
      fr: 'Visites guidées du dimanche sur trois itinéraires.',
      en: 'Sunday guided tours on three routes.',
    },
    location: {
      eu: 'Ibilbide desberdinak',
      es: 'Diferentes rutas',
      fr: 'Différents itinéraires',
      en: 'Various routes',
    },
    isFree: true,
    requiresBooking: true,
    maxParticipants: 12,
  },
]
