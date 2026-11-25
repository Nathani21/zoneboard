import { describe, expect, it } from 'vitest'
import type { Place } from './cities'
import { homeLabel, zoneCityName } from './home'

const PLACES: Place[] = [
  { name: 'Bogotá', country: 'Colombia', timeZone: 'America/Bogota' },
  { name: 'Calgary', country: 'Canada', timeZone: 'America/Edmonton' },
  { name: 'Lagos', country: 'Nigeria', timeZone: 'Africa/Lagos' },
]

describe('zoneCityName', () => {
  it.each([
    ['Africa/Lagos', 'Lagos'],
    ['America/Bogota', 'Bogotá'],
    ['America/Argentina/Buenos_Aires', 'Buenos Aires'],
    ['America/Edmonton', 'Edmonton'],
    ['UTC', 'UTC'],
  ])('%s -> %s', (timeZone, expected) => {
    expect(zoneCityName(timeZone, PLACES)).toBe(expected)
  })
})

describe('homeLabel', () => {
  it('shows the city and its offset at that moment', () => {
    expect(homeLabel(new Date('2026-11-25T12:00:00Z'), 'Africa/Lagos', PLACES)).toBe('Lagos · GMT+1')
  })

  it('follows summer time', () => {
    expect(homeLabel(new Date('2026-07-15T12:00:00Z'), 'America/Edmonton', PLACES)).toBe(
      'Edmonton · GMT-6',
    )
  })
})