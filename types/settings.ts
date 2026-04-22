export const SETTING_KEYS = {
  BOOKINGS_ACCEPT: 'bookings.accept',
  EMERGENCY_MESSAGE: 'emergency.message',
  NOTIFICATIONS_ENABLED: 'notifications.enabled',
  ANNOUNCEMENT_CONFIG: 'announcement.config',
} as const

export type SettingKey = typeof SETTING_KEYS[keyof typeof SETTING_KEYS]
