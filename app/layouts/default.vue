<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-[var(--color-edition)]"
    >
      {{ t('a11y.skipToContent') }}
    </a>

    <LayoutAppHeader />

    <main id="main-content" class="flex-1">
      <slot />
    </main>

    <LayoutAppFooter />
  </div>
</template>
