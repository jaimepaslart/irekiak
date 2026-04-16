<script setup lang="ts">
definePageMeta({ layout: 'admin', i18n: false })
useSeoMeta({ title: 'Admin · Settings', robots: 'noindex, nofollow' })

const { t } = useAdminT()
const { year } = useEdition()
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

const acceptBookingsValue = computed<boolean>({
  get: () => settings['bookings.accept'] === '1',
  set: (v: boolean) => { void save('bookings.accept', v ? '1' : '0') },
})
const notificationsValue = computed<boolean>({
  get: () => settings['notifications.enabled'] === '1',
  set: (v: boolean) => { void save('notifications.enabled', v ? '1' : '0') },
})

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

interface QuickLink { to: string, eyebrow: string, label: string }
const quickLinks = computed<QuickLink[]>(() => [
  { to: '/admin/galleries', eyebrow: 'VIII · CONTACTS', label: t('settings.linkGalleries') },
  { to: '/admin/blast', eyebrow: 'EMAIL · DIFFUSION', label: t('settings.linkBlast') },
  { to: '/admin/parcours', eyebrow: 'CHECK-IN · PARCOURS', label: t('settings.linkCheckin') },
])
</script>

<template>
  <div class="relative max-w-3xl">
    <AdminGrain />

    <AdminHeroSection
      :eyebrow="t('settings.eyebrow')"
      :title="t('settings.title')"
      :subtitle="t('settings.heroSubtitle')"
    />

    <p v-if="errorMessage" class="text-sm text-red-300 italic font-serif mb-6">
      {{ errorMessage }}
    </p>

    <div class="relative space-y-0">
      <AdminSettingsSection
        icon="✉"
        :eyebrow="t('settings.sectionTestEmail')"
        :heading="t('settings.sectionTestEmail')"
        :description="t('settings.testEmailDesc')"
        :delay="60"
      >
        <AdminTestEmailForm />
      </AdminSettingsSection>

      <div class="h-px w-full bg-[var(--color-accent-gold)] opacity-5"></div>

      <AdminSettingsSection
        icon="◉"
        :eyebrow="t('settings.sectionBookings')"
        :delay="120"
      >
        <div class="mt-2">
          <AdminToggleSetting
            v-model="acceptBookingsValue"
            :heading="t('settings.settingAcceptBookings')"
            :description="t('settings.settingAcceptBookingsDesc')"
            :saving="saving['bookings.accept']"
          />
        </div>

        <div class="mt-7 pt-7 border-t border-white/5">
          <AdminToggleSetting
            v-model="notificationsValue"
            :heading="t('settings.settingNotifications')"
            :description="t('settings.settingNotificationsDesc')"
            :saving="saving['notifications.enabled']"
          />
        </div>
      </AdminSettingsSection>

      <div class="h-px w-full bg-[var(--color-accent-gold)] opacity-5"></div>

      <AdminSettingsSection
        icon="⚠"
        :eyebrow="t('settings.sectionEmergency')"
        :heading="t('settings.sectionEmergency')"
        :description="t('settings.settingEmergencyMessage')"
        :delay="180"
      >
        <textarea
          v-model="settings['emergency.message']"
          rows="3"
          maxlength="500"
          class="w-full bg-white/[0.02] border border-white/10 rounded-sm px-4 py-3 text-sm text-white transition-colors focus:outline-none focus:border-[var(--color-accent-gold)] focus:bg-white/[0.04] placeholder:text-white/20 placeholder:italic placeholder:font-serif"
          :placeholder="t('settings.settingEmergencyPlaceholder')"
        />
        <div class="mt-4 flex justify-end">
          <button
            type="button"
            :disabled="saving['emergency.message']"
            class="inline-flex items-center gap-2 px-5 py-3 bg-[var(--color-accent-gold)] text-[var(--color-edition)] text-xs uppercase tracking-[0.18em] font-medium rounded-sm hover:bg-[var(--color-accent-gold)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-gold"
            @click="save('emergency.message', settings['emergency.message'])"
          >
            <span
              v-if="saving['emergency.message']"
              class="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"
              aria-hidden="true"
            />
            {{ t('common.save') }}
          </button>
        </div>
      </AdminSettingsSection>

      <div class="h-px w-full bg-[var(--color-accent-gold)] opacity-5"></div>

      <AdminSettingsSection
        icon="↓"
        :eyebrow="t('settings.sectionExport')"
        :heading="t('settings.sectionExport')"
        :description="t('settings.exportContactsCsv')"
        :delay="240"
      >
        <button
          type="button"
          class="inline-flex items-center gap-2 px-5 py-3 border border-white/15 text-white text-xs uppercase tracking-[0.18em] font-medium rounded-sm hover:border-[var(--color-accent-gold)] hover:text-gold transition-colors focus-gold"
          @click="exportMarketing"
        >
          {{ t('common.export') }}
        </button>
      </AdminSettingsSection>

      <div class="h-px w-full bg-[var(--color-accent-gold)] opacity-5"></div>

      <AdminSettingsSection
        icon="→"
        :eyebrow="t('settings.sectionLinks')"
        :delay="300"
        heading-gap="tight"
      >
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NuxtLink
            v-for="link in quickLinks"
            :key="link.to"
            :to="link.to"
            class="group relative block p-5 border border-white/10 bg-[var(--color-edition-dark)] rounded-sm transition-[border-color] duration-300 hover:border-[var(--color-accent-gold)]/40 focus-gold arrow-nudge-parent"
          >
            <span
              class="absolute inset-y-0 left-0 w-[2px] bg-[var(--color-accent-gold)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              aria-hidden="true"
            ></span>
            <div class="eyebrow mb-3">{{ link.eyebrow }}</div>
            <div class="flex items-center justify-between gap-3">
              <span class="font-serif text-lg text-white" style="font-weight: 400; letter-spacing: -0.01em;">
                {{ link.label }}
              </span>
              <span class="arrow-nudge text-gold text-base leading-none" aria-hidden="true">→</span>
            </div>
          </NuxtLink>
        </div>
      </AdminSettingsSection>
    </div>

    <p class="mt-10 text-[10px] uppercase tracking-[0.22em] text-white/20 font-mono text-center">
      Irekiak {{ year }} · Donostia / San Sebastián
    </p>
  </div>
</template>
