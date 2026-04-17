<script setup lang="ts">
import { tourRoutes } from '@data/tours'
import { currentEdition } from '@data/editions'

const { t } = useI18n()
const localePath = useLocalePath()
const tr = useTranslated()

useScrollReveal()
usePageSeo('home')
</script>

<template>
  <div>
    <!-- Ticker -->
    <div class="fixed top-16 z-40 w-full">
      <SharedOpeningTicker />
    </div>

    <!-- Hero : split asymétrique 5/7 -->
    <section class="relative grid grid-cols-1 lg:grid-cols-12 lg:min-h-[calc(100vh-4rem)] pt-24 lg:pt-0">
      <div class="lg:col-span-5 order-2 lg:order-1 flex flex-col justify-center px-6 md:px-12 lg:pl-16 py-12 lg:py-24">
        <p class="eyebrow mb-6 animate-fade-in-up" style="animation-delay: 80ms">
          {{ t('home.heroEyebrow') }}
        </p>
        <h1 class="sr-only">Irekiak</h1>
        <img
          src="/logo-big.webp"
          alt="Irekiak"
          class="h-auto w-full max-w-[200px] md:max-w-[240px] mb-8 animate-fade-in-up"
          style="animation-delay: 150ms"
        >
        <p class="font-serif text-white leading-[1.02] tracking-[-0.02em] mb-6 text-4xl md:text-5xl lg:text-6xl animate-fade-in-up" style="animation-delay: 220ms; font-weight: 400;">
          Gallery Weekend<br>
          <span class="italic text-white/80">Donostia · San Sebastián</span>
        </p>
        <p class="font-mono text-2xl md:text-3xl text-white tabular-nums mb-8 animate-fade-in-up" style="animation-delay: 300ms">
          {{ currentEdition.dateRangeLabel }}
        </p>
        <div class="h-px w-12 bg-[var(--color-accent-gold)] mb-8 animate-fade-in-up" style="animation-delay: 360ms" />
        <div class="flex flex-col sm:flex-row gap-4 sm:gap-5 animate-fade-in-up" style="animation-delay: 420ms">
          <NuxtLink
            :to="localePath('/galleries')"
            class="px-8 py-3 text-sm font-medium bg-white text-[var(--color-edition)] scale-press transition-colors duration-300 hover:bg-white/90 text-center"
          >
            {{ t('nav.galleries') }}
          </NuxtLink>
          <NuxtLink
            :to="localePath('/programme')"
            class="px-8 py-3 text-sm font-medium border border-white/40 text-white scale-press transition-colors duration-300 hover:bg-white/10 hover:border-white text-center"
          >
            {{ t('nav.programme') }}
          </NuxtLink>
        </div>
      </div>

      <div class="lg:col-span-7 order-1 lg:order-2 relative overflow-hidden bg-edition-dark">
        <NuxtImg
          src="/images/exhibitions/sugerencias-prusianas-monologo-prusiano-i.jpg"
          alt="Rafa Satrústegui — Sugerencias prusianas"
          format="webp"
          sizes="sm:100vw md:100vw lg:58vw"
          class="absolute inset-0 w-full h-full object-cover animate-fade-in-slow"
          loading="eager"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-[var(--color-edition)]/40 via-transparent to-transparent" aria-hidden="true" />
        <p class="absolute bottom-6 left-6 right-6 text-[10px] font-mono uppercase tracking-[0.22em] text-white/60 max-w-md">
          Rafa Satrústegui · <span class="italic normal-case tracking-normal font-serif text-white/75">Sugerencias prusianas</span> · Arteko
        </p>
      </div>
    </section>

    <!-- Expositions (éditorial, wrapper + GalleryExhibitionsSection embedded) -->
    <section class="py-24 md:py-40 px-6 md:px-12 bg-edition-dark">
      <div class="max-w-[1400px] mx-auto">
        <header class="mb-16 md:mb-24 max-w-3xl reveal-on-scroll">
          <p class="eyebrow mb-4">06 · {{ t('home.exhibitionsEyebrow') }}</p>
          <h2 class="font-serif text-5xl md:text-6xl lg:text-7xl leading-[1.02] tracking-[-0.02em] text-white mb-6" style="font-weight: 400;">
            {{ t('home.exhibitionsTitle') }}
          </h2>
          <p class="text-white/60 leading-relaxed text-lg">
            {{ t('home.exhibitionsSubtitle') }}
          </p>
        </header>
        <GalleryExhibitionsSection embedded />
      </div>
    </section>

    <!-- Programme · 3 jours en timeline -->
    <section class="py-24 md:py-32 px-6 md:px-12">
      <div class="max-w-[1400px] mx-auto">
        <header class="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-12 md:mb-16 reveal-on-scroll">
          <div>
            <p class="eyebrow mb-3">{{ currentEdition.dateRangeLabelShort }}</p>
            <h2 class="font-serif text-5xl md:text-6xl leading-[1.02] tracking-[-0.02em] text-white" style="font-weight: 400;">
              {{ t('nav.programme') }}
            </h2>
          </div>
          <NuxtLink
            :to="localePath('/programme')"
            class="text-sm text-white/60 hover:text-white transition-colors arrow-nudge-parent inline-flex items-center gap-2"
          >
            {{ t('common.learnMore') }} <span class="arrow-nudge">→</span>
          </NuxtLink>
        </header>
        <div class="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10 border-y border-white/10">
          <article
            v-for="(day, i) in currentEdition.days"
            :key="day.id"
            class="p-8 md:p-10 relative reveal-on-scroll"
            :style="{ transitionDelay: `${i * 80}ms` }"
          >
            <span class="eyebrow mb-6 block">{{ tr(day.label) }}</span>
            <p class="font-serif text-6xl md:text-7xl tabular-nums tracking-[-0.02em] text-white leading-none" style="font-weight: 400;">
              {{ day.dateShort }}
            </p>
            <p class="mt-6 font-mono text-xs uppercase tracking-[0.18em] text-white/60 tabular-nums">
              {{ day.hours }}
            </p>
            <p v-if="day.note" class="mt-3 text-sm text-white/45 italic font-serif">
              {{ tr(day.note) }}
            </p>
          </article>
        </div>
      </div>
    </section>

    <!-- Visites guidées avec map en background -->
    <section class="relative py-24 md:py-40 px-6 md:px-12 bg-edition-dark overflow-hidden">
      <img
        src="/images/galleries/map.png"
        alt=""
        class="absolute inset-0 w-full h-full object-cover opacity-[0.10] mix-blend-luminosity"
        aria-hidden="true"
      >
      <div class="absolute inset-0 bg-gradient-to-t from-[var(--color-edition-dark)] via-[var(--color-edition-dark)]/60 to-transparent" aria-hidden="true" />
      <div class="relative max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        <header class="lg:col-span-5 reveal-on-scroll">
          <p class="eyebrow mb-3 text-gold">{{ t('common.free') }}</p>
          <h2 class="font-serif text-5xl md:text-6xl leading-[1.02] tracking-[-0.02em] text-white mb-6" style="font-weight: 400;">
            {{ t('nav.tours') }}
          </h2>
          <p class="text-white/70 leading-relaxed mb-8 max-w-md">
            {{ t('home.toursSubtitle') }}
          </p>
          <NuxtLink
            :to="localePath('/visites')"
            class="inline-block px-8 py-3 text-sm font-medium bg-white text-[var(--color-edition)] scale-press hover:bg-white/90 transition-colors"
          >
            {{ t('common.register') }}
          </NuxtLink>
        </header>
        <ul class="lg:col-span-7 lg:border-l lg:border-white/10 lg:pl-12 space-y-8 reveal-on-scroll">
          <li v-for="route in tourRoutes" :key="route.id" class="group">
            <NuxtLink
              :to="localePath(`/visites/${route.slug}`)"
              class="flex items-start gap-5 focus-gold"
            >
              <span
                class="mt-2 w-3 h-3 rounded-full shrink-0 transition-transform duration-300 group-hover:scale-125"
                :style="{ backgroundColor: route.color }"
              />
              <div class="flex-1 min-w-0">
                <h3 class="font-serif text-2xl text-white group-hover:text-gold transition-colors mb-2" style="font-weight: 500; letter-spacing: -0.01em;">
                  {{ tr(route.name) }}
                </h3>
                <p class="text-sm text-white/55 mb-2 line-clamp-2 max-w-xl">
                  {{ tr(route.description) }}
                </p>
                <p class="text-[11px] font-mono uppercase tracking-[0.18em] text-white/35 tabular-nums">
                  {{ tr(route.duration) }} · {{ tr(route.distance) }}
                </p>
              </div>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </section>

    <!-- Colophon : About + Contact + Partners -->
    <section class="py-20 md:py-24 px-6 md:px-12 border-t border-white/10">
      <div class="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16">
        <div class="md:col-span-5 reveal-on-scroll">
          <p class="eyebrow mb-3">Irekiak</p>
          <p class="font-serif text-lg text-white/80 leading-relaxed">
            {{ t('home.aboutShort') }}
          </p>
          <NuxtLink
            :to="localePath('/a-propos')"
            class="mt-5 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors arrow-nudge-parent"
          >
            {{ t('common.learnMore') }} <span class="arrow-nudge">→</span>
          </NuxtLink>
        </div>
        <div class="md:col-span-4 md:col-start-7 reveal-on-scroll">
          <p class="eyebrow mb-3">Contact</p>
          <dl class="space-y-3 text-sm">
            <div class="flex flex-col">
              <dt class="sr-only">Email</dt>
              <dd>
                <a href="mailto:irekiak@irekiak.eus" class="text-white hover:text-gold transition-colors">
                  irekiak@irekiak.eus
                </a>
              </dd>
            </div>
            <div class="flex flex-col">
              <dt class="sr-only">Instagram</dt>
              <dd>
                <a href="https://www.instagram.com/irekiak.gallery.weekend" target="_blank" rel="noopener noreferrer" class="text-white hover:text-gold transition-colors">
                  @irekiak.gallery.weekend
                </a>
              </dd>
            </div>
            <div class="flex flex-col">
              <dt class="sr-only">{{ t('nav.map') }}</dt>
              <dd class="text-white/70">Alkolea Pasaia 1 · 20012 Donostia</dd>
            </div>
          </dl>
        </div>
        <div class="md:col-span-3 reveal-on-scroll">
          <p class="eyebrow mb-3">{{ t('home.partners') }}</p>
          <SharedPartnersSection class="!flex-col !items-start !gap-3 !justify-start" />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.animate-fade-in-slow {
  animation: fade-in 900ms cubic-bezier(0.23, 1, 0.32, 1) both;
}
@keyframes fade-in {
  from { opacity: 0 }
  to { opacity: 1 }
}
</style>
