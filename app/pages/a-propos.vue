<script setup lang="ts">
import { galleries } from '@data/galleries'

const { t } = useI18n()
const localePath = useLocalePath()

usePageSeo('about')
useScrollReveal()

const daggeMembers = ['Arteko', 'Arteztu', 'Cibrián', 'Ekain', 'Villa Magdalena']
  .map(name => ({ name, slug: galleries.find(g => g.name === name)?.slug }))
</script>

<template>
  <div class="max-w-[1100px] mx-auto px-6 md:px-12 py-24 pt-28">
    <header class="reveal-on-scroll text-center mb-20 md:mb-28">
      <p class="eyebrow mb-4">{{ t('about.hero.eyebrow') }}</p>
      <h1 class="display-headline text-4xl md:text-6xl lg:text-7xl text-white mb-5">
        {{ t('about.hero.title') }}
      </h1>
      <p class="display-title text-lg md:text-xl text-white/60 font-light max-w-[640px] mx-auto">
        {{ t('about.hero.subtitle') }}
      </p>
    </header>

    <div>
      <section class="reveal-on-scroll stagger-1 pt-16 md:pt-24 border-t border-gold-soft">
        <p class="eyebrow mb-8 md:mb-12">{{ t('about.intro.eyebrow') }}</p>

        <div class="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-6 md:gap-16">
          <div
            aria-hidden="true"
            class="hidden md:block font-extralight text-[140px] lg:text-[160px] leading-none text-white/10 tabular-nums select-none pointer-events-none -mt-4"
          >
            2010
          </div>

          <div class="space-y-5 md:space-y-6 max-w-[640px]">
            <p class="text-white text-lg md:text-xl leading-relaxed font-light">
              {{ t('about.intro.p1') }}
            </p>
            <p class="text-white/70 text-base md:text-lg leading-relaxed font-light">
              {{ t('about.intro.p2') }}
            </p>
          </div>
        </div>
      </section>

      <section class="reveal-on-scroll stagger-2 pt-16 md:pt-24 mt-16 md:mt-24 border-t border-gold-soft">
        <p class="eyebrow mb-8 md:mb-12">{{ t('about.dagge.eyebrow') }}</p>

        <div class="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8 md:gap-16 items-start">
          <div>
            <img
              src="/images/partners/dagge.png"
              alt=""
              class="h-16 md:h-24 w-auto object-contain object-left grayscale brightness-0 invert opacity-70"
            >
          </div>

          <div class="space-y-6 max-w-[640px]">
            <div>
              <h2 class="display-headline text-3xl md:text-5xl text-white mb-2">
                {{ t('about.dagge.title') }}
              </h2>
              <p class="display-title text-base md:text-lg text-white/60 font-light">
                {{ t('about.dagge.subtitle') }}
              </p>
            </div>

            <p class="text-white/70 text-base md:text-lg leading-relaxed font-light">
              {{ t('about.dagge.p1') }}
            </p>

            <div class="pt-2">
              <p class="eyebrow mb-4">{{ t('about.dagge.membersLabel') }}</p>
              <ul class="flex flex-wrap gap-2 list-none p-0 m-0">
                <li v-for="member in daggeMembers" :key="member.name">
                  <NuxtLink
                    v-if="member.slug"
                    :to="localePath(`/galleries/${member.slug}`)"
                    class="group inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] text-sm text-white/80
                           border border-white/15 rounded-full transition-colors
                           hover:border-gold hover:text-white scale-press focus-gold"
                  >
                    {{ member.name }}
                    <Icon
                      name="lucide:arrow-up-right"
                      class="w-3 h-3 text-white/40 group-hover:text-white transition-colors"
                      aria-hidden="true"
                    />
                  </NuxtLink>
                  <span
                    v-else
                    class="inline-flex items-center px-3 py-2 min-h-[44px] text-sm text-white/50
                           border border-white/10 rounded-full"
                  >
                    {{ member.name }}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
