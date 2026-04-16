<script setup lang="ts">
interface Props {
  title: string
  subtitle?: string
}

defineProps<Props>()
</script>

<template>
  <div class="flex items-start justify-between gap-6 mb-8">
    <div>
      <h1 class="text-2xl font-light text-white">
        {{ title }}
      </h1>
      <p v-if="subtitle" class="text-sm text-white/50 mt-1">
        {{ subtitle }}
      </p>
    </div>
    <div class="flex items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
