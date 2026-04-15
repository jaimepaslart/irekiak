<script setup lang="ts">
import { galleries } from '@data/galleries'
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

    <!-- Hero -->
    <section class="min-h-screen flex items-center justify-center px-6 pt-24">
      <div class="max-w-4xl mx-auto text-center">
        <p class="text-xs uppercase tracking-[0.4em] text-white/40 mb-10 font-mono animate-fade-in">
          Gallery Weekend
        </p>

        <h1 class="md:hidden animate-fade-in-up" style="animation-delay: 100ms">
          Irekiak
        </h1>
        <img
          src="/images/irekiak-logo-white.png"
          alt="Irekiak"
          class="hidden md:block h-auto w-full max-w-[500px] mx-auto mb-8 animate-fade-in-up"
          style="animation-delay: 100ms"
        >

        <p class="text-lg md:text-xl text-white/70 mb-2 animate-fade-in-up" style="animation-delay: 200ms">
          Donostia / San Sebastián
        </p>

        <p class="text-xl md:text-2xl text-white font-mono font-bold mb-14 animate-fade-in-up" style="animation-delay: 300ms">
          {{ currentEdition.dateRangeLabel }}
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style="animation-delay: 400ms">
          <NuxtLink
            :to="localePath('/galleries')"
            class="px-8 py-3 text-sm font-medium bg-white text-[var(--color-edition)]
                   scale-press transition-all duration-300 hover:bg-white/90"
          >
            {{ t('nav.galleries') }}
          </NuxtLink>
          <NuxtLink
            :to="localePath('/programme')"
            class="px-8 py-3 text-sm font-medium border border-white/40 text-white
                   scale-press transition-all duration-300 hover:bg-white/10 hover:border-white"
          >
            {{ t('nav.programme') }}
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Gallery Pills -->
    <section class="py-20 px-6 md:px-12 bg-edition-dark">
      <div class="max-w-[1200px] mx-auto">
        <div class="reveal-on-scroll mb-12 text-center">
          <p class="text-xs uppercase tracking-[0.2em] text-white/40 font-mono mb-3">
            {{ galleries.length }} {{ t('nav.galleries') }}
          </p>
        </div>

        <div class="reveal-on-scroll">
          <GalleryPills :galleries="galleries" />
        </div>
      </div>
    </section>

    <!-- Expositions -->
    <section class="py-24 md:py-32 px-6 md:px-12">
      <div class="max-w-[1200px] mx-auto">
        <div class="reveal-on-scroll mb-16">
          <h2>{{ t('home.galleries') }}</h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <GalleryCard
            v-for="gallery in galleries"
            :key="gallery.id"
            :gallery="gallery"
            class="reveal-on-scroll"
          />
        </div>

        <div class="reveal-on-scroll mt-16 text-center">
          <NuxtLink
            :to="localePath('/galleries')"
            class="group inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
          >
            {{ t('common.learnMore') }} <span class="arrow-nudge">&rarr;</span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Programme -->
    <section class="py-24 md:py-32 px-6 md:px-12 bg-edition-dark">
      <div class="max-w-[1200px] mx-auto">
        <div class="reveal-on-scroll mb-16">
          <p class="text-xs uppercase tracking-[0.2em] text-white/40 font-mono mb-3">
            {{ currentEdition.dateRangeLabelShort }}
          </p>
          <h2>{{ t('nav.programme') }}</h2>
        </div>

        <div class="reveal-on-scroll grid grid-cols-1 sm:grid-cols-3 gap-6">
          <NuxtLink
            v-for="day in currentEdition.days"
            :key="day.id"
            :to="localePath('/programme')"
            class="group p-6 md:p-8 border border-white/15 rounded-sm
                   transition-all duration-300 hover:bg-white/10 hover:border-white/30"
          >
            <p class="text-3xl md:text-4xl font-bold mb-2 text-white">{{ day.dateShort }}</p>
            <p class="text-xs text-white/40 uppercase tracking-wider font-mono mb-4">{{ tr(day.label) }}</p>
            <p class="text-sm text-white/60 font-mono">{{ day.hours }}</p>
          </NuxtLink>
        </div>

        <div class="reveal-on-scroll mt-16 text-center">
          <NuxtLink
            :to="localePath('/programme')"
            class="group inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
          >
            {{ t('common.learnMore') }} <span class="arrow-nudge">&rarr;</span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Visites guidees -->
    <section class="py-24 md:py-32 px-6 md:px-12">
      <div class="max-w-[1200px] mx-auto">
        <div class="reveal-on-scroll mb-16">
          <p class="text-xs uppercase tracking-[0.2em] text-white/40 font-mono mb-3">
            {{ t('common.free') }}
          </p>
          <h2>{{ t('nav.tours') }}</h2>
        </div>

        <div class="reveal-on-scroll grid grid-cols-1 md:grid-cols-3 gap-6">
          <NuxtLink
            v-for="route in tourRoutes"
            :key="route.id"
            :to="localePath(`/visites/${route.slug}`)"
            class="group p-6 border border-white/15 rounded-sm
                   transition-all duration-300 hover:bg-white/10 hover:border-white/30"
          >
            <div class="flex items-center gap-3 mb-4">
              <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: route.color }" />
              <h3 class="text-lg font-semibold text-white">{{ tr(route.name) }}</h3>
            </div>
            <p class="text-sm text-white/60 mb-4 line-clamp-2">{{ tr(route.description) }}</p>
            <div class="flex gap-3 text-xs text-white/40 font-mono">
              <span>{{ tr(route.duration) }}</span>
              <span>&middot;</span>
              <span>{{ tr(route.distance) }}</span>
            </div>
          </NuxtLink>
        </div>

        <div class="reveal-on-scroll mt-12 text-center">
          <NuxtLink
            :to="localePath('/visites')"
            class="inline-block px-8 py-3 text-sm font-medium bg-white text-[var(--color-edition)]
                   transition-all duration-300 hover:bg-white/90"
          >
            {{ t('common.register') }}
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Carte preview -->
    <section class="py-24 md:py-32 px-6 md:px-12 bg-edition-dark">
      <div class="max-w-[1200px] mx-auto text-center reveal-on-scroll">
        <p class="text-xs uppercase tracking-[0.2em] text-white/40 font-mono mb-3">
          Donostia / San Sebastián
        </p>
        <h2 class="mb-8">{{ t('nav.map') }}</h2>
        <p class="text-white/60 mb-10 max-w-lg mx-auto">
          8 galeries, 3 routes, 1 ville
        </p>
        <NuxtLink
          :to="localePath('/carte')"
          class="inline-block px-8 py-3 text-sm font-medium border border-white/40 text-white
                 transition-all duration-300 hover:bg-white/10 hover:border-white"
        >
          {{ t('nav.map') }} &rarr;
        </NuxtLink>
      </div>
    </section>

    <!-- A propos -->
    <section class="py-24 md:py-32 px-6 md:px-12">
      <div class="max-w-2xl mx-auto text-center reveal-on-scroll">
        <h2 class="mb-8">Irekiak</h2>
        <p class="text-white/70 leading-relaxed mb-4">
          Irekiak Gallery Weekend, Donostiako arte galeria astebururaren ekitaldi ofiziala.
          2010ean sortua, DAGGE (Donostiako Arte Galeria Guztien Elkartea), Tabakalera eta DonostiKultura-k antolatua.
        </p>
        <NuxtLink
          :to="localePath('/a-propos')"
          class="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mt-4"
        >
          {{ t('common.learnMore') }} &rarr;
        </NuxtLink>
      </div>
    </section>

    <!-- Partenaires -->
    <section class="py-16 px-6 md:px-12 border-t border-white/10">
      <div class="max-w-[1200px] mx-auto reveal-on-scroll">
        <SharedPartnersSection />
      </div>
    </section>

    <!-- Contact -->
    <section class="py-20 px-6 md:px-12 bg-edition-dark">
      <div class="max-w-[1200px] mx-auto reveal-on-scroll grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
        <div>
          <p class="text-xs uppercase tracking-wider text-white/30 font-mono mb-3">Email</p>
          <a href="mailto:irekiak@irekiak.eus" class="text-white hover:text-white/80 transition-colors">irekiak@irekiak.eus</a>
        </div>
        <div>
          <p class="text-xs uppercase tracking-wider text-white/30 font-mono mb-3">Instagram</p>
          <a href="https://www.instagram.com/irekiak.gallery.weekend" target="_blank" rel="noopener noreferrer" class="text-white hover:text-white/80 transition-colors">
            @irekiak.gallery.weekend
          </a>
        </div>
        <div>
          <p class="text-xs uppercase tracking-wider text-white/30 font-mono mb-3">Donostia</p>
          <p class="text-white/60">Alkolea Pasaia 1, 20012</p>
        </div>
      </div>
    </section>
  </div>
</template>
