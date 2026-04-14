import type { Exhibition } from '~/types/exhibition'

export const exhibitions: Exhibition[] = [
  {
    id: 'exh-001',
    slug: 'zatixak',
    galleryId: 'gal-001',
    title: {
      eu: 'ZATIXAK',
      es: 'ZATIXAK',
      fr: 'ZATIXAK',
      en: 'ZATIXAK',
    },
    artists: [
      {
        name: 'Joxan Iza',
        bio: {
          eu: 'Joxan Iza, Gipuzkoako artista bisual eta eskultorea.',
          es: 'Joxan Iza, artista visual y escultor de Gipuzkoa.',
          fr: 'Joxan Iza, artiste visuel et sculpteur du Gipuzkoa.',
          en: 'Joxan Iza, visual artist and sculptor from Gipuzkoa.',
        },
      },
    ],
    description: {
      eu: 'Joxan Izaren "ZATIXAK" erakusketa, zatiak eta osotasunak aztertzen dituen lan bilduma.',
      es: 'Exposición "ZATIXAK" de Joxan Iza, una colección que explora fragmentos y totalidades.',
      fr: 'Exposition "ZATIXAK" de Joxan Iza, une collection explorant fragments et totalités.',
      en: 'Exhibition "ZATIXAK" by Joxan Iza, a collection exploring fragments and totalities.',
    },
    medium: {
      eu: 'Teknika mistoa',
      es: 'Técnica mixta',
      fr: 'Technique mixte',
      en: 'Mixed media',
    },
    images: ['/images/exhibitions/zatixak-01.jpg', '/images/exhibitions/zatixak-02.jpg'],
    startDate: '2025-09-11',
    endDate: '2025-09-14',
  },
  {
    id: 'exh-002',
    slug: 'zu-atrapatu-arte',
    galleryId: 'gal-002',
    title: {
      eu: 'Zu Atrapatu Arte (Trashvertising)',
      es: 'Zu Atrapatu Arte (Trashvertising)',
      fr: 'Zu Atrapatu Arte (Trashvertising)',
      en: 'Zu Atrapatu Arte (Trashvertising)',
    },
    artists: [
      {
        name: 'Pau Figueres Ortiz',
        bio: {
          eu: 'Pau Figueres Ortiz, artista bisuala eta diseinatzailea.',
          es: 'Pau Figueres Ortiz, artista visual y diseñador.',
          fr: 'Pau Figueres Ortiz, artiste visuel et designer.',
          en: 'Pau Figueres Ortiz, visual artist and designer.',
        },
      },
    ],
    description: {
      eu: 'Publizitateak eta kontsumoak gure bizitzan duten eraginaren hausnarketa bisuala.',
      es: 'Una reflexión visual sobre el impacto de la publicidad y el consumo en nuestras vidas.',
      fr: 'Une réflexion visuelle sur l\'impact de la publicité et de la consommation dans nos vies.',
      en: 'A visual reflection on the impact of advertising and consumption in our lives.',
    },
    medium: {
      eu: 'Instalazioa eta collagea',
      es: 'Instalación y collage',
      fr: 'Installation et collage',
      en: 'Installation and collage',
    },
    images: ['/images/exhibitions/zu-atrapatu-arte-01.jpg', '/images/exhibitions/zu-atrapatu-arte-02.jpg'],
    startDate: '2025-09-11',
    endDate: '2025-09-14',
  },
  {
    id: 'exh-003',
    slug: 'the-giants-of-the-circle',
    galleryId: 'gal-003',
    title: {
      eu: 'The Giants of the Circle',
      es: 'The Giants of the Circle',
      fr: 'The Giants of the Circle',
      en: 'The Giants of the Circle',
    },
    artists: [
      {
        name: 'Susan Cianciolo',
        bio: {
          eu: 'Susan Cianciolo, New Yorkeko artista multidisziplinarra.',
          es: 'Susan Cianciolo, artista multidisciplinar de Nueva York.',
          fr: 'Susan Cianciolo, artiste multidisciplinaire de New York.',
          en: 'Susan Cianciolo, multidisciplinary artist from New York.',
        },
      },
    ],
    description: {
      eu: 'Susan Cianciolo-ren instalazio poetikoa, zirkuluaren giganteei buruz.',
      es: 'Una instalación poética de Susan Cianciolo sobre los gigantes del círculo.',
      fr: 'Une installation poétique de Susan Cianciolo sur les géants du cercle.',
      en: 'A poetic installation by Susan Cianciolo about the giants of the circle.',
    },
    medium: {
      eu: 'Instalazioa, ehungintza eta marrazkia',
      es: 'Instalación, textil y dibujo',
      fr: 'Installation, textile et dessin',
      en: 'Installation, textile and drawing',
    },
    images: ['/images/exhibitions/giants-of-the-circle-01.jpg', '/images/exhibitions/giants-of-the-circle-02.jpg'],
    startDate: '2025-09-11',
    endDate: '2025-09-14',
  },
  {
    id: 'exh-004',
    slug: 'barne-begirada',
    galleryId: 'gal-004',
    title: {
      eu: 'Barne begirada',
      es: 'Barne begirada',
      fr: 'Barne begirada',
      en: 'Barne begirada',
    },
    artists: [
      {
        name: 'Mikel Díez Alaba',
        bio: {
          eu: 'Mikel Díez Alaba, Euskal Herriko pintore eta artista bisuala.',
          es: 'Mikel Díez Alaba, pintor y artista visual del País Vasco.',
          fr: 'Mikel Díez Alaba, peintre et artiste visuel du Pays Basque.',
          en: 'Mikel Díez Alaba, painter and visual artist from the Basque Country.',
        },
      },
      {
        name: 'Marta Marugan',
        bio: {
          eu: 'Marta Marugan, artista bisuala eta eskultorea.',
          es: 'Marta Marugan, artista visual y escultora.',
          fr: 'Marta Marugan, artiste visuelle et sculptrice.',
          en: 'Marta Marugan, visual artist and sculptor.',
        },
      },
    ],
    description: {
      eu: 'Mikel Díez Alaba eta Marta Maruganen erakusketa, barne begiradaren eta barnekotasunaren inguruan.',
      es: 'Exposición de Mikel Díez Alaba y Marta Marugan sobre la mirada interior y la intimidad.',
      fr: 'Exposition de Mikel Díez Alaba et Marta Marugan sur le regard intérieur et l\'intimité.',
      en: 'Exhibition by Mikel Díez Alaba and Marta Marugan on the inner gaze and intimacy.',
    },
    medium: {
      eu: 'Pintura eta eskultura',
      es: 'Pintura y escultura',
      fr: 'Peinture et sculpture',
      en: 'Painting and sculpture',
    },
    images: ['/images/exhibitions/barne-begirada-01.jpg', '/images/exhibitions/barne-begirada-02.jpg'],
    startDate: '2025-09-11',
    endDate: '2025-09-14',
  },
  {
    id: 'exh-005',
    slug: 'basoan-zehar',
    galleryId: 'gal-005',
    title: {
      eu: 'Basoan zehar',
      es: 'Basoan zehar',
      fr: 'Basoan zehar',
      en: 'Basoan zehar',
    },
    artists: [
      {
        name: 'Elena Setién',
        bio: {
          eu: 'Elena Setién, Kantabriako artista bisuala, naturarekin lotutako lanak.',
          es: 'Elena Setién, artista visual de Cantabria, trabajos vinculados a la naturaleza.',
          fr: 'Elena Setién, artiste visuelle de Cantabrie, travaux liés à la nature.',
          en: 'Elena Setién, visual artist from Cantabria, works connected to nature.',
        },
      },
    ],
    description: {
      eu: 'Elena Setiénen "Basoan zehar", basoa eta naturaren esperientzia artistikoa.',
      es: 'Exposición "Basoan zehar" de Elena Setién, una experiencia artística del bosque y la naturaleza.',
      fr: 'Exposition "Basoan zehar" d\'Elena Setién, une expérience artistique de la forêt et de la nature.',
      en: 'Exhibition "Basoan zehar" by Elena Setién, an artistic experience of the forest and nature.',
    },
    medium: {
      eu: 'Argazkilaritza eta instalazioa',
      es: 'Fotografía e instalación',
      fr: 'Photographie et installation',
      en: 'Photography and installation',
    },
    images: ['/images/exhibitions/basoan-zehar-01.jpg', '/images/exhibitions/basoan-zehar-02.jpg'],
    startDate: '2025-09-11',
    endDate: '2025-09-14',
  },
  {
    id: 'exh-006',
    slug: 'water-and-sacred-shores',
    galleryId: 'gal-006',
    title: {
      eu: 'Water & Sacred Shores',
      es: 'Water & Sacred Shores',
      fr: 'Water & Sacred Shores',
      en: 'Water & Sacred Shores',
    },
    artists: [
      {
        name: 'Taki Bibelas',
        bio: {
          eu: 'Taki Bibelas, Greziako artista bisuala, uraren eta lurraldearen artean.',
          es: 'Taki Bibelas, artista visual griego, entre el agua y el territorio.',
          fr: 'Taki Bibelas, artiste visuel grec, entre l\'eau et le territoire.',
          en: 'Taki Bibelas, Greek visual artist, between water and territory.',
        },
      },
    ],
    description: {
      eu: 'Taki Bibelasen erakusketa, uraren eta kostalde sakratuen arteko harremanaz.',
      es: 'Exposición de Taki Bibelas sobre la relación entre el agua y las costas sagradas.',
      fr: 'Exposition de Taki Bibelas sur la relation entre l\'eau et les rivages sacrés.',
      en: 'Exhibition by Taki Bibelas on the relationship between water and sacred shores.',
    },
    medium: {
      eu: 'Argazkilaritza eta bideoa',
      es: 'Fotografía y vídeo',
      fr: 'Photographie et vidéo',
      en: 'Photography and video',
    },
    images: ['/images/exhibitions/water-sacred-shores-01.jpg', '/images/exhibitions/water-sacred-shores-02.jpg'],
    startDate: '2025-09-11',
    endDate: '2025-09-14',
  },
  {
    id: 'exh-007',
    slug: 'palmason',
    galleryId: 'gal-007',
    title: {
      eu: 'Pálmason',
      es: 'Pálmason',
      fr: 'Pálmason',
      en: 'Pálmason',
    },
    artists: [
      {
        name: 'Hlynur Pálmason',
        bio: {
          eu: 'Hlynur Pálmason, Islandiako zinema zuzendari eta artista bisuala.',
          es: 'Hlynur Pálmason, director de cine y artista visual islandés.',
          fr: 'Hlynur Pálmason, réalisateur et artiste visuel islandais.',
          en: 'Hlynur Pálmason, Icelandic filmmaker and visual artist.',
        },
      },
    ],
    description: {
      eu: 'Hlynur Pálmasonen lan zinematografikoen erakusketa Tabakalera-n.',
      es: 'Exposición de la obra cinematográfica de Hlynur Pálmason en Tabakalera.',
      fr: 'Exposition de l\'oeuvre cinématographique de Hlynur Pálmason à Tabakalera.',
      en: 'Exhibition of Hlynur Pálmason\'s cinematographic work at Tabakalera.',
    },
    medium: {
      eu: 'Zinema eta bideo instalazioa',
      es: 'Cine y videoinstalación',
      fr: 'Cinéma et vidéo-installation',
      en: 'Cinema and video installation',
    },
    images: ['/images/exhibitions/palmason-01.jpg', '/images/exhibitions/palmason-02.jpg'],
    startDate: '2025-09-11',
    endDate: '2025-09-14',
  },
  {
    id: 'exh-008',
    slug: 'kursaal-tabakalera',
    galleryId: 'gal-008',
    title: {
      eu: 'KURSAAL - Tabakalera',
      es: 'KURSAAL - Tabakalera',
      fr: 'KURSAAL - Tabakalera',
      en: 'KURSAAL - Tabakalera',
    },
    artists: [],
    description: {
      eu: 'Kursaal eta Tabakalerak elkarrekin antolatutako proiektu kolaboratiboa.',
      es: 'Proyecto colaborativo organizado conjuntamente por Kursaal y Tabakalera.',
      fr: 'Projet collaboratif organisé conjointement par Kursaal et Tabakalera.',
      en: 'Collaborative project jointly organized by Kursaal and Tabakalera.',
    },
    medium: {
      eu: 'Diziplina anitzak',
      es: 'Multidisciplinar',
      fr: 'Multidisciplinaire',
      en: 'Multidisciplinary',
    },
    images: ['/images/exhibitions/kursaal-tabakalera-01.jpg', '/images/exhibitions/kursaal-tabakalera-02.jpg'],
    startDate: '2025-09-11',
    endDate: '2025-09-14',
  },
]
