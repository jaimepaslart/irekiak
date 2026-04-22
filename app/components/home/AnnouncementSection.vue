<script setup lang="ts">
import type { AnnouncementConfig, TranslatedText } from '~~/types/announcement'
import { renderBodyParagraphs } from '~/utils/announcement-render'

interface Props {
  announcement: AnnouncementConfig
}

const props = defineProps<Props>()

const { locale } = useI18n()

type Lang = keyof TranslatedText

function pick(t: TranslatedText): string {
  const lang = locale.value as Lang
  return t[lang] ?? t.eu ?? ''
}

const eyebrowText = computed(() => pick(props.announcement.eyebrow))
const titleText = computed(() => pick(props.announcement.title))
const paragraphsHtml = computed(() =>
  renderBodyParagraphs(props.announcement.body, locale.value as Lang),
)
</script>

<template>
  <section
    v-if="paragraphsHtml.length > 0"
    class="announcement relative bg-edition-dark pt-20 md:pt-28 pb-8 md:pb-12 px-6 md:px-12"
    aria-labelledby="announcement-heading"
  >
    <div class="max-w-3xl mx-auto">
      <p class="announcement__eyebrow">
        {{ eyebrowText }}
      </p>
      <h2 id="announcement-heading" class="announcement__title">
        {{ titleText }}
      </h2>
      <div class="announcement__body">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <p v-for="(html, i) in paragraphsHtml" :key="i" v-html="html" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.announcement {
  animation: fade-up 700ms ease-out both;
}

.announcement__eyebrow {
  margin: 0 0 28px;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 11px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--color-gold);
  font-weight: 600;
}

.announcement__title {
  margin: 0 0 40px;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: clamp(2.25rem, 5vw, 3.5rem);
  line-height: 1.1;
  letter-spacing: -0.02em;
  font-weight: 600;
  color: #fff;
}

.announcement__body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.announcement__body p {
  margin: 0;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 16px;
  line-height: 1.75;
  color: rgba(255, 255, 255, 0.72);
}

.announcement__body :deep(strong) {
  color: #fff;
  font-weight: 600;
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .announcement {
    animation: none;
  }
}
</style>
