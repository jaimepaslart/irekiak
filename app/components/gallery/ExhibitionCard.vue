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

// 280 chars ≈ 6 lines at text-sm in a 1/3-grid column — matches the
// collapsed max-height. SSR-stable so the button hydrates without flash.
const COLLAPSED_CHAR_THRESHOLD = 280

const description = computed(() => tr(props.card.description))
const paragraphs = computed(() => splitParagraphs(description.value))
const title = computed(() => tr(props.card.title))
const alt = computed(() => `${props.card.artist} — ${title.value}`)
const isUploaded = computed(() => isUploadedImage(props.card.imageUrl))
const needsToggle = computed(() => description.value.length > COLLAPSED_CHAR_THRESHOLD)
const isCollapsed = computed(() => needsToggle.value && !expanded.value)

const expanded = ref(false)
const descEl = ref<HTMLElement | null>(null)
// Captured at click time so the max-height transition lands exactly on
// the content's natural height — no magic number, no overshoot lag.
const expandedHeightPx = ref(0)
const descId = computed(() => `exh-desc-${props.card.id}`)

function toggle() {
  if (descEl.value) expandedHeightPx.value = descEl.value.scrollHeight
  expanded.value = !expanded.value
}
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
        width="640"
        height="800"
        class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
        sizes="sm:90vw md:45vw lg:33vw"
        densities="x1 x2"
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
      ref="descEl"
      class="desc-clamp relative space-y-3 text-white/70 leading-relaxed text-sm md:text-[15px] overflow-hidden"
      :class="isCollapsed ? 'desc-clamp--collapsed' : 'desc-clamp--open'"
      :style="expanded && expandedHeightPx ? { maxHeight: `${expandedHeightPx}px` } : undefined"
    >
      <p v-for="(p, i) in paragraphs" :key="i">{{ p }}</p>
    </div>

    <button
      v-if="needsToggle"
      type="button"
      :aria-expanded="expanded"
      :aria-controls="descId"
      class="mt-2 -my-1 py-2 inline-flex items-center gap-2 min-h-[44px] text-xs text-white/65 hover:text-gold font-mono uppercase tracking-[0.18em] whitespace-nowrap transition-colors focus-gold self-start"
      @click="toggle"
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
  max-height: 40rem;
}

.desc-clamp--collapsed::after {
  content: '';
  position: absolute;
  inset: auto 0 0 0;
  height: 4rem;
  background: linear-gradient(to bottom, transparent, var(--color-edition-dark));
  pointer-events: none;
}

/* Vestibular-safe: skip the clamp entirely so users see the full text
   without any height animation or fade overlay. */
@media (prefers-reduced-motion: reduce) {
  .desc-clamp,
  .desc-clamp--collapsed { max-height: none; transition: none; }
  .desc-clamp--collapsed::after { display: none; }
}
</style>
