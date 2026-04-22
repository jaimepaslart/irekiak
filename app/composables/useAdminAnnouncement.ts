import type { AnnouncementConfig } from '~~/types/announcement'
import { normalizeAnnouncement } from '~~/types/announcement'
import { SETTING_KEYS } from '~~/types/settings'
import { extractErrorMessage } from '~/utils/error-message'

const SAVE_SUCCESS_DISPLAY_MS = 4000

const emptyLang = { eu: '', es: '', fr: '', en: '' }

function emptyAnnouncement(): AnnouncementConfig {
  return {
    enabled: true,
    eyebrow: { ...emptyLang },
    title: { ...emptyLang },
    body: { ...emptyLang },
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

  let successTimer: ReturnType<typeof setTimeout> | null = null

  onBeforeUnmount(() => {
    if (successTimer) clearTimeout(successTimer)
  })

  async function load() {
    loading.value = true
    loadError.value = null
    try {
      const res = await $fetch<Record<string, string>>('/api/admin/settings', {
        headers: { 'x-admin-token': token.value },
      })
      const raw = res[SETTING_KEYS.ANNOUNCEMENT_CONFIG]
      let parsed: unknown = null
      if (raw) {
        try {
          parsed = JSON.parse(raw)
        }
        catch {
          parsed = null
        }
      }
      if (parsed) {
        announcement.value = normalizeAnnouncement(parsed)
      }
      else {
        // Galeristes who have never opened the editor need the DAGGE text pre-populated
        // — the public endpoint embeds the server-seeded defaults for that purpose.
        const pub = await $fetch<{ announcement: AnnouncementConfig | null }>('/api/settings/public')
        if (pub.announcement) announcement.value = normalizeAnnouncement(pub.announcement)
      }
    }
    catch (err: unknown) {
      loadError.value = extractErrorMessage(err, 'Load failed')
    }
    finally {
      loading.value = false
    }
  }

  async function save() {
    saveError.value = null
    saveSuccess.value = false
    saving.value = true
    if (successTimer) clearTimeout(successTimer)
    try {
      await $fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'x-admin-token': token.value, 'Content-Type': 'application/json' },
        body: { key: SETTING_KEYS.ANNOUNCEMENT_CONFIG, value: JSON.stringify(announcement.value) },
      })
      saveSuccess.value = true
      successTimer = setTimeout(() => { saveSuccess.value = false }, SAVE_SUCCESS_DISPLAY_MS)
    }
    catch (err: unknown) {
      saveError.value = extractErrorMessage(err, 'Save failed')
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
