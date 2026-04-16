<script setup lang="ts">
// Legacy redirect : /admin/checkin/[slotId] -> /admin/parcours/[route]/slot/[slotId]
// Récupère le slot côté API pour retrouver son parcours, puis redirige.
interface CheckinData {
  slot: { id: string }
  route: { id: string }
}

const routeParam = useRoute()
const slotId = computed(() => String(routeParam.params.slotId))

definePageMeta({ layout: 'admin', i18n: false })
useSeoMeta({ title: 'Admin · Parcours', robots: 'noindex, nofollow' })

const token = inject<Ref<string>>('adminToken')!

onMounted(async () => {
  try {
    const data = await $fetch<CheckinData>(`/api/admin/checkin/${slotId.value}`, {
      headers: { 'x-admin-token': token.value },
    })
    const slug = data.route.id.replace(/^route-/, '')
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
