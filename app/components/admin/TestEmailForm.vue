<script setup lang="ts">
import { inject, ref, type Ref } from 'vue'

const { t } = useAdminT()
const token = inject<Ref<string>>('adminToken')!
const to = ref('bihrpaul@gmail.com')
const language = ref<'eu' | 'es' | 'fr' | 'en'>('fr')
const template = ref<'plain' | 'confirmation' | 'cancellation' | 'gallery_notification'>('plain')
const loading = ref(false)
const result = ref<{ ok: boolean, message: string } | null>(null)

async function send() {
  loading.value = true
  result.value = null
  try {
    const res = await $fetch<{ id: string }>('/api/admin/test-email', {
      method: 'POST',
      headers: { 'x-admin-token': token.value },
      body: { to: to.value, language: language.value, template: template.value },
    })
    result.value = { ok: true, message: t('settings.testEmailSuccess', { id: res.id }) }
  }
  catch (err: unknown) {
    const msg = (err as { statusMessage?: string, message?: string })?.statusMessage
      ?? (err as { message?: string })?.message
      ?? t('common.error')
    result.value = { ok: false, message: t('settings.testEmailFailure', { error: msg }) }
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <form class="space-y-5" @submit.prevent="send">
    <div
      v-if="result"
      :class="[
        'rounded-sm border px-4 py-3 text-sm',
        result.ok
          ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
          : 'border-red-400/40 bg-red-400/10 text-red-200',
      ]"
      role="status"
    >
      {{ result.message }}
    </div>

    <div>
      <label for="test-email-to" class="block text-xs uppercase tracking-wider text-white/40 font-mono mb-2">
        {{ t('settings.testEmailTo') }}
      </label>
      <input
        id="test-email-to"
        v-model="to"
        type="email"
        required
        autocomplete="email"
        :placeholder="t('settings.testEmailToPlaceholder')"
        class="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-sm text-white focus:outline-none focus:border-white/40"
      >
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="test-email-language" class="block text-xs uppercase tracking-wider text-white/40 font-mono mb-2">
          {{ t('settings.testEmailLang') }}
        </label>
        <select
          id="test-email-language"
          v-model="language"
          class="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-sm text-white focus:outline-none focus:border-white/40"
        >
          <option value="eu">Euskara</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
      </div>

      <div>
        <label for="test-email-template" class="block text-xs uppercase tracking-wider text-white/40 font-mono mb-2">
          {{ t('settings.testEmailTemplate') }}
        </label>
        <select
          id="test-email-template"
          v-model="template"
          class="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-sm text-white focus:outline-none focus:border-white/40"
        >
          <option value="plain">{{ t('settings.testEmailTemplatePlain') }}</option>
          <option value="confirmation">{{ t('settings.testEmailTemplateConfirmation') }}</option>
          <option value="cancellation">{{ t('settings.testEmailTemplateCancellation') }}</option>
          <option value="gallery_notification">{{ t('settings.testEmailTemplateGalleryNotification') }}</option>
        </select>
      </div>
    </div>

    <div class="flex justify-end">
      <button
        type="submit"
        :disabled="loading"
        class="px-5 py-3 bg-white text-[#003153] text-xs uppercase tracking-wider font-mono rounded-sm hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {{ loading ? t('common.loading') : t('settings.testEmailSend') }}
      </button>
    </div>
  </form>
</template>
