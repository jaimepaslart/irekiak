<script setup lang="ts">
import { currentEdition } from '@data/editions'

const { t } = useI18n()
const localePath = useLocalePath()
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="border-t border-white/10 bg-edition-dark py-16 px-6 md:px-12" role="contentinfo">
    <div class="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
      <div>
        <img src="/logo.webp" alt="Irekiak" class="h-5 w-auto mb-4">
        <p class="text-sm text-white/60 leading-relaxed">
          Gallery Weekend<br>
          Donostia / San Sebastián
        </p>
        <p class="text-sm text-white/40 mt-4 font-mono">
          {{ currentEdition.dateRangeLabel }}
        </p>
      </div>

      <div>
        <h4 class="text-xs font-medium uppercase tracking-wider text-white/40 mb-4">
          {{ t('footer.links') }}
        </h4>
        <ul class="space-y-3">
          <li><NuxtLink :to="localePath('/galleries')" class="text-sm text-white/60 hover:text-white transition-colors">{{ t('nav.galleries') }}</NuxtLink></li>
          <li><NuxtLink :to="localePath('/programme')" class="text-sm text-white/60 hover:text-white transition-colors">{{ t('nav.programme') }}</NuxtLink></li>
          <li><NuxtLink :to="localePath('/visites')" class="text-sm text-white/60 hover:text-white transition-colors">{{ t('nav.tours') }}</NuxtLink></li>
          <li><NuxtLink :to="localePath('/a-propos')" class="text-sm text-white/60 hover:text-white transition-colors">{{ t('nav.about') }}</NuxtLink></li>
          <li><NuxtLink :to="localePath('/accessibilite')" class="text-sm text-white/60 hover:text-white transition-colors">{{ t('nav.accessibility') }}</NuxtLink></li>
          <li><NuxtLink :to="localePath('/retrouver')" class="text-sm text-white/60 hover:text-white transition-colors">{{ t('nav.findBooking') }}</NuxtLink></li>
        </ul>
      </div>

      <div>
        <h4 class="text-xs font-medium uppercase tracking-wider text-white/40 mb-4">
          {{ t('footer.contact') }}
        </h4>
        <ul class="space-y-3 text-sm text-white/60">
          <li><a href="mailto:irekiak@irekiak.eus" class="hover:text-white transition-colors">irekiak@irekiak.eus</a></li>
          <li><a href="https://www.instagram.com/irekiak.gallery.weekend" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors">@irekiak.gallery.weekend</a></li>
          <li class="pt-2 text-white/40">Alkolea Pasaia 1<br>20012 Donostia / San Sebastián</li>
        </ul>
      </div>
    </div>

    <div class="max-w-[1200px] mx-auto mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/40">
      <p>&copy; {{ currentYear }} Irekiak Gallery Weekend. DAGGE.</p>
      <NuxtLink :to="localePath('/contact')" class="hover:text-white transition-colors">{{ t('nav.contact') }}</NuxtLink>
    </div>
  </footer>
</template>
