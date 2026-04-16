<script setup lang="ts">
interface Props {
  icon: string
  eyebrow: string
  heading?: string
  description?: string
  delay?: number
  headingGap?: 'normal' | 'tight'
}

withDefaults(defineProps<Props>(), {
  delay: 0,
  headingGap: 'normal',
})
</script>

<template>
  <section
    class="py-8 md:py-10 editorial-in"
    :style="{ animationDelay: `${delay}ms` }"
  >
    <div
      class="flex items-baseline gap-3"
      :class="headingGap === 'tight' ? 'mb-6' : 'mb-1'"
    >
      <span class="text-gold text-lg leading-none" aria-hidden="true">{{ icon }}</span>
      <div class="eyebrow">{{ eyebrow }}</div>
    </div>
    <template v-if="heading">
      <h2 class="font-serif text-2xl text-white mt-2" style="font-weight: 400; letter-spacing: -0.01em;">
        {{ heading }}
      </h2>
      <p v-if="description" class="font-serif italic text-sm text-white/55 mt-2 mb-5">
        {{ description }}
      </p>
    </template>
    <slot />
  </section>
</template>
