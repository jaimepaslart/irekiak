# Irekiak - Gallery Weekend Donostia / San Sebastián

## Projet
Site web du Gallery Weekend Irekiak à Donostia-San Sebastián, Pays Basque.
Événement de 3 jours (vendredi-dimanche) avec 6 galeries, visites guidées, et programme culturel.

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

## Booking system (refactor avril 2026)

Auth admin : header `x-admin-token` (NUXT_ADMIN_TOKEN_SECRET), session localStorage 1h. Middleware `server/utils/require-admin.ts` sur tous les `/api/admin/*`. Layout partagé `app/layouts/admin.vue` avec nav + keyboard shortcuts.

Tables DB (auto-migrated dans `server/db/index.ts`) :
- `tour_routes`, `time_slots`, `bookings` (+ `accepts_marketing`)
- `audit_log` (tous les actes admin + visiteur loggés)
- `attendance` (check-in persistant)
- `app_settings` (key-value : `bookings.accept`, `emergency.message`, `notifications.enabled`)
- `gallery_contact_overrides` (override contacts galeries sans git commit)
- `email_events` (populé par webhook Resend si NUXT_RESEND_WEBHOOK_SECRET)

Helpers serveur : `audit.ts`, `admin-settings.ts` (cache 30s), `gallery-contacts.ts` (merge override+data), `notify-galleries.ts`, `cancel-booking.ts` (logique partagée visiteur+admin), `email-retry.ts` (3× backoff 1s/5s/15s), `rate-limit.ts` (sliding window per-IP), `pick-locale.ts`, `require-admin.ts`.

Concurrency : mutex in-memory per-slot (`booking-lock.ts`) + optimistic lock via `version` column → 409 si modifié concurremment.

Pages admin (sous `/admin/*`, layout `admin`) : `index` dashboard, `bookings` liste+bulk, `bookings/[id]` détail+edit, `bookings/new` manual, `checkin` overview, `checkin/[slotId]` persistent check-in, `galleries`, `blast`, `emails`, `settings`, `audit`.

Pages publiques : `/visites/[route]` 3-step flow · `/bookings/[token]` confirmation + QR + cancel + resend + RGPD export/purge · `/privacy` politique RGPD.

Env vars : `NUXT_RESEND_API_KEY`, `NUXT_RESEND_WEBHOOK_SECRET`, `NUXT_ADMIN_TOKEN_SECRET`, `NUXT_CRON_SECRET`, `NUXT_PUBLIC_SITE_URL`, `NUXT_CONTACT_EMAIL`.

Raccourcis clavier admin : `d` dashboard · `b` bookings · `c` create · `k` check-in · `s` settings · `a` audit · `/` search · `?` help · `Esc` blur.

## Langue de communication
Répondre en français.
Toujours utiliser Opus 4.7.
