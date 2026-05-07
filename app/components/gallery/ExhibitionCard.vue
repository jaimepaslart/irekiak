<script setup lang="ts">
import type { ExhibitionCard } from '#types/exhibition'
import { isUploadedImage } from '~/utils/image-source'
import { splitParagraphs } from '~/utils/text'

interface Props {
  card: ExhibitionCard
}
const props = defineProps<Props>()

const tr = useTranslated()
const { t } = useI18n()

const description = computed(() => tr(props.card.description))
const paragraphs = computed(() => splitParagraphs(description.value))
const title = computed(() => tr(props.card.title))
const alt = computed(() => `${props.card.artist} — ${title.value}`)
const isUploaded = computed(() => isUploadedImage(props.card.imageUrl))

// SSR-stable heuristic: a card needs the toggle when its description is
// long enough to spill past the collapsed clamp (~6 lines @ text-sm).
// Computed at render time so the button renders identically on server
// and client — no hydration flash.
const needsToggle = computed(() =>
  paragraphs.value.length > 1 || description.value.length > 280,
)

const expanded = ref(false)
const descId = computed(() => `exh-desc-${props.card.id}`)
</script>

<template>
  <article class="group flex flex-col h-full">
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

    <div
      :id="descId"
      class="desc-clamp relative space-y-3 text-white/70 leading-relaxed text-sm md:text-[15px] overflow-hidden"
      :class="expanded || !needsToggle ? 'desc-clamp--open' : 'desc-clamp--collapsed'"
    >
      <p v-for="(p, i) in paragraphs" :key="i">{{ p }}</p>
    </div>

    <button
      v-if="needsToggle"
      type="button"
      :aria-expanded="expanded"
      :aria-controls="descId"
      class="mt-3 inline-flex items-center gap-2 text-xs text-white/55 hover:text-gold font-mono uppercase tracking-[0.18em] transition-colors focus-gold self-start"
      @click="expanded = !expanded"
    >
      {{ expanded ? t('home.exhibitionsReadLess') : t('home.exhibitionsReadMore') }}
      <span class="text-base leading-none" aria-hidden="true">{{ expanded ? '−' : '+' }}</span>
    </button>

    <a
      v-if="card.externalUrl"
      :href="card.externalUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="mt-auto pt-5 inline-flex items-center gap-2 text-xs text-white/50 hover:text-gold font-mono uppercase tracking-[0.18em] transition-colors arrow-nudge-parent focus-gold self-start"
    >
      {{ t('home.exhibitionsVisitSite') }}
      <span class="arrow-nudge" aria-hidden="true">→</span>
    </a>
  </article>
</template>

<style scoped>
.desc-clamp {
  transition: max-height 400ms cubic-bezier(0.4, 0, 0.2, 1);
}

.desc-clamp--collapsed {
  max-height: 11rem;
}

.desc-clamp--open {
  max-height: 100rem;
}

/* Fade the last lines of the collapsed text into the section background so
   the cut-off feels intentional rather than abrupt. */
.desc-clamp--collapsed::after {
  content: '';
  position: absolute;
  inset: auto 0 0 0;
  height: 4rem;
  background: linear-gradient(to bottom, transparent, var(--color-edition-dark));
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .desc-clamp {
    transition: none;
  }
}
</style>
