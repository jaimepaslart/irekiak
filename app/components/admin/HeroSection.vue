<script setup lang="ts">
interface Props {
  eyebrow?: string
  title: string
  subtitle?: string
  italicSubtitle?: boolean
  divider?: 'short' | 'long'
  spacing?: 'normal' | 'tight'
  titleSize?: 'sm' | 'md' | 'lg'
}

withDefaults(defineProps<Props>(), {
  italicSubtitle: true,
  divider: 'long',
  spacing: 'normal',
  titleSize: 'md',
})
</script>

<template>
  <section
    class="relative editorial-in"
    :class="spacing === 'tight' ? 'mb-10 md:mb-12' : 'mb-10 md:mb-14'"
  >
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
      <div class="min-w-0">
        <div v-if="eyebrow" class="eyebrow mb-4">
          {{ eyebrow }}
        </div>
        <h1
          class="font-serif text-white"
          :class="{
            'text-3xl md:text-4xl': titleSize === 'sm' || titleSize === 'md',
            'text-4xl md:text-5xl': titleSize === 'lg',
          }"
          style="font-weight: 400; letter-spacing: -0.01em; line-height: 1.1;"
        >
          <slot name="title">{{ title }}</slot>
        </h1>
        <p v-if="subtitle || $slots.subtitle" class="mt-2 text-sm text-white/55">
          <span v-if="italicSubtitle" class="italic font-serif">
            <slot name="subtitle">{{ subtitle }}</slot>
          </span>
          <slot v-else name="subtitle">{{ subtitle }}</slot>
        </p>
        <div
          class="h-px bg-[var(--color-accent-gold)]"
          :class="divider === 'short' ? 'mt-6 w-16 opacity-80' : 'mt-6 w-24 opacity-50'"
        ></div>
      </div>
      <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2 shrink-0">
        <slot name="actions" />
      </div>
    </div>
  </section>
</template>
