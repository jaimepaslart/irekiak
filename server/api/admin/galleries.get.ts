import { defineEventHandler } from 'h3'
import { getAllGalleryContacts } from '../../utils/gallery-contacts'
import { listGalleries } from '../../utils/gallery-overrides'
import { requireAdminToken } from '../../utils/require-admin'

export default defineEventHandler((event) => {
  requireAdminToken(event)
  const contacts = new Map(getAllGalleryContacts().map(c => [c.id, c.contact]))
  return listGalleries().map(g => ({
    id: g.id,
    slug: g.slug,
    name: g.name,
    imageUrl: g.imageUrl,
    overridden: g.overridden,
    contact: contacts.get(g.id) ?? null,
  }))
})
