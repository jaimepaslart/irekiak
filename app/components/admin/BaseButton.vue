<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  type?: 'button' | 'submit'
  disabled?: boolean
  loading?: boolean
  as?: 'button' | 'a' | 'nuxt-link'
  to?: string
  href?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  type: 'button',
  disabled: false,
  loading: false,
  as: 'button',
})

const baseClass = 'inline-flex items-center justify-center gap-2 h-10 px-4 text-sm rounded-sm transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed'

const variantClass = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-white text-[var(--color-edition)] hover:bg-white/90'
    case 'secondary':
      return 'border border-white/20 text-white hover:bg-white/5'
    case 'ghost':
      return 'text-white/70 hover:text-white hover:bg-white/5'
    case 'danger':
      return 'border border-red-400/30 text-red-300 hover:bg-red-500/10'
    default:
      return ''
  }
})

const isDisabled = computed(() => props.disabled || props.loading)
</script>

<template>
  <NuxtLink
    v-if="as === 'nuxt-link' && to"
    :to="to"
    :class="[baseClass, variantClass]"
    :aria-disabled="isDisabled || undefined"
  >
    <span
      v-if="loading"
      class="inline-block w-4 h-4 border border-current border-t-transparent rounded-full animate-spin"
      aria-hidden="true"
    />
    <slot />
  </NuxtLink>
  <a
    v-else-if="as === 'a'"
    :href="href"
    :class="[baseClass, variantClass]"
    :aria-disabled="isDisabled || undefined"
  >
    <span
      v-if="loading"
      class="inline-block w-4 h-4 border border-current border-t-transparent rounded-full animate-spin"
      aria-hidden="true"
    />
    <slot />
  </a>
  <button
    v-else
    :type="type"
    :disabled="isDisabled"
    :class="[baseClass, variantClass]"
  >
    <span
      v-if="loading"
      class="inline-block w-4 h-4 border border-current border-t-transparent rounded-full animate-spin"
      aria-hidden="true"
    />
    <slot />
  </button>
</template>
