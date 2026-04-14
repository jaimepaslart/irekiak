Gère le système de réservation des visites guidées.

Actions (argument) :
- routes : Affiche les 3 routes avec leurs créneaux
- add-route : Ajoute une route. Demande : nom (4 langues), galeries, durée, distance, point de rencontre, couleur.
- add-slot : Ajoute un créneau. Demande : route, date, heure, capacité, langue du guide.
- check : Vérifie la cohérence (routes réf. galeries existantes, créneaux sans chevauchement)
- test : Simule une réservation pour tester le formulaire et l'API

Données dans data/tours.ts. Types dans types/tour.ts et types/booking.ts.
