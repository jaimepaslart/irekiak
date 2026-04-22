import type { AnnouncementConfig, PublicSettings } from '~~/types/announcement'

/**
 * Fetches the public announcement, if any. Returns null when the admin
 * toggled it off or the automatic cutoff date has passed (server enforces
 * both). Cached across pages via Nuxt's useFetch key.
 */
export async function useAnnouncement() {
  const { data } = await useFetch<PublicSettings>('/api/settings/public', {
    key: 'public-settings',
    default: () => ({ announcement: null }),
  })

  const announcement = computed<AnnouncementConfig | null>(() => data.value?.announcement ?? null)

  return { announcement }
}
