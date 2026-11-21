import { describe, expect, it } from 'vitest'
import indexHtml from '../index.html?raw'
import { MAX_ROWS, type City } from './board'
import { parseSavedCities, parseTheme, serializeCities, THEME_KEY, THEMES } from './storage'

const lagos: City = { name: 'Lagos', timeZone: 'Africa/Lagos' }
const tokyo: City = { name: 'Tokyo', timeZone: 'Asia/Tokyo' }

describe('serializeCities', () => {
  it('round-trips through parseSavedCities', () => {
    expect(parseSavedCities(serializeCities([lagos, tokyo]))).toEqual([lagos, tokyo])
  })

  it('keeps only name and time zone', () => {
    const withCountry = { ...lagos, country: 'Nigeria' }
    expect(JSON.parse(serializeCities([withCountry]))).toEqual([lagos])
  })
})

describe('parseSavedCities', () => {
  it.each([
    ['nothing saved', null],
    ['broken JSON', '[{"name":'],
    ['not a list', '{"name":"Lagos","timeZone":"Africa/Lagos"}'],
    ['an empty list', '[]'],
    ['no valid cities', '[{"name":"Nowhere","timeZone":"Not/AZone"}]'],
  ])('returns null for %s', (_label, text) => {
    expect(parseSavedCities(text)).toBeNull()
  })

  it('skips invalid entries and keeps the valid ones', () => {
    const text = JSON.stringify([
      null,
      'Lagos',
      { name: 'No zone' },
      { name: 42, timeZone: 'UTC' },
      { name: '   ', timeZone: 'UTC' },
      { name: 'Far Too Long A Name', timeZone: 'UTC' },
      { name: 'Bad zone', timeZone: 'Mars/Olympus' },
      lagos,
    ])
    expect(parseSavedCities(text)).toEqual([lagos])
  })

  it('drops repeated cities', () => {
    expect(parseSavedCities(JSON.stringify([lagos, tokyo, lagos]))).toEqual([lagos, tokyo])
  })

  it(`keeps at most ${MAX_ROWS} cities`, () => {
    const many = Array.from({ length: MAX_ROWS + 3 }, (_, i) => ({ name: `City ${i}`, timeZone: 'UTC' }))
    expect(parseSavedCities(JSON.stringify(many))).toHaveLength(MAX_ROWS)
  })
})


describe('parseTheme', () => {
  it.each(THEMES)('keeps a saved %s', (theme) => {
    expect(parseTheme(theme)).toBe(theme)
  })

  it.each([null, '', 'blue', 'LIGHT'])('falls back to system for %j', (text) => {
    expect(parseTheme(text)).toBe('system')
  })

  it('uses the same key as the early script in index.html', () => {
    expect(indexHtml).toContain(`'${THEME_KEY}'`)
  })
})