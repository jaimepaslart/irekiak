// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { bookingRequestSchema } from './validation'

const validInput = {
  tourSlotId: 'slot-123',
  firstName: 'Ane',
  lastName: 'Etxeberria',
  email: 'ane@example.eus',
  phone: '+34 600 000 000',
  numberOfPeople: 2,
  language: 'eu' as const,
  specialNeeds: undefined,
  acceptsTerms: true as const,
}

describe('bookingRequestSchema', () => {
  it('accepts a valid booking payload', () => {
    const result = bookingRequestSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('accepts a valid payload without optional fields', () => {
    const { phone: _phone, specialNeeds: _specialNeeds, ...minimal } = validInput
    const result = bookingRequestSchema.safeParse(minimal)
    expect(result.success).toBe(true)
  })

  it('rejects when a required field is missing', () => {
    const { firstName: _firstName, ...missing } = validInput
    const result = bookingRequestSchema.safeParse(missing)
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map(i => i.path.join('.'))
      expect(paths).toContain('firstName')
    }
  })

  it('rejects when numberOfPeople exceeds 4', () => {
    const result = bookingRequestSchema.safeParse({ ...validInput, numberOfPeople: 5 })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map(i => i.path.join('.'))
      expect(paths).toContain('numberOfPeople')
    }
  })

  it('rejects when numberOfPeople is below 1', () => {
    const result = bookingRequestSchema.safeParse({ ...validInput, numberOfPeople: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid email address', () => {
    const result = bookingRequestSchema.safeParse({ ...validInput, email: 'not-an-email' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map(i => i.path.join('.'))
      expect(paths).toContain('email')
    }
  })

  it('rejects when acceptsTerms is false', () => {
    const result = bookingRequestSchema.safeParse({ ...validInput, acceptsTerms: false })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map(i => i.path.join('.'))
      expect(paths).toContain('acceptsTerms')
    }
  })

  it('rejects unsupported language codes', () => {
    const result = bookingRequestSchema.safeParse({ ...validInput, language: 'de' })
    expect(result.success).toBe(false)
  })
})
