<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

const scrolled = ref(false)
const mobileOpen = ref(false)

const navItems = [
  { key: 'galleries', path: '/galleries' },
  { key: 'programme', path: '/programme' },
  { key: 'tours', path: '/visites' },
  { key: 'map', path: '/carte' },
  { key: 'about', path: '/a-propos' },
  { key: 'contact', path: '/contact' },
] as const

let ticking = false
const onScroll = () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      scrolled.value = window.scrollY > 20
      ticking = false
    })
    ticking = true
  }
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <header
    class="fixed top-0 z-50 w-full transition-all duration-300"
    :class="scrolled
      ? 'bg-[var(--color-edition)]/95 backdrop-blur-sm border-b border-white/10'
      : 'bg-transparent'"
  >
    <nav class="flex items-center justify-between h-16 px-6 md:px-12 max-w-[1200px] mx-auto" aria-label="Main navigation">
      <NuxtLink :to="localePath('/')" class="block shrink-0">
        <span class="text-lg font-bold tracking-tight text-white md:hidden">Irekiak</span>
        <img
          src="/images/irekiak-logo-white.png"
          alt="Irekiak Gallery Weekend"
          class="hidden md:block h-8 w-auto"
        >
      </NuxtLink>

      <div class="hidden md:flex items-center gap-8">
        <NuxtLink
          v-for="item in navItems"
          :key="item.key"
          :to="localePath(item.path)"
          class="relative text-sm text-white/60 hover:text-white transition-colors duration-200
                 after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-white
                 after:transition-all after:duration-300 hover:after:w-full"
          active-class="text-white after:w-full"
        >
          {{ t(`nav.${item.key}`) }}
        </NuxtLink>
      </div>

      <div class="flex items-center gap-4">
        <LayoutLanguageSwitcher />

        <button
          class="md:hidden flex flex-col gap-1.5 p-2"
          :aria-label="mobileOpen ? t('a11y.closeMenu') : t('a11y.openMenu')"
          :aria-expanded="mobileOpen"
          @click="mobileOpen = !mobileOpen"
        >
          <span aria-hidden="true" class="block w-5 h-px bg-white transition-transform duration-300" :class="mobileOpen ? 'rotate-45 translate-y-[4px]' : ''" />
          <span aria-hidden="true" class="block w-5 h-px bg-white transition-opacity duration-300" :class="mobileOpen ? 'opacity-0' : ''" />
          <span aria-hidden="true" class="block w-5 h-px bg-white transition-transform duration-300" :class="mobileOpen ? '-rotate-45 -translate-y-[4px]' : ''" />
        </button>
      </div>
    </nav>

    <Transition name="fade">
      <div
        v-if="mobileOpen"
        class="md:hidden absolute inset-x-0 top-16 bg-[var(--color-edition)]/98 backdrop-blur-lg border-b border-white/10"
      >
        <div class="flex flex-col px-6 py-8 gap-6">
          <NuxtLink
            v-for="item in navItems"
            :key="item.key"
            :to="localePath(item.path)"
            class="text-lg text-white/60 hover:text-white transition-colors"
            active-class="text-white"
            @click="mobileOpen = false"
          >
            {{ t(`nav.${item.key}`) }}
          </NuxtLink>
        </div>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
