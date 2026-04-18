export type PartnerTier = 'organizer' | 'support'

export interface Partner {
  id: string
  name: string
  logo?: string
  website?: string
  tier: PartnerTier
}
