<script setup lang="ts">
import type { Ref } from 'vue'

interface GaleristeRouteMeta {
  routeSlug: string
  routeName: { eu: string, es: string, fr: string, en: string }
  galleries: Array<{ id: string, name: { eu: string, es: string, fr: string, en: string }, color: string }>
}

const { t, locale, setLocale } = useAdminT()
const route = useRoute()
const router = useRouter()

const routeSlug = computed(() => String(route.params.route ?? ''))
const routeMeta = useState<GaleristeRouteMeta | null>(
  `galeriste-meta-${routeSlug.value}`,
  () => null,
)

const displayName = computed(() => {
  if (!routeMeta.value) return ''
  const n = routeMeta.value.routeName
  return n[locale.value] || n.fr || n.eu
})

function logout(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(`irekiak_galeriste_key_${routeSlug.value}`)
  }
  routeMeta.value = null
  void router.replace('/')
}

provide('galeristeRouteMeta', routeMeta as Ref<GaleristeRouteMeta | null>)
provide('galeristeLogout', logout)
</script>

<template>
  <div class="min-h-screen bg-[var(--color-edition)] text-white">
    <header class="sticky top-0 z-50 bg-[var(--color-edition-dark)]/95 backdrop-blur border-b border-white/10">
      <div class="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <span class="font-mono text-xs uppercase tracking-wider text-white/60 whitespace-nowrap">Irekiak</span>
        <h1 v-if="displayName" class="text-base md:text-lg font-light truncate text-center flex-1">
          {{ displayName }}
        </h1>
        <span v-else class="flex-1" />
        <button
          v-if="routeMeta"
          type="button"
          class="text-xs px-2 py-1.5 text-white/60 hover:text-white transition-colors"
          @click="logout"
        >
          {{ t('galeriste.logout') }}
        </button>
      </div>
      <div class="max-w-2xl mx-auto px-4 pb-2 flex items-center justify-end gap-1 text-xs font-mono">
        <button
          type="button"
          :class="['px-2 py-1 rounded-sm transition-colors', locale === 'fr' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white']"
          @click="setLocale('fr')"
        >FR</button>
        <button
          type="button"
          :class="['px-2 py-1 rounded-sm transition-colors', locale === 'es' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white']"
          @click="setLocale('es')"
        >ES</button>
      </div>
    </header>

    <main class="max-w-2xl mx-auto px-4 py-6 md:py-10">
      <slot />
    </main>
  </div>
</template>
