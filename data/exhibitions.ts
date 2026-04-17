import type { Exhibition } from '~/types/exhibition'

export const exhibitions: Exhibition[] = [
  {
    id: 'exh-001',
    slug: 'sugerencias-prusianas',
    galleryId: 'gal-001',
    title: {
      eu: 'Sugerencias prusianas',
      es: 'Sugerencias prusianas',
      fr: 'Sugerencias prusianas',
      en: 'Sugerencias prusianas',
    },
    artists: [
      {
        name: 'Rafa Satrústegui',
        bio: {
          eu: 'Rafa Satrústegui (Madril, 1960), Donostiako jatorria eta lotura duen artista.',
          es: 'Rafa Satrústegui (Madrid, 1960), artista con ascendencia y vinculación donostiarras.',
          fr: 'Rafa Satrústegui (Madrid, 1960), artiste d\'ascendance et d\'attache donostiarra.',
          en: 'Rafa Satrústegui (Madrid, 1960), artist with Donostian roots and ties.',
        },
      },
    ],
    description: {
      eu: 'Donostiako jatorria eta lotura dituen Rafa Satrústeguik 22 urteren ondoren aurkezten du lehen aldiz bere lana bakarkako erakusketa batean Donostian. Azkena 2004an izan zen Galería Dieciséis-en, 2007an zendu zen Gonzalo Sánchezen zuzendaritzapean.\n\nOhiko samurtasun eta lirismoaz, artista Donostiara itzultzen da, oraingoan Arteko galeriara, margolan eta paper sorta batekin, non, ahalik eta baliabide eta erregistro gutxienekin, keinuaren indarra eta moldakortasuna adieraztea bilatzen duen, zeinuarekin duen muga arakatuz. Horretarako, kolore guztiak isiltzen ditu Prusiar urdina izan ezik, Sugerencias prusianas izenburuko erakusketa honen pigmentu nagusia, ia esklusiboki.',
      es: 'De ascendencia y vinculación donostiarra, Rafa Satrústegui muestra por primera vez en 22 años su obra en una exposición individual en San Sebastián. La última fue en 2004 en Galería Dieciséis bajo la dirección de Gonzalo Sánchez fallecido en 2007.\n\nCon su habitual delicadeza y lirismo, el artista regresa a Donostia, ahora a la galería Arteko con una serie de pinturas y papeles en los que trata de expresar con los mínimos recursos y registros la potencia y versatilidad del gesto, explorando la frontera de este con el signo. Para ello silencia todos los colores excepto el azul de Prusia, pigmento protagonista, casi en exclusiva, de esta exposición titulada Sugerencias prusianas.',
      fr: 'D\'ascendance et d\'attache donostiarra, Rafa Satrústegui présente pour la première fois en 22 ans son œuvre dans une exposition individuelle à Saint-Sébastien. La dernière remonte à 2004, à la Galería Dieciséis, sous la direction de Gonzalo Sánchez, disparu en 2007.\n\nAvec la délicatesse et le lyrisme qui le caractérisent, l\'artiste revient à Donostia, cette fois à la galerie Arteko, avec une série de peintures et de papiers où il cherche à exprimer, par un minimum de moyens et de registres, la puissance et la versatilité du geste, en explorant la frontière qui le sépare du signe. Il fait pour cela taire toutes les couleurs à l\'exception du bleu de Prusse, pigment presque exclusif de cette exposition intitulée Sugerencias prusianas.',
      en: 'With Donostian roots and ties, Rafa Satrústegui presents his work in a solo exhibition in San Sebastián for the first time in 22 years. The last was in 2004 at Galería Dieciséis, under the direction of Gonzalo Sánchez, who passed away in 2007.\n\nWith his habitual delicacy and lyricism, the artist returns to Donostia — now to Arteko gallery — with a series of paintings and works on paper in which he seeks to convey, using the barest of resources and registers, the power and versatility of gesture, exploring its frontier with the sign. To do so he silences every colour but Prussian blue, the near-exclusive pigment of this exhibition titled Sugerencias prusianas.',
    },
    medium: {
      eu: 'Margolana eta papera',
      es: 'Pintura y papel',
      fr: 'Peinture et papier',
      en: 'Painting and paper',
    },
    images: ['/images/exhibitions/sugerencias-prusianas-monologo-prusiano-i.jpg'],
    startDate: '2026-05-29',
    endDate: '2026-05-31',
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
    startDate: '2026-05-29',
    endDate: '2026-05-31',
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
    startDate: '2026-05-29',
    endDate: '2026-05-31',
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
    startDate: '2026-05-29',
    endDate: '2026-05-31',
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
    startDate: '2026-05-29',
    endDate: '2026-05-31',
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
    startDate: '2026-05-29',
    endDate: '2026-05-31',
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
    startDate: '2026-05-29',
    endDate: '2026-05-31',
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
    startDate: '2026-05-29',
    endDate: '2026-05-31',
  },
]
