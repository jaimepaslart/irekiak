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
    slug: 'ruoxi-jin',
    galleryId: 'gal-003',
    title: {
      eu: 'Ruoxi Jin',
      es: 'Ruoxi Jin',
      fr: 'Ruoxi Jin',
      en: 'Ruoxi Jin',
    },
    artists: [
      {
        name: 'Ruoxi Jin',
        bio: {
          eu: 'Ruoxi Jin (Harbin, 1997, Txina), eskultura eta performancean aritzen den artista.',
          es: 'Ruoxi Jin (Harbin, 1997, China), artista que trabaja con la escultura y la performance.',
          fr: 'Ruoxi Jin (Harbin, 1997, Chine), artiste qui travaille la sculpture et la performance.',
          en: 'Ruoxi Jin (Harbin, 1997, China), artist working with sculpture and performance.',
        },
      },
    ],
    description: {
      eu: 'Ruoxi Jin-ek (Harbin, 1997, Txina) batez ere eskulturaren eta performancearen bidez lan egiten du, narrazio konplexuak ehunduz; bertan, anekdota genealogikoak eta magia-trikimailuak elkartzen dituelarik.\n\nJin-en praktikaren zehar nolabaiteko jariakortasun-sentsazioa hedatzen da, eta horrek ez du soilik uztartzen dituen objektuen iraganeko bizitzekin bat egiten, baizik eta artistaren berarenekin ere. Bere muntaketa heteroklitoen birtuosismoak gurutzaketetara eta loturetara irekita dagoen ikuspegi poetikoa islatzen du. Muntaketa ez da soilik ikerketa formal bat bihurtzen, baizik eta lotura afektiboak eta esperientzia partekatuak sustatzeko bitarteko bat ere bada.\n\nRuoxi Jin Parisko École Nationale Supérieure des Beaux-Arts-en graduatu zen 2024an. Bere azken erakusketa indibidualen artean hauek daude: MA Félicité, Frac Île-de-France, Paris, 2026; Microclimats, Galerie Mennour, Paris, 2025; Prix sur demande, Galerie du Crous, Paris, 2025; REGRETS, DNSAP, Beaux-Arts de Paris, Paris, 2024.',
      es: 'Ruoxi Jin (Harbin, 1997, China) trabaja principalmente con la escultura y la performance, tejiendo narrativas construidas de manera intrincada en las que convergen anécdotas genealógicas y trucos de magia.\n\nUna sensación de fluidez atraviesa la práctica de Jin, resonando no solo con las vidas pasadas de los objetos que combina, sino también con las de la propia artista. La virtuosidad de sus ensamblajes heteróclitos refleja una visión poética abierta a los cruces y las asociaciones. El ensamblaje se convierte no solo en una investigación formal, sino en un medio para fomentar vínculos afectivos y experiencias compartidas.\n\nRuoxi Jin se graduó en la École Nationale Supérieure des Beaux-Arts de París en 2024. Entre sus exposiciones individuales recientes se encuentran MA Félicité, Frac Île-de-France, París, 2026; Microclimats en Galerie Mennour, París, 2025; Prix sur demande en Galerie du Crous, París, 2025; REGRETS, DNSAP, Beaux-Arts de París, París, 2024.',
      fr: 'Ruoxi Jin (Harbin, 1997, Chine) travaille principalement la sculpture et la performance, tissant des récits construits de manière complexe où convergent anecdotes généalogiques et tours de magie.\n\nUne sensation de fluidité traverse la pratique de Jin, résonnant non seulement avec les vies passées des objets qu\'elle assemble, mais aussi avec les siennes. La virtuosité de ses assemblages hétéroclites reflète une vision poétique ouverte aux croisements et aux associations. L\'assemblage ne devient pas seulement une recherche formelle, mais un moyen de tisser des liens affectifs et des expériences partagées.\n\nRuoxi Jin est diplômée de l\'École Nationale Supérieure des Beaux-Arts de Paris en 2024. Parmi ses expositions individuelles récentes figurent MA Félicité, Frac Île-de-France, Paris, 2026 ; Microclimats à la Galerie Mennour, Paris, 2025 ; Prix sur demande à la Galerie du Crous, Paris, 2025 ; REGRETS, DNSAP, Beaux-Arts de Paris, Paris, 2024.',
      en: 'Ruoxi Jin (Harbin, 1997, China) works primarily in sculpture and performance, weaving intricately constructed narratives in which genealogical anecdotes and magic tricks converge.\n\nA sense of fluidity runs through Jin\'s practice, echoing not only the past lives of the objects she combines, but also those of the artist herself. The virtuosity of her heteroclite assemblages reflects a poetic vision open to crossings and associations. Assemblage becomes not only a formal inquiry but a means of fostering affective bonds and shared experiences.\n\nRuoxi Jin graduated from the École Nationale Supérieure des Beaux-Arts in Paris in 2024. Her recent solo exhibitions include MA Félicité, Frac Île-de-France, Paris, 2026; Microclimats at Galerie Mennour, Paris, 2025; Prix sur demande at Galerie du Crous, Paris, 2025; REGRETS, DNSAP, Beaux-Arts de Paris, Paris, 2024.',
    },
    medium: {
      eu: 'Eskultura eta performancea',
      es: 'Escultura y performance',
      fr: 'Sculpture et performance',
      en: 'Sculpture and performance',
    },
    images: ['/images/exhibitions/ruoxi-jin-telepathic-sneeze.jpg'],
    startDate: '2026-05-28',
    endDate: '2026-07-11',
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
]
