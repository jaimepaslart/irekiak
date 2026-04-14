import { createEvent, type EventAttributes, type DateArray } from 'ics'

export interface BookingIcsData {
  bookingId: string
  routeName: string
  date: string // ISO YYYY-MM-DD
  startTime: string // HH:mm
  endTime: string // HH:mm
  email: string
  guests: number
}

function parseDateTime(dateIso: string, timeHm: string): DateArray {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateIso)
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeHm)
  if (!dateMatch || !timeMatch) {
    throw new Error(`Invalid date/time: ${dateIso} ${timeHm}`)
  }
  const [, y, mo, d] = dateMatch
  const [, h, mi] = timeMatch
  return [Number(y), Number(mo), Number(d), Number(h), Number(mi)]
}

function computeDurationMinutes(startHm: string, endHm: string): number {
  const s = startHm.split(':').map(Number)
  const e = endHm.split(':').map(Number)
  const startMin = (s[0] ?? 0) * 60 + (s[1] ?? 0)
  const endMin = (e[0] ?? 0) * 60 + (e[1] ?? 0)
  const diff = endMin - startMin
  if (diff <= 0) {
    throw new Error(`End time must be after start time: ${startHm} -> ${endHm}`)
  }
  return diff
}

/**
 * Generate an iCalendar (.ics) string for a booking confirmation email.
 * Throws an Error if generation fails.
 */
export function generateBookingIcs(data: BookingIcsData): string {
  const start = parseDateTime(data.date, data.startTime)
  const durationMinutes = computeDurationMinutes(data.startTime, data.endTime)

  const event: EventAttributes = {
    start,
    duration: { hours: Math.floor(durationMinutes / 60), minutes: durationMinutes % 60 },
    title: `Irekiak Gallery Weekend - ${data.routeName}`,
    description: `${data.guests} persons. Booking ID: ${data.bookingId}`,
    location: 'Donostia / San Sebastian',
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
    organizer: { name: 'Irekiak', email: 'irekiak@irekiak.eus' },
    attendees: [
      {
        email: data.email,
        rsvp: false,
        partstat: 'ACCEPTED',
        role: 'REQ-PARTICIPANT',
      },
    ],
    uid: `${data.bookingId}@irekiak.eus`,
    productId: 'irekiak/gallery-weekend',
    startInputType: 'local',
  }

  const { error, value } = createEvent(event)
  if (error || !value) {
    throw new Error(`Failed to generate ICS: ${error?.message ?? 'unknown error'}`)
  }
  return value
}
