<script setup lang="ts">
import type { Ref } from 'vue'
import type { ExhibitionCard } from '#types/exhibition'

definePageMeta({ layout: 'admin', i18n: false })
useSeoMeta({ title: 'Admin · Exhibitions', robots: 'noindex, nofollow' })

const { t, locale, localized } = useAdminT()
const { year } = useEdition()
const token = inject<Ref<string>>('adminToken')!

const cards = ref<ExhibitionCard[]>([])
const loading = ref(true)
const errorMessage = ref<string | null>(null)

async function load() {
  loading.value = true
  errorMessage.value = null
  try {
    cards.value = await $fetch<ExhibitionCard[]>('/api/admin/exhibitions', {
      headers: { 'x-admin-token': token.value },
    })
  }
  catch (err: unknown) {
    errorMessage.value = (err as { statusMessage?: string })?.statusMessage ?? t('exhibitions.loadFailed')
  }
  finally { loading.value = false }
}

onMounted(() => { void load() })
</script>

<template>
  <div class="relative max-w-5xl mx-auto">
    <AdminGrain />

    <AdminHeroSection
      :eyebrow="t('exhibitions.eyebrow')"
      :title="t('exhibitions.title')"
      :subtitle="t('exhibitions.heroSubtitle')"
    />

    <p v-if="errorMessage" class="text-sm text-red-300 italic font-serif mb-6">
      {{ errorMessage }}
    </p>

    <div v-if="loading && cards.length === 0" class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <AdminSkeleton variant="card" :count="8" />
    </div>

    <section v-else class="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
      <NuxtLink
        v-for="(c, i) in cards"
        :key="c.id"
        :to="`/admin/exhibitions/${c.id}`"
        class="group relative flex gap-5 border border-white/10 bg-[var(--color-edition-dark)] rounded-sm p-5 editorial-in transition-[border-color] duration-300 hover:border-white/20 focus-gold"
        :style="{ animationDelay: `${i * 70}ms` }"
      >
        <span
          class="absolute inset-y-0 left-0 w-[2px] bg-[var(--color-accent-gold)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          aria-hidden="true"
        />
        <div class="relative shrink-0 w-20 h-24 overflow-hidden rounded-sm bg-white/5">
          <img
            :src="c.imageUrl"
            :alt="`${c.artist} — ${localized(c.title)}`"
            class="w-full h-full object-cover"
            loading="lazy"
          >
        </div>
        <div class="flex-1 min-w-0 flex flex-col">
          <div class="flex items-center justify-between gap-2 mb-2">
            <div class="eyebrow">
              {{ t('exhibitions.cardEyebrow', { num: c.number, gallery: c.galleryName.toUpperCase() }) }}
            </div>
            <span
              class="text-[10px] uppercase tracking-[0.18em] font-mono px-2 py-0.5 rounded-sm border whitespace-nowrap"
              :class="c.overridden ? 'border-gold text-gold bg-gold-soft/30' : 'border-white/15 text-white/50'"
            >
              {{ c.overridden ? t('exhibitions.badgeOverridden') : t('exhibitions.badgeDefault') }}
            </span>
          </div>
          <h2 class="font-serif text-lg text-white leading-tight mb-1" style="font-weight: 400; letter-spacing: -0.01em;">
            {{ localized(c.title) }}
          </h2>
          <p class="text-sm text-gold font-medium">{{ c.artist }}</p>
          <p class="mt-auto pt-3 text-[11px] uppercase tracking-[0.18em] font-mono text-white/40 arrow-nudge-parent">
            {{ locale === 'fr' ? 'Modifier' : 'Editar' }}
            <span class="arrow-nudge" aria-hidden="true">→</span>
          </p>
        </div>
      </NuxtLink>
    </section>

    <p v-if="cards.length > 0" class="mt-10 text-[10px] uppercase tracking-[0.22em] text-white/20 font-mono text-center">
      Irekiak {{ year }} · {{ cards.length }} {{ t('exhibitions.title').toLowerCase() }}
    </p>
  </div>
</template>
