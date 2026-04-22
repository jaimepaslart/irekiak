import type { AnnouncementConfig } from '../../types/announcement'

/**
 * Default content DAGGE provided us (ES) with translations for the other
 * three locales. Used as fallback when `announcement.config` is absent in
 * the DB, and as seed content for the admin editor's first load. Paragraphs
 * inside `body` are separated by a blank line so the rendering layer can
 * split them back into `<p>` elements.
 */
export const defaultAnnouncement: AnnouncementConfig = {
  enabled: true,
  eyebrow: {
    eu: 'Oharra · Irekiak 2026',
    es: 'Comunicado · Irekiak 2026',
    fr: 'Communiqué · Irekiak 2026',
    en: 'Statement · Irekiak 2026',
  },
  title: {
    eu: 'Gallery Weekend-ak data aldatzen du',
    es: 'El Gallery Weekend cambia de fecha',
    fr: 'Le Gallery Weekend change de date',
    en: 'The Gallery Weekend is moving',
  },
  body: {
    eu: `**IREKIAK Gallery Weekend Donostia**, Donostiako galerien erakusketa denboraldiaren irekiera markatzen duen ekitaldia, **DATA ALDATZEN DU** eta maiatzera lekualdatzen da. Beste espainiar hiri batzuetan ez bezala, Donostiak udaberritik aurrera hasten du bere jarduerarik bizkorrena, mundu osoko bisitari ugari hartzen hasten denean.

Horregatik erabaki du **DAGGE**, Donostiako Arte Garaikideko Galerien Elkarteak, hemendik aurrera ekitaldi hau maiatzean ospatzea urtero. IREKIAK Gallery Weekend bere **VI. edizioan** berrantolatzen da, Donostiako esparru sozial, turistiko eta kulturalean urteroko arte hitzordu giltzarri bihurtzeko helburuarekin.

Irekiera **maiatzaren 29an** izango da, asteburu osoan zehar ateak zabalik izango dituen programa erakusketa trinko batekin; arte, artista, hiritar eta bisitariekin topaketa erakargarri bat, era familiar batean galerien espazioak eta aurkezten duten artisten lana ezagutu nahi dutenentzat.`,
    es: `**IREKIAK Gallery Weekend Donostia**, el evento que marca la apertura de la temporada expositiva de las galerías donostiarras **CAMBIA DE FECHA** y se traslada a mayo. Al contrario de otras ciudades españolas, Donostia, inicia su actividad más intensa a partir de la primavera cuando empieza a recibir numerosos visitantes de todos los lugares del mundo.

Es por esta razón que **DAGGE**, Asociación de Galerías de Arte Contemporáneo de Donostia ha decidido celebrar este acontecimiento a partir de ahora, cada año durante los meses de mayo. IREKIAK Gallery Weekend se reprograma en su **VI edición** con el objetivo de convertirse en una cita artística anual, clave en el ámbito social, turístico y cultural de San Sebastián.

La apertura tendrá lugar el próximo **29 de mayo** con un intenso programa expositivo de puertas abiertas a lo largo del fin de semana; un atractivo encuentro con el arte, artistas, ciudadanía y visitantes que quieran conocer de una forma familiar los espacios de las galerías y la obra de los artistas que presentan.`,
    fr: `**IREKIAK Gallery Weekend Donostia**, l'événement qui marque l'ouverture de la saison des expositions des galeries de Saint-Sébastien, **CHANGE DE DATE** et se déplace au mois de mai. Contrairement à d'autres villes espagnoles, Donostia entame son activité la plus intense à partir du printemps, lorsqu'elle commence à accueillir de nombreux visiteurs venus du monde entier.

C'est pour cette raison que **DAGGE**, l'Association des Galeries d'Art Contemporain de Donostia, a décidé de tenir cet événement dorénavant chaque année au mois de mai. IREKIAK Gallery Weekend se reprogramme pour sa **VIe édition** avec l'objectif de devenir un rendez-vous artistique annuel, clé dans le paysage social, touristique et culturel de Saint-Sébastien.

L'ouverture aura lieu le **29 mai**, avec un programme dense de portes ouvertes tout au long du week-end ; une rencontre attrayante avec l'art, les artistes, les habitants et les visiteurs qui souhaitent découvrir de manière familière les espaces des galeries et l'œuvre des artistes qu'elles présentent.`,
    en: `**IREKIAK Gallery Weekend Donostia**, the event marking the opening of the exhibition season for Donostia's galleries, **IS CHANGING DATES** and moving to May. Unlike other Spanish cities, Donostia's most intense activity begins in spring, when it starts welcoming visitors from around the world.

For this reason, **DAGGE**, the Association of Contemporary Art Galleries of Donostia, has decided to hold this event every year during May from now on. IREKIAK Gallery Weekend is being rescheduled for its **6th edition** with the aim of becoming a yearly artistic event, central to the social, tourist and cultural life of San Sebastián.

The opening will take place on **May 29th** with an intense open-doors programme running throughout the weekend; a warm encounter with art, artists, residents and visitors who wish to discover the galleries' spaces and the work of the artists they showcase.`,
  },
}

/**
 * Date after which the announcement is automatically hidden from the public
 * site regardless of the `enabled` flag. Server-side enforcement — the
 * client cannot bypass it.
 */
export const ANNOUNCEMENT_HIDE_AFTER = '2026-06-01'

export function isAnnouncementStillRelevant(now: Date = new Date()): boolean {
  return now.toISOString().slice(0, 10) < ANNOUNCEMENT_HIDE_AFTER
}
