import type { AnnouncementConfig } from '~~/types/announcement'

const emptyLang = { eu: '', es: '', fr: '', en: '' }

function emptyAnnouncement(): AnnouncementConfig {
  return {
    enabled: true,
    eyebrow: { ...emptyLang },
    title: { ...emptyLang },
    paragraphs: [{ ...emptyLang }, { ...emptyLang }, { ...emptyLang }],
  }
}

/**
 * Loads, holds and saves the announcement shown on the public home. Used by
 * the dedicated admin editor page — centralises the POST/GET against the
 * admin settings endpoint so the page template stays thin.
 */
export function useAdminAnnouncement() {
  const token = inject<Ref<string>>('adminToken')!

  const announcement = ref<AnnouncementConfig>(emptyAnnouncement())
  const loading = ref(true)
  const saving = ref(false)
  const saveSuccess = ref(false)
  const saveError = ref<string | null>(null)
  const loadError = ref<string | null>(null)

  async function load() {
    loading.value = true
    loadError.value = null
    try {
      const res = await $fetch<{ 'announcement.config': string }>('/api/admin/settings', {
        headers: { 'x-admin-token': token.value },
      })
      const raw = res['announcement.config']
      let parsed: AnnouncementConfig | null = null
      if (raw) {
        try {
          parsed = JSON.parse(raw) as AnnouncementConfig
        }
        catch {
          parsed = null
        }
      }
      if (parsed) {
        announcement.value = parsed
      }
      else {
        // Fall back to the server-seeded defaults (DAGGE text in 4 languages).
        const pub = await $fetch<{ announcement: AnnouncementConfig | null }>('/api/settings/public')
        if (pub.announcement) announcement.value = pub.announcement
      }
    }
    catch (err: unknown) {
      loadError.value = (err as { statusMessage?: string })?.statusMessage ?? 'Load failed'
    }
    finally {
      loading.value = false
    }
  }

  async function save() {
    saveError.value = null
    saveSuccess.value = false
    saving.value = true
    try {
      await $fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'x-admin-token': token.value, 'Content-Type': 'application/json' },
        body: { key: 'announcement.config', value: JSON.stringify(announcement.value) },
      })
      saveSuccess.value = true
      setTimeout(() => { saveSuccess.value = false }, 4000)
    }
    catch (err: unknown) {
      saveError.value = (err as { statusMessage?: string })?.statusMessage ?? 'Save failed'
    }
    finally {
      saving.value = false
    }
  }

  return {
    announcement,
    loading,
    saving,
    saveSuccess,
    saveError,
    loadError,
    load,
    save,
  }
}
