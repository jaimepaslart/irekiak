import { z } from 'zod'

export const bookingLanguageSchema = z.enum(['eu', 'es', 'fr', 'en'])

// Lenient international phone regex (E.164-ish, accepts spaces, dots, parens, dashes)
const phoneRegex = /^[+\d][\d\s().-]{5,29}$/

export const bookingRequestSchema = z.object({
  tourSlotId: z.string().min(1),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email().max(255),
  phone: z.string().trim().regex(phoneRegex, 'Invalid phone').max(50).optional().or(z.literal('').transform(() => undefined)),
  numberOfPeople: z.number().int().min(1).max(4),
  language: bookingLanguageSchema,
  specialNeeds: z.string().trim().max(1000).optional().or(z.literal('').transform(() => undefined)),
  acceptsPrivacyPolicy: z.literal(true),
  acceptsMarketing: z.boolean().optional().default(false),
})

export type BookingRequestInput = z.infer<typeof bookingRequestSchema>
