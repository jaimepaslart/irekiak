<script setup lang="ts">
definePageMeta({ layout: 'admin', i18n: false })

const { t } = useAdminT()

useSeoMeta({ title: () => `Admin · ${t('nav.announcement')}`, robots: 'noindex, nofollow' })

const { announcement, loading, saving, saveSuccess, saveError, loadError, load, save } = useAdminAnnouncement()

onMounted(() => { void load() })

const isVisible = computed(() => announcement.value.enabled)
</script>

<template>
  <div class="relative max-w-3xl mx-auto">
    <AdminGrain />

    <AdminHeroSection
      :eyebrow="t('announcement.eyebrow')"
      :title="t('announcement.title')"
      :subtitle="t('announcement.subtitle')"
    />

    <div
      class="mb-8 inline-flex items-center gap-3 px-4 py-2 rounded-full border text-xs font-mono uppercase tracking-[0.18em]"
      :class="isVisible
        ? 'border-emerald-300/40 bg-emerald-400/10 text-emerald-200'
        : 'border-white/15 bg-white/5 text-white/50'"
    >
      <span
        class="w-1.5 h-1.5 rounded-full"
        :class="isVisible ? 'bg-emerald-300' : 'bg-white/40'"
        aria-hidden="true"
      />
      {{ isVisible ? t('announcement.statusVisible') : t('announcement.statusHidden') }}
    </div>

    <p v-if="loadError" class="text-sm text-red-300 italic font-serif mb-6">
      {{ loadError }}
    </p>

    <div v-if="loading" class="text-sm text-white/40 italic font-serif">
      …
    </div>

    <AdminAnnouncementEditor
      v-else
      v-model="announcement"
      :saving="saving"
      :save-success="saveSuccess"
      :save-error="saveError"
      @save="save"
    />

    <p class="mt-10 text-[10px] uppercase tracking-[0.22em] text-white/20 font-mono text-center">
      {{ t('announcement.autoHideNote') }}
    </p>
  </div>
</template>
