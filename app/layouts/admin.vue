<script setup lang="ts">
const STORAGE_KEY = 'irekiak_admin_token'
const STORAGE_KEY_TS = 'irekiak_admin_token_ts'
const SESSION_TIMEOUT_MS = 60 * 60 * 1000

const token = ref('')
const tokenInput = ref('')
const errorMessage = ref<string | null>(null)
const navOpen = ref(false)

function readStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  const stored = window.localStorage.getItem(STORAGE_KEY)
  const ts = window.localStorage.getItem(STORAGE_KEY_TS)
  const age = ts ? Date.now() - Number(ts) : Infinity
  if (stored && age < SESSION_TIMEOUT_MS) return stored
  if (stored) {
    window.localStorage.removeItem(STORAGE_KEY)
    window.localStorage.removeItem(STORAGE_KEY_TS)
  }
  return null
}

onMounted(() => {
  const t = readStoredToken()
  if (t) token.value = t
  else errorMessage.value = null
})

async function login() {
  const value = tokenInput.value.trim()
  if (!value) return
  // Verify via a lightweight endpoint before persisting
  try {
    await $fetch('/api/admin/stats', { headers: { 'x-admin-token': value } })
  }
  catch (err: unknown) {
    const code = (err as { statusCode?: number })?.statusCode
    errorMessage.value = code === 401 ? 'Token invalide.' : 'Erreur serveur.'
    return
  }
  token.value = value
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, value)
    window.localStorage.setItem(STORAGE_KEY_TS, String(Date.now()))
  }
  tokenInput.value = ''
  errorMessage.value = null
}

function logout() {
  token.value = ''
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY)
    window.localStorage.removeItem(STORAGE_KEY_TS)
  }
  navigateTo('/admin/bookings')
}

// Expose token to child pages via provide/inject
provide('adminToken', token)
provide('adminLogout', logout)

const navItems = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/bookings', label: 'Réservations' },
  { to: '/admin/bookings/new', label: '+ Nouveau' },
  { to: '/admin/checkin', label: 'Check-in' },
  { to: '/admin/galleries', label: 'Galeries' },
  { to: '/admin/blast', label: 'Blast' },
  { to: '/admin/emails', label: 'Emails' },
  { to: '/admin/settings', label: 'Settings' },
  { to: '/admin/audit', label: 'Audit' },
]

// Keyboard shortcuts: b = bookings, c = create, k = check-in, d = dashboard,
// s = settings, a = audit, ? = help modal, / = focus search
const helpOpen = ref(false)
function handleKeyDown(e: KeyboardEvent) {
  if (!token.value) return
  const target = e.target as HTMLElement | null
  const tag = target?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) {
    if (e.key === 'Escape') (target as HTMLInputElement).blur()
    return
  }
  if (e.metaKey || e.ctrlKey || e.altKey) return
  switch (e.key) {
    case 'd': navigateTo('/admin'); break
    case 'b': navigateTo('/admin/bookings'); break
    case 'c': navigateTo('/admin/bookings/new'); break
    case 'k': navigateTo('/admin/checkin'); break
    case 's': navigateTo('/admin/settings'); break
    case 'a': navigateTo('/admin/audit'); break
    case '?': helpOpen.value = true; break
    case '/': {
      e.preventDefault()
      const search = document.querySelector<HTMLInputElement>('input[type="search"]')
      search?.focus()
      break
    }
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') window.addEventListener('keydown', handleKeyDown)
})
onBeforeUnmount(() => {
  if (typeof window !== 'undefined') window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="min-h-screen bg-[var(--color-edition)] text-white">
    <!-- Login gate -->
    <div v-if="!token" class="max-w-md mx-auto mt-24 px-6 pt-20">
      <h1 class="text-2xl mb-2">Admin · Irekiak</h1>
      <p class="text-sm text-white/50 mb-8">Authentification requise</p>
      <form class="space-y-4" @submit.prevent="login">
        <label class="block">
          <span class="text-xs uppercase tracking-wider text-white/40 font-mono block mb-2">Admin token</span>
          <input
            v-model="tokenInput"
            type="password"
            class="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-sm text-white focus:outline-none focus:border-white/40"
            placeholder="NUXT_ADMIN_TOKEN_SECRET"
            autocomplete="current-password"
          >
        </label>
        <button type="submit" class="w-full px-4 py-3 bg-white text-[var(--color-edition)] font-medium rounded-sm hover:bg-white/90 transition-colors">
          Se connecter
        </button>
        <p v-if="errorMessage" class="text-sm text-red-300">{{ errorMessage }}</p>
      </form>
    </div>

    <!-- Shell -->
    <div v-else>
      <!-- Top bar -->
      <header class="sticky top-0 z-50 bg-[var(--color-edition-dark)]/95 backdrop-blur border-b border-white/10">
        <div class="max-w-[1400px] mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <button type="button" class="md:hidden p-2" :aria-label="navOpen ? 'Fermer' : 'Menu'" @click="navOpen = !navOpen">
              <svg v-if="!navOpen" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <NuxtLink to="/admin" class="font-mono text-sm uppercase tracking-wider">Irekiak · Admin</NuxtLink>
            <nav class="hidden md:flex items-center gap-1">
              <NuxtLink
                v-for="item in navItems"
                :key="item.to"
                :to="item.to"
                class="px-3 py-1.5 text-sm rounded-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                active-class="text-white bg-white/10"
              >
                {{ item.label }}
              </NuxtLink>
            </nav>
          </div>
          <button type="button" class="text-xs px-3 py-1.5 border border-red-400/30 text-red-300 rounded-sm hover:bg-red-500/10" @click="logout">
            Logout
          </button>
        </div>
        <!-- Mobile nav -->
        <Transition name="fade">
          <nav v-if="navOpen" class="md:hidden border-t border-white/10 bg-[var(--color-edition-dark)]">
            <div class="max-w-[1400px] mx-auto px-4 py-2 flex flex-col">
              <NuxtLink
                v-for="item in navItems"
                :key="item.to"
                :to="item.to"
                class="px-3 py-3 text-sm text-white/70 hover:text-white border-b border-white/5"
                active-class="text-white"
                @click="navOpen = false"
              >
                {{ item.label }}
              </NuxtLink>
            </div>
          </nav>
        </Transition>
      </header>

      <main class="max-w-[1400px] mx-auto px-4 md:px-8 py-6 md:py-10">
        <slot />
      </main>

      <!-- Keyboard shortcuts help modal -->
      <Transition name="fade">
        <div v-if="helpOpen" class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm px-6" @click.self="helpOpen = false">
          <div class="max-w-md w-full bg-[var(--color-edition)] border border-white/15 rounded-sm p-6 md:p-8">
            <h3 class="text-lg font-semibold mb-4">Raccourcis clavier</h3>
            <dl class="space-y-2 text-sm">
              <div class="flex justify-between"><dt><kbd class="kbd">d</kbd></dt><dd>Dashboard</dd></div>
              <div class="flex justify-between"><dt><kbd class="kbd">b</kbd></dt><dd>Réservations</dd></div>
              <div class="flex justify-between"><dt><kbd class="kbd">c</kbd></dt><dd>Nouvelle réservation</dd></div>
              <div class="flex justify-between"><dt><kbd class="kbd">k</kbd></dt><dd>Check-in</dd></div>
              <div class="flex justify-between"><dt><kbd class="kbd">s</kbd></dt><dd>Settings</dd></div>
              <div class="flex justify-between"><dt><kbd class="kbd">a</kbd></dt><dd>Audit log</dd></div>
              <div class="flex justify-between"><dt><kbd class="kbd">/</kbd></dt><dd>Focus recherche</dd></div>
              <div class="flex justify-between"><dt><kbd class="kbd">?</kbd></dt><dd>Cette aide</dd></div>
              <div class="flex justify-between"><dt><kbd class="kbd">Esc</kbd></dt><dd>Sortir d'un champ</dd></div>
            </dl>
            <div class="mt-6 text-right">
              <button type="button" class="px-4 py-2 text-sm bg-white text-[var(--color-edition)] rounded-sm hover:bg-white/90" @click="helpOpen = false">Fermer</button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 200ms ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.kbd {
  display: inline-block;
  padding: 2px 8px;
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  font-size: 12px;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.1);
}
</style>
