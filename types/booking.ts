export interface BookingRequest {
  tourSlotId: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  numberOfPeople: number
  language: 'eu' | 'es' | 'fr' | 'en'
  specialNeeds?: string
  acceptsTerms: boolean
}

export interface BookingConfirmation {
  bookingId: string
  status: 'confirmed' | 'waitlist' | 'cancelled'
  numberOfPeople: number
  createdAt: string
}
