import { defineEventHandler } from 'h3'
import { getAllGalleryContacts } from '../../utils/gallery-contacts'
import { requireAdminToken } from '../../utils/require-admin'

export default defineEventHandler((event) => {
  requireAdminToken(event)
  return getAllGalleryContacts()
})
