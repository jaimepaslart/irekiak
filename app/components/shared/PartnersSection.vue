<script setup lang="ts">
import type { Partner, PartnerTier } from '#types/partner'
import { partners } from '@data/partners'

interface Props {
  layout?: 'row' | 'stack'
}
withDefaults(defineProps<Props>(), { layout: 'row' })

const { t } = useI18n()

function byTier(tier: PartnerTier): Partner[] {
  return partners.filter(p => p.tier === tier)
}
</script>

<template>
  <div
    :class="layout === 'stack'
      ? 'flex flex-col items-start gap-8'
      : 'flex flex-col items-center gap-10 md:gap-12'"
  >
    <div
      class="reveal-on-scroll stagger-1"
      :class="layout === 'stack' ? 'w-full' : 'w-full text-center'"
    >
      <p
        class="eyebrow mb-4"
        :class="layout === 'stack' ? '' : 'text-center'"
      >
        {{ t('home.partnersOrganizers') }}
      </p>
      <div
        class="flex flex-wrap items-center gap-6 md:gap-10"
        :class="layout === 'stack' ? 'justify-start' : 'justify-center'"
      >
        <component
          :is="p.website ? 'a' : 'span'"
          v-for="p in byTier('organizer')"
          :key="p.id"
          v-bind="p.website ? { href: p.website, target: '_blank', rel: 'noopener noreferrer', 'aria-label': p.name } : {}"
          class="inline-flex items-center focus-gold"
          :class="p.website ? 'scale-press cursor-pointer' : ''"
        >
          <img
            v-if="p.logo"
            :src="p.logo"
            :alt="p.name"
            class="h-9 md:h-12 w-auto object-contain grayscale brightness-0 invert opacity-40 hover:opacity-70 transition-opacity duration-300"
          >
          <span
            v-else
            class="text-xs md:text-sm uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors duration-300"
          >
            {{ p.name }}
          </span>
        </component>
      </div>
    </div>

    <div
      class="reveal-on-scroll stagger-2"
      :class="layout === 'stack' ? 'w-full' : 'w-full text-center'"
    >
      <p
        class="eyebrow mb-4"
        :class="layout === 'stack' ? '' : 'text-center'"
      >
        {{ t('home.partnersSupport') }}
      </p>
      <div
        class="flex flex-wrap items-center gap-5 md:gap-8"
        :class="layout === 'stack' ? 'justify-start' : 'justify-center'"
      >
        <component
          :is="p.website ? 'a' : 'span'"
          v-for="p in byTier('support')"
          :key="p.id"
          v-bind="p.website ? { href: p.website, target: '_blank', rel: 'noopener noreferrer', 'aria-label': p.name } : {}"
          class="inline-flex items-center focus-gold"
          :class="p.website ? 'scale-press cursor-pointer' : ''"
        >
          <img
            v-if="p.logo"
            :src="p.logo"
            :alt="p.name"
            class="h-7 md:h-9 w-auto object-contain grayscale brightness-0 invert opacity-40 hover:opacity-70 transition-opacity duration-300"
          >
          <span
            v-else
            class="text-[11px] md:text-xs uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors duration-300"
          >
            {{ p.name }}
          </span>
        </component>
      </div>
    </div>
  </div>
</template>
