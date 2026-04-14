Vérifie l'intégrité et la cohérence de toutes les données du projet.

1. Galeries (data/galleries.ts) : données complètes (nom, adresse, coordonnées, description 4 langues, image)
2. Expositions (data/exhibitions.ts) : chaque exposition réf. une galerie valide, artistes, dates, descriptions 4 langues
3. Programme (data/schedule.ts) : pas de chevauchement, galeries existantes
4. Visites (data/tours.ts) : routes réf. galeries existantes, créneaux cohérents
5. Images : fichiers référencés existent dans public/images/
6. Types : données conformes aux interfaces TypeScript

Rapport par catégorie avec les problèmes trouvés.
