<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { t, locale, setLocale } = useAdminT()
const router = useRouter()
const adminLogout = inject<() => void>('adminLogout')

const PARCOURS_ALIASES = ['parcours', 'recorridos', 'checkin']

const query = ref('')
const selectedIndex = ref(0)
const inputRef = useTemplateRef<HTMLInputElement>('inputRef')
const listRef = useTemplateRef<HTMLDivElement>('listRef')

interface PaletteItem {
  id: string
  label: string
  sublabel: string
  icon: string
  shortcut?: string
  aliases?: string[]
  action: () => void
}

function close() {
  emit('update:modelValue', false)
}

function go(path: string) {
  router.push(path)
  close()
}

// Labels courts (pas dérivés des noms de galeries complets volontairement).
const PARCOURS_ENTRIES: ReadonlyArray<{ slug: string, label: string }> = [
  { slug: 'arteko-cibrian', label: 'Arteko · Cibrián' },
  { slug: 'la-central-sakana', label: 'La Central · Sakana' },
  { slug: 'arteztu-ekain', label: 'Arteztu · Ekain' },
]

const items = computed<PaletteItem[]>(() => {
  const nav = t('commandPalette.categoryNav')
  const action = t('commandPalette.categoryAction')
  const parcoursSub = t('nav.parcours')
  return [
    { id: 'nav-dashboard', label: t('nav.dashboard'), sublabel: nav, icon: '📊', shortcut: 'd', action: () => go('/admin'), aliases: ['panel', 'tableau', 'dashboard'] },
    { id: 'nav-bookings', label: t('nav.bookings'), sublabel: nav, icon: '📋', shortcut: 'b', action: () => go('/admin/bookings'), aliases: ['reservas', 'reservations', 'bookings'] },
    { id: 'nav-parcours', label: t('nav.parcours'), sublabel: nav, icon: '📍', shortcut: 'k', action: () => go('/admin/parcours'), aliases: [...PARCOURS_ALIASES, 'tours', 'routes', 'check-in'] },
    ...PARCOURS_ENTRIES.map<PaletteItem>(p => ({
      id: `nav-parcours-${p.slug}`,
      label: p.label,
      sublabel: parcoursSub,
      icon: '📍',
      action: () => go(`/admin/parcours/${p.slug}`),
      aliases: PARCOURS_ALIASES,
    })),
    { id: 'nav-galleries', label: t('nav.galleries'), sublabel: nav, icon: '🏛️', action: () => go('/admin/galleries') },
    { id: 'nav-blast', label: t('nav.blast'), sublabel: nav, icon: '✉', action: () => go('/admin/blast') },
    { id: 'nav-emails', label: t('nav.emails'), sublabel: nav, icon: '✉', action: () => go('/admin/emails') },
    { id: 'nav-settings', label: t('nav.settings'), sublabel: nav, icon: '⚙', shortcut: 's', action: () => go('/admin/settings') },
    { id: 'nav-audit', label: t('nav.audit'), sublabel: nav, icon: '📜', shortcut: 'a', action: () => go('/admin/audit') },
    { id: 'nav-new-booking', label: t('nav.newBooking'), sublabel: nav, icon: '➕', shortcut: 'c', action: () => go('/admin/bookings/new') },
    { id: 'action-toggle-locale', label: locale.value === 'fr' ? 'Español' : 'Français', sublabel: action, icon: '🌐', action: () => { setLocale(locale.value === 'fr' ? 'es' : 'fr'); close() } },
    { id: 'action-help', label: t('shortcuts.title'), sublabel: action, icon: '?', shortcut: '?', action: () => { close(); window.dispatchEvent(new CustomEvent('admin:open-help')) } },
    { id: 'action-logout', label: t('auth.logout'), sublabel: action, icon: '⎋', action: () => { close(); adminLogout?.() } },
  ]
})

const filtered = computed<PaletteItem[]>(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return items.value
  return items.value.filter((it) => {
    if (it.label.toLowerCase().includes(q)) return true
    if (it.sublabel.toLowerCase().includes(q)) return true
    if (it.aliases?.some(a => a.toLowerCase().includes(q))) return true
    return false
  })
})

watch(() => props.modelValue, async (open) => {
  if (open) {
    query.value = ''
    selectedIndex.value = 0
    await nextTick()
    inputRef.value?.focus()
  }
})

watch(query, () => {
  selectedIndex.value = 0
})

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (filtered.value.length === 0) return
    selectedIndex.value = (selectedIndex.value + 1) % filtered.value.length
    scrollToSelected()
  }
  else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (filtered.value.length === 0) return
    selectedIndex.value = (selectedIndex.value - 1 + filtered.value.length) % filtered.value.length
    scrollToSelected()
  }
  else if (e.key === 'Enter') {
    e.preventDefault()
    const item = filtered.value[selectedIndex.value]
    if (item) item.action()
  }
  else if (e.key === 'Escape') {
    e.preventDefault()
    close()
  }
}

function scrollToSelected() {
  nextTick(() => {
    const list = listRef.value
    if (!list) return
    const el = list.querySelector<HTMLElement>(`[data-idx="${selectedIndex.value}"]`)
    if (el) el.scrollIntoView({ block: 'nearest' })
  })
}

function onItemClick(idx: number) {
  selectedIndex.value = idx
  const item = filtered.value[idx]
  if (item) item.action()
}
</script>

<template>
  <Transition name="palette-fade">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-32 px-4"
      @click.self="close"
    >
      <div class="w-full max-w-xl bg-[var(--color-edition-dark)] border border-white/15 rounded-md shadow-2xl overflow-hidden">
        <div class="flex items-center border-b border-white/10">
          <span class="pl-5 text-white/40" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input
            ref="inputRef"
            v-model="query"
            type="text"
            class="w-full px-3 py-4 bg-transparent text-white text-base focus:outline-none placeholder:text-white/40"
            :placeholder="t('commandPalette.placeholder')"
            autocomplete="off"
            spellcheck="false"
            @keydown="onKeyDown"
          >
        </div>
        <div ref="listRef" class="max-h-[336px] overflow-y-auto">
          <div v-if="filtered.length === 0" class="px-5 py-8 text-center text-sm text-white/50">
            {{ t('commandPalette.empty') }}
          </div>
          <div
            v-for="(item, idx) in filtered"
            :key="item.id"
            :data-idx="idx"
            class="flex items-center gap-3 px-5 py-3 cursor-pointer text-white/70"
            :class="idx === selectedIndex ? 'bg-white/5 text-white' : ''"
            @mousemove="selectedIndex = idx"
            @click="onItemClick(idx)"
          >
            <span class="w-6 text-center text-base" aria-hidden="true">{{ item.icon }}</span>
            <span class="flex-1 min-w-0">
              <span class="block text-sm truncate">{{ item.label }}</span>
              <span class="block text-xs text-white/40 truncate">{{ item.sublabel }}</span>
            </span>
            <kbd v-if="item.shortcut" class="palette-kbd">{{ item.shortcut }}</kbd>
          </div>
        </div>
        <div class="border-t border-white/10 px-5 py-2 text-[11px] text-white/40 font-mono">
          {{ t('commandPalette.navHint') }}
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.palette-fade-enter-active, .palette-fade-leave-active { transition: opacity 150ms ease; }
.palette-fade-enter-from, .palette-fade-leave-to { opacity: 0; }
.palette-kbd {
  display: inline-block;
  padding: 1px 6px;
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  font-size: 11px;
  background-color: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 3px;
  color: rgba(255, 255, 255, 0.7);
}
</style>
