import { z } from 'zod'

export const bookingLanguageSchema = z.enum(['eu', 'es', 'fr', 'en'])

export const bookingRequestSchema = z.object({
  tourSlotId: z.string().min(1),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.email().max(255),
  phone: z.string().trim().min(1).max(50).optional(),
  numberOfPeople: z.number().int().min(1).max(4),
  language: bookingLanguageSchema,
  specialNeeds: z.string().trim().max(1000).optional(),
  acceptsTerms: z.literal(true),
})

export type BookingRequestInput = z.infer<typeof bookingRequestSchema>
