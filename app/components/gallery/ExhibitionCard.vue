<script setup lang="ts">
import type { ExhibitionCard } from '#types/exhibition'
import { splitParagraphs } from '~/utils/text'

interface Props {
  card: ExhibitionCard
}
const props = defineProps<Props>()

const tr = useTranslated()
const { t } = useI18n()

const paragraphs = computed(() => splitParagraphs(tr(props.card.description)))
const title = computed(() => tr(props.card.title))
const alt = computed(() => `${props.card.artist} — ${title.value}`)
// Upload endpoint serves images already resized / webp-encoded; skip NuxtImg's
// ipx optimisation pass for those (static /images/* still benefit from it).
const isUploaded = computed(() => props.card.imageUrl.startsWith('/api/'))
</script>

<template>
  <article class="group flex flex-col">
    <div class="relative w-full aspect-[4/5] overflow-hidden bg-white/5 rounded-sm mb-5">
      <NuxtImg
        v-if="!isUploaded"
        :src="card.imageUrl"
        :alt="alt"
        format="webp"
        loading="lazy"
        class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
        sizes="sm:100vw md:50vw lg:33vw"
      />
      <img
        v-else
        :src="card.imageUrl"
        :alt="alt"
        loading="lazy"
        class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
      >
    </div>

    <p class="text-xs uppercase tracking-[0.2em] text-white/40 font-mono mb-3">
      {{ card.number }}. {{ card.galleryName.toUpperCase() }}
    </p>

    <h3 class="font-serif text-2xl text-white leading-tight mb-2" style="font-weight: 500; letter-spacing: -0.01em;">
      {{ title }}
    </h3>

    <p class="text-gold font-medium mb-4">{{ card.artist }}</p>

    <div class="space-y-3 text-white/70 leading-relaxed text-sm md:text-[15px]">
      <p v-for="(p, i) in paragraphs" :key="i">{{ p }}</p>
    </div>

    <a
      v-if="card.externalUrl"
      :href="card.externalUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="mt-5 inline-flex items-center gap-2 text-xs text-white/50 hover:text-gold font-mono uppercase tracking-[0.18em] transition-colors arrow-nudge-parent focus-gold self-start"
    >
      {{ t('home.exhibitionsVisitSite') }}
      <span class="arrow-nudge" aria-hidden="true">→</span>
    </a>
  </article>
</template>
