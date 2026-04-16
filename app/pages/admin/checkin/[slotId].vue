<script setup lang="ts">
// Legacy redirect /admin/checkin/[slotId] → /admin/parcours/[route]/slot/[slotId].
// Conservé pour les anciens liens (emails envoyés avant le refactor d'avril 2026).
interface CheckinData {
  slot: { id: string }
  route: { id: string }
}

const route = useRoute()
const slotId = computed(() => String(route.params.slotId))

definePageMeta({ layout: 'admin', i18n: false })
useSeoMeta({ title: 'Admin · Parcours', robots: 'noindex, nofollow' })

const token = inject<Ref<string>>('adminToken')!

onMounted(async () => {
  try {
    const data = await $fetch<CheckinData>(`/api/admin/checkin/${slotId.value}`, {
      headers: { 'x-admin-token': token.value },
    })
    const slug = routeSlugFromId(data.route.id)
    await navigateTo(`/admin/parcours/${slug}/slot/${data.slot.id}`, { replace: true })
  }
  catch {
    await navigateTo('/admin/parcours', { replace: true })
  }
})
</script>

<template>
  <div class="py-10 text-center text-sm text-white/50">
    Redirection…
  </div>
</template>
