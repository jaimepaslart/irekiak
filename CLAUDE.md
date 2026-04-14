# Irekiak - Gallery Weekend Donostia / San Sebastián

## Projet
Site web du Gallery Weekend Irekiak à Donostia-San Sebastián, Pays Basque.
Événement de 4 jours (jeudi-dimanche) avec 8 galeries, visites guidées, et programme culturel.

- **URL**: https://irekiak.eus
- **Langues**: Euskara (défaut), Español, Français, English

## Stack technique
- **Framework**: Nuxt 4 (Vue 3 + TypeScript strict)
- **CSS**: Tailwind CSS v4 + shadcn-vue
- **i18n**: @nuxtjs/i18n (stratégie prefix_except_default, eu sans prefix)
- **Images**: @nuxt/image (webp/avif, quality 80)
- **Fonts**: Inter via @nuxt/fonts
- **Maps**: Leaflet (client-only)
- **SEO**: @nuxtjs/sitemap, Schema.org JSON-LD
- **Email**: Resend API
- **Package manager**: pnpm

## Structure du projet
```
app/              # Nuxt 4 srcDir
  components/     # gallery/, booking/, schedule/, map/, layout/, shared/, ui/
  composables/    # useGalleries, useSchedule, useBooking, useTours, useSeo
  pages/          # galleries/, programme/, visites/, carte, contact, a-propos
  layouts/        # default.vue
  plugins/        # leaflet.client.ts
  assets/css/     # tailwind.css
data/             # galleries.ts, exhibitions.ts, schedule.ts, tours.ts
i18n/locales/     # eu.json, es.json, fr.json, en.json
types/            # gallery.ts, exhibition.ts, schedule.ts, tour.ts, booking.ts
server/api/       # contact.post.ts, booking/
public/images/    # galleries/, exhibitions/, artists/, og/
scripts/          # check-i18n.ts, check-seo.ts, check-data.ts
```

## Rendering hybride
- SSG (prerender) : /, /galleries, /programme, /carte, /a-propos, /contact, /accessibilite
- CSR (ssr: false) : /visites/** (booking dynamique)

## Conventions de code
- `<script setup lang="ts">` systématiquement
- Composables auto-importés par Nuxt
- `useI18n()` pour les traductions: `const { t, locale } = useI18n()`
- Maps: toujours `<ClientOnly>` + composant Lazy
- SEO: `useSeoMeta()` + `useHead()` sur chaque page
- Images: @nuxt/image (format webp/avif)
- Accessibilité: WCAG 2.1 AA, aria-labels, alt texts, skip links
- Leaflet exclu du SSR: `vite.ssr.external: ['leaflet']`

## i18n
- 4 langues: eu (défaut), es, fr, en
- Fichiers dans i18n/locales/
- Toujours ajouter les traductions dans les 4 langues
- Euskara = langue par défaut (domaine .eus)
- Interface TranslatedText `{ eu, es, fr, en }` pour les données

## Commandes
```
pnpm dev            # Serveur de développement
pnpm build          # Build production
pnpm generate       # Génération statique
pnpm typecheck      # Vérification TypeScript
pnpm lint           # ESLint
pnpm i18n:check     # Vérification traductions
pnpm seo:check      # Audit SEO
pnpm data:check     # Vérification données
```

## Langue de communication
Répondre en français.
Toujours utiliser Opus 4.6.
