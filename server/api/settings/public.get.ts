import { defineEventHandler } from 'h3'
import type { AnnouncementConfig, PublicSettings } from '../../../types/announcement'
import { SETTING_KEYS } from '../../../types/settings'
import { getSettingJson } from '../../utils/admin-settings'
import { defaultAnnouncement, isAnnouncementStillRelevant } from '../../utils/announcement-defaults'

/**
 * Public read-only settings endpoint — no auth required, used by the home
 * page to know whether to render the DAGGE announcement (and future public
 * banners). The date cutoff is enforced here so the client cannot bypass it
 * by tampering with the response.
 */
export default defineEventHandler((): PublicSettings => {
  const config = getSettingJson<AnnouncementConfig>(SETTING_KEYS.ANNOUNCEMENT_CONFIG, defaultAnnouncement)

  const announcement = config.enabled && isAnnouncementStillRelevant() ? config : null

  return { announcement }
})
