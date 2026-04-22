import { defineEventHandler } from 'h3'
import { SETTING_KEYS } from '../../../types/settings'
import { getAllSettings } from '../../utils/admin-settings'
import { requireAdminToken } from '../../utils/require-admin'

export default defineEventHandler((event) => {
  requireAdminToken(event)
  const s = getAllSettings()
  return {
    [SETTING_KEYS.BOOKINGS_ACCEPT]: s[SETTING_KEYS.BOOKINGS_ACCEPT] ?? '1',
    [SETTING_KEYS.EMERGENCY_MESSAGE]: s[SETTING_KEYS.EMERGENCY_MESSAGE] ?? '',
    [SETTING_KEYS.NOTIFICATIONS_ENABLED]: s[SETTING_KEYS.NOTIFICATIONS_ENABLED] ?? '1',
    [SETTING_KEYS.ANNOUNCEMENT_CONFIG]: s[SETTING_KEYS.ANNOUNCEMENT_CONFIG] ?? '',
  }
})
