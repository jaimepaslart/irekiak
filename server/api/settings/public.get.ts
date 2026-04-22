import { defineEventHandler, setResponseHeader } from 'h3'
import { normalizeAnnouncement, type PublicSettings } from '../../../types/announcement'
import { SETTING_KEYS } from '../../../types/settings'
import { getSettingJson } from '../../utils/admin-settings'
import { defaultAnnouncement, isAnnouncementStillRelevant } from '../../utils/announcement-defaults'

/**
 * Public read-only settings endpoint — no auth required, used by the home
 * page to know whether to render the DAGGE announcement (and future public
 * banners). The date cutoff is enforced here so the client cannot bypass it
 * by tampering with the response.
 */
export default defineEventHandler((event): PublicSettings => {
  // Short-lived cache matches the in-memory 30s cache in admin-settings; lets
  // CDN/proxies absorb spikes from the home page without delaying admin edits.
  setResponseHeader(event, 'Cache-Control', 'public, max-age=30, s-maxage=30')

  const raw = getSettingJson<unknown>(SETTING_KEYS.ANNOUNCEMENT_CONFIG, defaultAnnouncement)
  const config = normalizeAnnouncement(raw)

  const announcement = config.enabled && isAnnouncementStillRelevant() ? config : null

  return { announcement }
})
