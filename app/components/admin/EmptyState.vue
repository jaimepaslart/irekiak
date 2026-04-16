<script setup lang="ts">
interface Props {
  title: string
  description?: string
  icon?: string
}

defineProps<Props>()
</script>

<template>
  <div class="py-16 px-6 text-center flex flex-col items-center">
    <div v-if="icon" class="text-5xl text-white/20 mb-4">
      {{ icon }}
    </div>
    <div class="text-base text-white/70 mb-2">
      {{ title }}
    </div>
    <div v-if="description" class="text-sm text-white/40 max-w-sm mx-auto mb-6">
      {{ description }}
    </div>
    <slot name="action" />
  </div>
</template>
