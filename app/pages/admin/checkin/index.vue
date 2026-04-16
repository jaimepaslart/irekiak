<script setup lang="ts">
// Legacy redirect : /admin/checkin a été remplacé par /admin/parcours
// comme pivot unique. Cette page redirige côté client pour éviter les
// anciens liens cassés.
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
