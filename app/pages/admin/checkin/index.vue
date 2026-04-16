<script setup lang="ts">
// Legacy redirect /admin/checkin → /admin/parcours (refactor d'avril 2026).
definePageMeta({ layout: 'admin', i18n: false })
useSeoMeta({ title: 'Admin · Parcours', robots: 'noindex, nofollow' })

onMounted(() => {
  void navigateTo('/admin/parcours', { replace: true })
})
</script>

<template>
  <div class="py-10 text-center text-sm text-white/50">
    Redirection…
  </div>
</template>
