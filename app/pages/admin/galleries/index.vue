<script setup lang="ts">
import type { Ref } from 'vue'

interface Contact {
  email: string
  name?: string
  phone?: string
  preferredLanguage: 'eu' | 'es' | 'fr' | 'en'
  notifyOnBooking: boolean
  receiveDailyDigest: boolean
}
interface Row {
  id: string
  slug: string
  name: string
  imageUrl: string
  overridden: boolean
  contact: Contact | null
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'] as const

definePageMeta({ layout: 'admin', i18n: false })
useSeoMeta({ title: 'Admin · Galeries', robots: 'noindex, nofollow' })

const { t } = useAdminT()
const { year } = useEdition()
const token = inject<Ref<string>>('adminToken')!

const galleries = ref<Row[]>([])
const loading = ref(true)
const errorMessage = ref<string | null>(null)

async function load() {
  loading.value = true
  try {
    galleries.value = await $fetch<Row[]>('/api/admin/galleries', { headers: { 'x-admin-token': token.value } })
  }
  catch (err: unknown) {
    errorMessage.value = (err as { statusMessage?: string })?.statusMessage ?? t('galleries.loadFailed')
  }
  finally { loading.value = false }
}

onMounted(() => { void load() })
</script>

<template>
  <div class="relative max-w-5xl mx-auto">
    <AdminGrain />

    <AdminHeroSection
      :eyebrow="t('galleries.eyebrow')"
      :title="t('galleries.title')"
      :subtitle="t('galleries.heroSubtitle')"
    />

    <p v-if="errorMessage" class="text-sm text-red-300 italic font-serif mb-6">
      {{ errorMessage }}
    </p>

    <div v-if="loading && galleries.length === 0" class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <AdminSkeleton variant="card" :count="6" />
    </div>

    <AdminEmptyState
      v-else-if="!loading && galleries.length === 0"
      icon="🖼"
      :title="t('galleries.emptyState')"
      :description="t('galleries.emptyStateDesc')"
    >
      <template #action>
        <AdminBaseButton variant="primary" type="button" :loading="loading" @click="load">
          {{ t('galleries.emptyStateCta') }}
        </AdminBaseButton>
      </template>
    </AdminEmptyState>

    <section v-else class="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
      <NuxtLink
        v-for="(g, i) in galleries"
        :key="g.id"
        :to="`/admin/galleries/${g.id}`"
        class="group relative flex gap-5 border border-white/10 bg-[var(--color-edition-dark)] rounded-sm p-5 editorial-in transition-[border-color] duration-300 hover:border-white/20 focus-gold"
        :style="{ animationDelay: `${i * 70}ms` }"
      >
        <span
          class="absolute inset-y-0 left-0 w-[2px] bg-[var(--color-accent-gold)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          aria-hidden="true"
        />
        <div class="relative shrink-0 w-24 h-24 overflow-hidden rounded-sm bg-white/5">
          <img
            :src="g.imageUrl"
            :alt="g.name"
            class="w-full h-full object-cover"
            loading="lazy"
          >
        </div>
        <div class="flex-1 min-w-0 flex flex-col">
          <div class="flex items-center justify-between gap-2 mb-2">
            <div class="eyebrow">
              {{ t('galleries.cardEyebrow', { num: ROMAN[i] ?? String(i + 1) }) }}
            </div>
            <span
              class="text-[10px] uppercase tracking-[0.18em] font-mono px-2 py-0.5 rounded-sm border whitespace-nowrap"
              :class="g.overridden ? 'border-gold text-gold bg-gold-soft/30' : 'border-white/15 text-white/50'"
            >
              {{ g.overridden ? t('galleries.badgeOverridden') : t('galleries.badgeDefault') }}
            </span>
          </div>
          <h2 class="font-serif text-lg text-white leading-tight mb-1" style="font-weight: 400; letter-spacing: -0.01em;">
            {{ g.name }}
          </h2>
          <p v-if="g.contact" class="text-sm text-white/60 font-serif italic truncate">{{ g.contact.email }}</p>
          <p v-else class="text-sm text-white/30 font-serif italic">{{ t('galleries.noContact') }}</p>
          <p class="mt-auto pt-3 text-[11px] uppercase tracking-[0.18em] font-mono text-white/40 arrow-nudge-parent">
            {{ t('galleries.editTitle') }}
            <span class="arrow-nudge" aria-hidden="true">→</span>
          </p>
        </div>
      </NuxtLink>
    </section>

    <p v-if="galleries.length > 0" class="mt-10 text-[10px] uppercase tracking-[0.22em] text-white/20 font-mono text-center">
      Irekiak {{ year }} · {{ galleries.length }} {{ t('nav.galleries').toLowerCase() }}
    </p>
  </div>
</template>
