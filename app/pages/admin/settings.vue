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
  <div class="relative max-w-3xl mx-auto">
    <div class="absolute inset-x-0 -top-10 -bottom-10 editorial-grain pointer-events-none opacity-60" aria-hidden="true"></div>

    <section class="relative mb-10 md:mb-14 editorial-in">
      <div class="eyebrow mb-4">
        {{ t('settings.eyebrow') }}
      </div>
      <h1 class="font-serif text-3xl md:text-4xl text-white" style="font-weight: 400; letter-spacing: -0.01em; line-height: 1.1;">
        {{ t('settings.title') }}
      </h1>
      <p class="mt-2 text-sm text-white/55">
        <span class="italic font-serif">{{ t('settings.heroSubtitle') }}</span>
      </p>
      <div class="mt-6 h-px w-24 bg-[var(--color-accent-gold)] opacity-50"></div>
    </section>

    <p v-if="errorMessage" class="text-sm text-red-300 italic font-serif mb-6">
      {{ errorMessage }}
    </p>

    <div class="relative space-y-0">
      <section class="py-8 md:py-10 editorial-in" style="animation-delay: 60ms;">
        <div class="flex items-baseline gap-3 mb-1">
          <span class="text-gold text-lg leading-none" aria-hidden="true">✉</span>
          <div class="eyebrow">{{ t('settings.sectionTestEmail') }}</div>
        </div>
        <h2 class="font-serif text-2xl text-white mt-2" style="font-weight: 400; letter-spacing: -0.01em;">
          {{ t('settings.sectionTestEmail') }}
        </h2>
        <p class="font-serif italic text-sm text-white/55 mt-2 mb-6">
          {{ t('settings.testEmailDesc') }}
        </p>
        <AdminTestEmailForm />
      </section>

      <div class="h-px w-full bg-[var(--color-accent-gold)] opacity-5"></div>

      <section class="py-8 md:py-10 editorial-in" style="animation-delay: 120ms;">
        <div class="flex items-baseline gap-3 mb-1">
          <span class="text-gold text-lg leading-none" aria-hidden="true">◉</span>
          <div class="eyebrow">{{ t('settings.sectionBookings') }}</div>
        </div>

        <div class="mt-2 flex items-start justify-between gap-6">
          <div class="flex-1 min-w-0">
            <h2 class="font-serif text-2xl text-white" style="font-weight: 400; letter-spacing: -0.01em;">
              {{ t('settings.settingAcceptBookings') }}
            </h2>
            <p class="font-serif italic text-sm text-white/55 mt-2">
              {{ t('settings.settingAcceptBookingsDesc') }}
            </p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer shrink-0 mt-2">
            <input
              :checked="settings['bookings.accept'] === '1'"
              type="checkbox"
              class="sr-only peer"
              :disabled="saving['bookings.accept']"
              @change="save('bookings.accept', ($event.target as HTMLInputElement).checked ? '1' : '0')"
            >
            <div class="w-12 h-6 bg-white/10 peer-checked:bg-[var(--color-accent-gold)] rounded-full transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-accent-gold)]"></div>
            <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6 shadow-sm"></div>
          </label>
        </div>

        <div class="mt-7 flex items-start justify-between gap-6 pt-7 border-t border-white/5">
          <div class="flex-1 min-w-0">
            <h2 class="font-serif text-2xl text-white" style="font-weight: 400; letter-spacing: -0.01em;">
              {{ t('settings.settingNotifications') }}
            </h2>
            <p class="font-serif italic text-sm text-white/55 mt-2">
              {{ t('settings.settingNotificationsDesc') }}
            </p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer shrink-0 mt-2">
            <input
              :checked="settings['notifications.enabled'] === '1'"
              type="checkbox"
              class="sr-only peer"
              :disabled="saving['notifications.enabled']"
              @change="save('notifications.enabled', ($event.target as HTMLInputElement).checked ? '1' : '0')"
            >
            <div class="w-12 h-6 bg-white/10 peer-checked:bg-[var(--color-accent-gold)] rounded-full transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-accent-gold)]"></div>
            <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6 shadow-sm"></div>
          </label>
        </div>
      </section>

      <div class="h-px w-full bg-[var(--color-accent-gold)] opacity-5"></div>

      <section class="py-8 md:py-10 editorial-in" style="animation-delay: 180ms;">
        <div class="flex items-baseline gap-3 mb-1">
          <span class="text-gold text-lg leading-none" aria-hidden="true">⚠</span>
          <div class="eyebrow">{{ t('settings.sectionEmergency') }}</div>
        </div>
        <h2 class="font-serif text-2xl text-white mt-2" style="font-weight: 400; letter-spacing: -0.01em;">
          {{ t('settings.sectionEmergency') }}
        </h2>
        <p class="font-serif italic text-sm text-white/55 mt-2 mb-5">
          {{ t('settings.settingEmergencyMessage') }}
        </p>
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
      </section>

      <div class="h-px w-full bg-[var(--color-accent-gold)] opacity-5"></div>

      <section class="py-8 md:py-10 editorial-in" style="animation-delay: 240ms;">
        <div class="flex items-baseline gap-3 mb-1">
          <span class="text-gold text-lg leading-none" aria-hidden="true">↓</span>
          <div class="eyebrow">{{ t('settings.sectionExport') }}</div>
        </div>
        <h2 class="font-serif text-2xl text-white mt-2" style="font-weight: 400; letter-spacing: -0.01em;">
          {{ t('settings.sectionExport') }}
        </h2>
        <p class="font-serif italic text-sm text-white/55 mt-2 mb-5">
          {{ t('settings.exportContactsCsv') }}
        </p>
        <button
          type="button"
          class="inline-flex items-center gap-2 px-5 py-3 border border-white/15 text-white text-xs uppercase tracking-[0.18em] font-medium rounded-sm hover:border-[var(--color-accent-gold)] hover:text-gold transition-colors focus-gold"
          @click="exportMarketing"
        >
          {{ t('common.export') }}
        </button>
      </section>

      <div class="h-px w-full bg-[var(--color-accent-gold)] opacity-5"></div>

      <section class="py-8 md:py-10 editorial-in" style="animation-delay: 300ms;">
        <div class="flex items-baseline gap-3 mb-6">
          <span class="text-gold text-lg leading-none" aria-hidden="true">→</span>
          <div class="eyebrow">{{ t('settings.sectionLinks') }}</div>
        </div>

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
      </section>
    </div>

    <p class="mt-10 text-[10px] uppercase tracking-[0.22em] text-white/20 font-mono text-center">
      Irekiak {{ year }} · Donostia / San Sebastián
    </p>
  </div>
</template>
