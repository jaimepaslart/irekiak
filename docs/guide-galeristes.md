# Irekiak — Guide pour les galeristes

Ce guide vous explique comment fonctionne le site Irekiak : la partie publique que voient les visiteurs, et le backoffice qui vous permet de gérer vos galeries, expositions et réservations.

---

## 1. En deux mots

Irekiak a deux faces :

- **Le site public** (ce que voient les visiteurs) — présente les galeries, les expositions, le programme du week-end, permet de réserver les visites guidées.
- **Le backoffice admin** (votre espace) — permet à l'équipe Irekiak et aux galeristes de gérer les contenus, suivre les réservations, faire le check-in le jour J, envoyer des communications.

Les deux sont hébergés à la même adresse. La différence : les visiteurs vont sur `/`, vous allez sur `/admin`.

---

## 2. Le site public

### Les pages principales

| Page | À quoi ça sert |
|---|---|
| Accueil `/` | Présentation générale, expos en cours, mise en avant des 3 jours d'événement |
| Galeries `/galleries` | Liste des 6 galeries participantes, avec horaires et description |
| Programme `/programme` | Les 3 jours (ven/sam/dim) avec tous les événements |
| Visites guidées `/visites` | Les 3 parcours commissariés et le formulaire de réservation |
| Carte `/carte` | Localisation de toutes les galeries sur Donostia |
| Retrouver ma résa `/retrouver` | Un visiteur ayant perdu son email retrouve ses billets |
| Contact `/contact` | Formulaire de contact |

### Les 4 langues

Le site est disponible en **euskara** (par défaut), **castellano**, **français** et **anglais**. Le basculement se fait via le menu en haut à droite. Les URL changent selon la langue (ex: `/galleries` devient `/fr/galleries` en français).

### Le flux d'une réservation côté visiteur

1. Le visiteur arrive sur `/visites` → choisit un des 3 parcours
2. Il voit le calendrier du week-end → choisit une date
3. Il voit les créneaux disponibles ce jour-là → choisit un créneau
4. Il remplit ses informations (nom, email, nombre de places, langue)
5. Il accepte la politique de confidentialité, clique "M'inscrire"
6. Le système envoie automatiquement un email de confirmation avec :
   - Les détails de la visite
   - Un QR code
   - Un fichier `.ics` pour l'ajouter à son agenda
   - Un lien vers sa page de réservation personnelle
7. Le ou les galeristes concernés reçoivent aussi une notification email

---

## 3. Le backoffice admin

### Comment s'y connecter

1. Allez sur `https://irekiak.art/admin` (remplacera `https://irekiak.eus/admin` au basculement final)
2. Saisissez le mot de passe qui vous a été fourni
3. Vous êtes connecté·e pour 1 heure (au-delà, il faudra se reconnecter)

**Important** : ce mot de passe est partagé avec les autres galeristes et l'équipe Irekiak. Ne le transmettez pas à des personnes extérieures.

### Le dashboard `/admin`

C'est la page d'accueil de l'espace admin. Vous y trouvez :
- Un résumé du jour (nouvelles réservations, check-ins du jour)
- Les prochaines visites à venir
- Une timeline d'activité (dernières actions effectuées)
- Des raccourcis vers les pages principales

### Les sections de l'admin

#### 📋 Réservations `/admin/bookings`
La liste complète de toutes les réservations, triables et filtrables. Depuis cette page vous pouvez :
- Voir le détail d'une résa (cliquer dessus)
- Créer une réservation manuelle (pour un visiteur qui appelle au téléphone par ex)
- Modifier, annuler, renvoyer l'email de confirmation
- Exporter en CSV

#### ✅ Check-in `/admin/checkin`
Le jour de la visite, vous cliquez sur le créneau concerné et cochez les visiteurs qui arrivent. Les check-ins sont sauvegardés en temps réel et visibles par toute l'équipe.

Si un visiteur a son QR code, vous pouvez le scanner et le système le reconnaît.

#### 🏛️ Galeries `/admin/galleries`
Modifiez les informations de contact de votre galerie : email, téléphone, langue préférée. Vous pouvez aussi activer/désactiver les notifications par email à chaque nouvelle réservation qui passe par votre galerie.

#### 🎨 Expositions `/admin/exhibitions`
Gérez vos expositions : titre, description (dans les 4 langues), photo principale, dates, artistes. Les changements sont visibles immédiatement sur le site public.

#### ✉️ Emails `/admin/emails`
Suivez le statut des emails envoyés (reçus, ouverts, rebondis). Si un visiteur se plaint de ne pas avoir reçu son email, vérifiez ici d'abord.

#### 📣 Campagne `/admin/blast`
Envoyer un email groupé à tous les visiteurs ayant opté pour recevoir nos communications (par ex. un rappel 24h avant le week-end, ou l'annonce de l'édition 2027).

#### ⚙️ Paramètres `/admin/settings`
Trois interrupteurs globaux :
- **Ouverture des réservations** : activer/désactiver la prise de résa publique
- **Message d'urgence** : bannière affichée sur le site (ex: "Météo défavorable, visite du parc reportée")
- **Notifications emails** : couper tous les envois automatiques en cas d'incident

#### 📜 Audit `/admin/audit`
L'historique de toutes les actions effectuées dans l'admin (qui a cancel quoi, quand, etc.). Utile en cas de question.

### Raccourcis clavier admin

Une fois connecté·e à l'admin, ces touches fonctionnent depuis n'importe où :

| Touche | Action |
|---|---|
| `d` | Dashboard |
| `b` | Réservations |
| `c` | Créer une réservation |
| `k` | Check-in |
| `s` | Paramètres |
| `a` | Audit |
| `/` | Recherche |
| `?` | Aide |
| `Esc` | Fermer / revenir |

---

## 4. Les emails que vous recevez en tant que galeriste

Selon la configuration de votre galerie dans `/admin/galleries`, vous pouvez recevoir :

- **Notification à chaque nouvelle réservation** — en temps réel, avec les détails du visiteur et du créneau
- **Digest quotidien** — un résumé par jour des réservations concernant votre galerie (à la place ou en plus des notifications temps réel)

Ces notifications sont envoyées dans votre **langue préférée** (eu/es/fr/en), configurable dans `/admin/galleries`.

---

## 5. Questions fréquentes

**Je ne reçois plus les notifications.**
Vérifiez dans `/admin/galleries` que vous avez bien activé "Notifier à chaque réservation". Sinon regardez dans `/admin/emails` si l'envoi a eu lieu (il y aura un statut "bounced" ou "failed" si votre boîte a rejeté l'email).

**Un visiteur dit n'avoir pas reçu son email.**
Allez dans `/admin/bookings`, ouvrez sa réservation, cliquez "Renvoyer l'email". S'il ne reçoit toujours rien, demandez-lui de vérifier ses spams, puis consultez `/admin/emails` pour voir si Resend a rapporté un problème de livraison.

**Un visiteur veut annuler.**
Deux options : il peut le faire seul depuis le lien dans son email de confirmation, ou vous le faites depuis `/admin/bookings/[id]`. Dans les deux cas la place est automatiquement libérée pour un autre visiteur.

**Un créneau est complet mais on voudrait ajouter 2 personnes exceptionnellement.**
Pour l'instant, la limite de 12 personnes par créneau est stricte côté public. Si besoin, contactez Paul pour ajuster manuellement en base de données (ce n'est pas dans le backoffice à l'heure actuelle).

**Je peux modifier les horaires ou ajouter une date ?**
Non, les parcours et créneaux sont fixés par l'équipe Irekiak avant l'événement. Pour toute modification, contactez Paul.

**Un visiteur demande la suppression de ses données (RGPD).**
Il peut le faire seul depuis sa page de réservation (bouton "Effacer toutes mes données"). Sinon, dirigez-le vers `irekiak@irekiak.eus`.

**Combien de temps reste-t-on connecté·e à l'admin ?**
1 heure d'inactivité. Au-delà, il faut re-saisir le mot de passe.

---

## 6. Besoin d'aide ?

- Pour toute question sur le backoffice → **Paul** (site et technique)
- Pour les questions sur le contenu éditorial (expos, artistes, programme) → équipe Irekiak / DAGGE
- Pour les urgences pendant le week-end → canal WhatsApp de l'équipe

L'interface est en **français** côté admin — si vous préférez une autre langue, dites-le à Paul.
