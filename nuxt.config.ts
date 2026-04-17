import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  alias: {
    '@data': resolve(__dirname, 'data'),
    '#types': resolve(__dirname, 'types'),
  },

  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  future: { compatibilityVersion: 4 },

  modules: [
    'shadcn-nuxt',
    '@nuxtjs/i18n',
    '@nuxt/fonts',
    '@nuxt/image',
    '@nuxt/icon',
    '@nuxtjs/sitemap',
    '@nuxt/eslint',
  ],

  css: [
    '~/assets/css/tailwind.css',
    'leaflet/dist/leaflet.css',
    'leaflet.markercluster/dist/MarkerCluster.css',
    'leaflet.markercluster/dist/MarkerCluster.Default.css',
  ],

  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: ['leaflet'],
    },
  },

  routeRules: {
    '/visites/**': { ssr: false },
    '/carte': { ssr: false },
    '/*/carte': { ssr: false },
  },

  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },

  i18n: {
    locales: [
      { code: 'eu', name: 'Euskara', language: 'eu-ES', file: 'eu.json' },
      { code: 'es', name: 'Español', language: 'es-ES', file: 'es.json' },
      { code: 'fr', name: 'Français', language: 'fr-FR', file: 'fr.json' },
      { code: 'en', name: 'English', language: 'en-US', file: 'en.json' },
    ],
    defaultLocale: 'eu',
    strategy: 'prefix_except_default',
    langDir: '../i18n/locales',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'irekiak_locale',
      redirectOn: 'root',
    },
  },

  image: {
    format: ['webp', 'avif'],
    quality: 80,
  },

  fonts: {
    families: [
      { name: 'Inter', provider: 'google', weights: [400, 500, 600, 700] },
      { name: 'JetBrains Mono', provider: 'google', weights: [400] },
      { name: 'Playfair Display', provider: 'google', weights: [400, 500, 600] },
    ],
  },

  sitemap: {
    hostname: 'https://irekiak.eus',
  },

  typescript: {
    strict: true,
  },

  router: {
    options: {
      scrollBehaviorType: 'smooth',
    },
  },

  app: {
    pageTransition: false,
    head: {
      htmlAttrs: { lang: 'eu' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#003153' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/favicon-192x192.png' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
    },
  },

  runtimeConfig: {
    resendApiKey: '',
    fromEmail: 'Irekiak <irekiak@irekiak.art>', // NUXT_FROM_EMAIL
    resendWebhookSecret: '', // NUXT_RESEND_WEBHOOK_SECRET
    contactEmail: 'irekiak@irekiak.eus',
    adminTokenSecret: '',    // NUXT_ADMIN_TOKEN_SECRET
    cronSecret: '',          // NUXT_CRON_SECRET
    public: {
      siteUrl: 'https://irekiak.eus',
    },
  },
})
