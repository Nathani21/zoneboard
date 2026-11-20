import { describe, expect, it } from 'vitest'
import { formatOffset, formatTime, isValidTimeZone, utcOffsetMinutes } from './zones'

const at = (iso: string) => new Date(iso)

describe('formatTime', () => {
  // One moment, five cities: 13:28 UTC on Sun 4 Oct 2026 (summer time in LA, NY and London)
  it.each([
    ['America/Los_Angeles', '06:28'],
    ['America/New_York', '09:28'],
    ['Europe/London', '14:28'],
    ['Asia/Dubai', '17:28'],
    ['Asia/Tokyo', '22:29'],
  ])('shows %s as %s', (zone, expected) => {
    expect(formatTime(at('2026-10-04T13:28:00Z'), zone)).toBe(expected)
  })

  it('follows winter time (London = UTC, New York = UTC-5)', () => {
    const jan = at('2026-01-15T13:28:00Z')
    expect(formatTime(jan, 'Europe/London')).toBe('13:28')
    expect(formatTime(jan, 'America/New_York')).toBe('08:28')
  })

  it('shows midnight as 00:00, not 24:00', () => {
    expect(formatTime(at('2026-01-01T08:00:00Z'), 'America/Los_Angeles')).toBe('00:00')
  })

  it('crosses into the next day and year', () => {
    expect(formatTime(at('2026-12-31T23:30:00Z'), 'Asia/Tokyo')).toBe('08:30')
  })
})

describe('utcOffsetMinutes', () => {
  it.each([
    ['UTC', '2026-10-04T12:00:00Z', 0],
    ['Africa/Lagos', '2026-10-04T12:00:00Z', 60],
    ['America/New_York', '2026-10-04T12:00:00Z', -240],
    ['America/New_York', '2026-01-15T12:00:00Z', -300],
    ['Asia/Kolkata', '2026-10-04T12:00:00Z', 330],
    ['Asia/Kathmandu', '2026-10-04T12:00:00Z', 345],
    ['America/St_Johns', '2026-01-15T12:00:00Z', -210],
    ['Australia/Adelaide', '2026-01-15T12:00:00Z', 630],
  ])('%s at %s is %i minutes', (zone, iso, expected) => {
    expect(utcOffsetMinutes(at(iso), zone)).toBe(expected)
  })

  it('changes at the exact moment summer time starts (New York, 8 Mar 2026)', () => {
    expect(utcOffsetMinutes(at('2026-03-08T06:59:00Z'), 'America/New_York')).toBe(-300)
    expect(utcOffsetMinutes(at('2026-03-08T07:00:00Z'), 'America/New_York')).toBe(-240)
  })
})

describe('formatOffset', () => {
  it.each([
    [0, 'GMT'],
    [60, 'GMT+1'],
    [-240, 'GMT-4'],
    [330, 'GMT+5:30'],
    [345, 'GMT+5:45'],
    [-210, 'GMT-3:30'],
    [840, 'GMT+14'],
    [-720, 'GMT-12'],
  ])('%i minutes is %s', (minutes, expected) => {
    expect(formatOffset(minutes)).toBe(expected)
  })
})

describe('isValidTimeZone', () => {
  it.each([
    ['Africa/Lagos', true],
    ['UTC', true],
    ['Not/AZone', false],
  ])('%s -> %s', (zone, expected) => {
    expect(isValidTimeZone(zone)).toBe(expected)
  })
})