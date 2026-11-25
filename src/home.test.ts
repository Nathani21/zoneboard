import { describe, expect, it } from 'vitest'
import type { Place } from './cities'
import { homeLabel, resolveHomeTimeZone, zoneCityName } from './home'

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

  it('names an old browser zone by its current city', () => {
    const zone = resolveHomeTimeZone('Asia/Calcutta')
    expect(homeLabel(new Date('2026-11-25T12:00:00Z'), zone, PLACES)).toBe('Kolkata · GMT+5:30')
  })

  it('follows summer time', () => {
    expect(homeLabel(new Date('2026-07-15T12:00:00Z'), 'America/Edmonton', PLACES)).toBe(
      'Edmonton · GMT-6',
    )
  })
})


describe('resolveHomeTimeZone', () => {
  it.each([
    ['Africa/Lagos', 'Africa/Lagos'],
    ['Asia/Calcutta', 'Asia/Kolkata'],
    ['Europe/Kiev', 'Europe/Kyiv'],
    ['Asia/Saigon', 'Asia/Ho_Chi_Minh'],
    [undefined, 'UTC'],
    ['', 'UTC'],
    ['Not/AZone', 'UTC'],
  ])('%j -> %s', (detected, expected) => {
    expect(resolveHomeTimeZone(detected)).toBe(expected)
  })
})