Gère les données des galeries dans data/galleries.ts et data/exhibitions.ts.

Actions possibles (argument) :
- add : Ajoute une nouvelle galerie. Demande : nom, adresse, coordonnées GPS, description (eu/es/fr/en), site web, Instagram, horaires, image.
- update : Met à jour une galerie existante. Demande quel champ modifier.
- list : Affiche la liste des galeries avec leur statut (données complètes/incomplètes).
- exhibition : Ajoute/modifie une exposition pour une galerie.
- check : Vérifie que toutes les galeries ont des données complètes dans les 4 langues.

Génère automatiquement un id unique (format: gal-XXX) et un slug (kebab-case).
Respecte les types TypeScript dans types/gallery.ts et types/exhibition.ts.
