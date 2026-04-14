<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

usePageSeo('about')
useScrollReveal()
</script>

<template>
  <div class="max-w-3xl mx-auto px-6 md:px-12 py-24 pt-28">
    <h1 class="mb-12 reveal-on-scroll">Irekiak</h1>

    <div class="space-y-12">
      <div class="reveal-on-scroll">
        <p class="text-white/70 leading-relaxed text-lg">
          Irekiak Gallery Weekend, Donostiako arte galeria astebururaren ekitaldi ofiziala.
          2010ean sortua, DAGGE (Donostiako Arte Galeria Guztien Elkartea), Tabakalera
          eta DonostiKultura-k antolatua.
        </p>
      </div>

      <div class="reveal-on-scroll border-t border-white/10 pt-12">
        <h2 class="mb-6">Gallery Weekend</h2>
        <p class="text-white/70 leading-relaxed">
          Urtero, irailaren bigarren astebururan, Donostiako arte galeriak ateak irekitzen
          dituzte bisitari guztientzat. Erakusketak, bisita gidatuak, emanaldiak eta topaketak
          arte garaikidearen inguruan.
        </p>
      </div>

      <div class="reveal-on-scroll border-t border-white/10 pt-12">
        <h2 class="mb-6">DAGGE</h2>
        <p class="text-white/70 leading-relaxed mb-4">
          Donostiako Arte Galeria Guztien Elkartea. Kide galeriak:
        </p>
        <div class="flex flex-wrap gap-3">
          <span v-for="g in ['Arteko', 'Arteztu', 'Cibrián', 'Ekain', 'Villa Magdalena']" :key="g"
            class="px-4 py-2 border border-white/20 text-sm text-white/70">
            {{ g }}
          </span>
        </div>
      </div>

      <div class="reveal-on-scroll border-t border-white/10 pt-12">
        <h2 class="mb-6">Kolaboratzaileak</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div v-for="partner in ['Tabakalera', 'DonostiKultura', 'Donostia Udala', 'San Telmo Museoa', 'Kursaal', 'Kutxa Fundazioa']" :key="partner"
            class="p-4 border border-white/10 text-center">
            <p class="text-sm text-white/60">{{ partner }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
