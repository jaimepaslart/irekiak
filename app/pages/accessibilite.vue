<script setup lang="ts">
const { t } = useI18n()

useSeoMeta({
  title: t('seo.accessibility.title'),
  description: t('seo.accessibility.description'),
  ogTitle: t('seo.accessibility.title'),
  ogDescription: t('seo.accessibility.description'),
})
</script>

<template>
  <div class="max-w-3xl mx-auto px-6 py-16">
    <h1 class="text-4xl font-bold mb-8">
      {{ t('nav.accessibility') }}
    </h1>

    <div class="prose prose-slate max-w-none">
      <p class="text-lg text-muted-foreground leading-relaxed mb-6">
        {{ t('accessibility.intro') }}
      </p>

      <h2 class="text-2xl font-semibold mt-10 mb-4">
        {{ t('accessibility.commitment') }}
      </h2>
      <p class="text-base text-muted-foreground leading-relaxed mb-6">
        {{ t('accessibility.commitmentContent') }}
      </p>

      <h2 class="text-2xl font-semibold mt-10 mb-4">
        {{ t('accessibility.venues') }}
      </h2>
      <p class="text-base text-muted-foreground leading-relaxed mb-6">
        {{ t('accessibility.venuesContent') }}
      </p>

      <h2 class="text-2xl font-semibold mt-10 mb-4">
        {{ t('accessibility.contact') }}
      </h2>
      <p class="text-base text-muted-foreground leading-relaxed">
        {{ t('accessibility.contactContent') }}
      </p>
    </div>
  </div>
</template>
