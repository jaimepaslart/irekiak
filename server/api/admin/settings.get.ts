import { defineEventHandler } from 'h3'
import { getAllSettings } from '../../utils/admin-settings'
import { requireAdminToken } from '../../utils/require-admin'

export default defineEventHandler((event) => {
  requireAdminToken(event)
  const settings = getAllSettings()
  return {
    'bookings.accept': settings['bookings.accept'] ?? '1',
    'emergency.message': settings['emergency.message'] ?? '',
    'notifications.enabled': settings['notifications.enabled'] ?? '1',
    'announcement.config': settings['announcement.config'] ?? '',
  }
})
