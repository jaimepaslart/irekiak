<script setup lang="ts">
definePageMeta({ layout: 'admin', i18n: false })
useSeoMeta({ title: 'Admin · Settings', robots: 'noindex, nofollow' })

const { t } = useAdminT()
const token = inject<Ref<string>>('adminToken')!

const settings = reactive({
  'bookings.accept': '1',
  'emergency.message': '',
  'notifications.enabled': '1',
})
const saving = ref<Record<string, boolean>>({})
const errorMessage = ref<string | null>(null)

async function load() {
  try {
    const res = await $fetch<typeof settings>('/api/admin/settings', { headers: { 'x-admin-token': token.value } })
    Object.assign(settings, res)
  }
  catch (err: unknown) {
    errorMessage.value = (err as { statusMessage?: string })?.statusMessage ?? t('common.error')
  }
}
onMounted(() => { void load() })

async function save(key: keyof typeof settings, value: string) {
  saving.value[key] = true
  try {
    await $fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'x-admin-token': token.value, 'Content-Type': 'application/json' },
      body: { key, value },
    })
    settings[key] = value
  }
  catch (err: unknown) {
    alert((err as { statusMessage?: string })?.statusMessage ?? t('settings.saveFailure'))
  }
  finally { saving.value[key] = false }
}

async function exportMarketing() {
  const res = await fetch('/api/admin/bookings', { headers: { 'x-admin-token': token.value } })
  const list = await res.json() as Array<{ email: string, firstName: string, lastName: string, language: string, status: string }>
  const confirmed = list.filter(b => b.status !== 'cancelled')
  const csv = ['email,first_name,last_name,language', ...confirmed.map(b => `"${b.email}","${b.firstName}","${b.lastName}","${b.language}"`)].join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `irekiak-marketing-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div>
    <AdminPageHeader :title="t('settings.title')" :subtitle="t('settings.subtitle')" />
    <p v-if="errorMessage" class="text-sm text-red-300 mb-4">{{ errorMessage }}</p>

    <div class="max-w-2xl space-y-6">
      <div class="bg-edition-dark border border-white/10 rounded-sm p-5">
        <h2 class="text-base font-semibold mb-1">{{ t('settings.sectionTestEmail') }}</h2>
        <p class="text-sm text-white/60 mb-4">{{ t('settings.testEmailDesc') }}</p>
        <AdminTestEmailForm />
      </div>

      <div class="bg-edition-dark border border-white/10 rounded-sm p-5">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-base font-semibold">{{ t('settings.settingAcceptBookings') }}</h2>
            <p class="text-sm text-white/60 mt-1">{{ t('settings.settingAcceptBookingsDesc') }}</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              :checked="settings['bookings.accept'] === '1'"
              type="checkbox"
              class="sr-only peer"
              :disabled="saving['bookings.accept']"
              @change="save('bookings.accept', ($event.target as HTMLInputElement).checked ? '1' : '0')"
            >
            <div class="w-11 h-6 bg-white/10 peer-checked:bg-emerald-500 rounded-full transition-colors"></div>
            <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
          </label>
        </div>
      </div>

      <div class="bg-edition-dark border border-white/10 rounded-sm p-5">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-base font-semibold">{{ t('settings.settingNotifications') }}</h2>
            <p class="text-sm text-white/60 mt-1">{{ t('settings.settingNotificationsDesc') }}</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              :checked="settings['notifications.enabled'] === '1'"
              type="checkbox"
              class="sr-only peer"
              :disabled="saving['notifications.enabled']"
              @change="save('notifications.enabled', ($event.target as HTMLInputElement).checked ? '1' : '0')"
            >
            <div class="w-11 h-6 bg-white/10 peer-checked:bg-emerald-500 rounded-full transition-colors"></div>
            <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
          </label>
        </div>
      </div>

      <div class="bg-edition-dark border border-white/10 rounded-sm p-5">
        <h2 class="text-base font-semibold mb-1">{{ t('settings.sectionEmergency') }}</h2>
        <p class="text-sm text-white/60 mb-3">{{ t('settings.settingEmergencyMessage') }}</p>
        <textarea
          v-model="settings['emergency.message']"
          rows="3"
          maxlength="500"
          class="w-full bg-white/5 border border-white/15 rounded-sm px-3 py-2 text-sm text-white"
          :placeholder="t('settings.settingEmergencyPlaceholder')"
        />
        <div class="mt-3">
          <AdminBaseButton
            :loading="saving['emergency.message']"
            @click="save('emergency.message', settings['emergency.message'])"
          >
            {{ t('common.save') }}
          </AdminBaseButton>
        </div>
      </div>

      <div class="bg-edition-dark border border-white/10 rounded-sm p-5">
        <h2 class="text-base font-semibold mb-1">{{ t('settings.sectionExport') }}</h2>
        <p class="text-sm text-white/60 mb-3">{{ t('settings.exportContactsCsv') }}</p>
        <AdminBaseButton variant="secondary" @click="exportMarketing">
          {{ t('common.export') }}
        </AdminBaseButton>
      </div>

      <div class="bg-edition-dark border border-white/10 rounded-sm p-5">
        <h2 class="text-base font-semibold mb-3">{{ t('settings.sectionLinks') }}</h2>
        <div class="flex flex-wrap gap-2">
          <AdminBaseButton variant="secondary" as="nuxt-link" to="/admin/galleries">{{ t('settings.linkGalleries') }}</AdminBaseButton>
          <AdminBaseButton variant="secondary" as="nuxt-link" to="/admin/blast">{{ t('settings.linkBlast') }}</AdminBaseButton>
          <AdminBaseButton variant="secondary" as="nuxt-link" to="/admin/checkin">{{ t('settings.linkCheckin') }}</AdminBaseButton>
        </div>
      </div>
    </div>
  </div>
</template>
