<script setup lang="ts">
const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const availableLocales = computed(() =>
  locales.value
    .map(l => typeof l === 'string' ? l : l.code)
    .filter(code => code !== locale.value),
)
</script>

<template>
  <div class="flex items-center gap-1.5 text-xs uppercase tracking-wider" role="navigation" aria-label="Language selection">
    <span class="text-white font-medium">{{ locale }}</span>
    <template v-for="code in availableLocales" :key="code">
      <span class="text-white/20">/</span>
      <NuxtLink
        :to="switchLocalePath(code)"
        class="text-white/50 hover:text-white transition-colors duration-200"
        :lang="code"
      >
        {{ code }}
      </NuxtLink>
    </template>
  </div>
</template>
