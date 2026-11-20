import { describe, expect, it } from 'vitest'
import { DEFAULT_CITIES, NAME_CELLS } from './board'
import { CITIES } from './cities'
import { isValidTimeZone } from './zones'

describe('CITIES', () => {
  it('uses only valid time zones', () => {
    const invalid = CITIES.filter((city) => !isValidTimeZone(city.timeZone))
    expect(invalid).toEqual([])
  })

  it('has names that fit on the board', () => {
    const tooLong = CITIES.filter((city) => city.name.length > NAME_CELLS)
    expect(tooLong).toEqual([])
  })

  it('has no duplicate cities', () => {
    const keys = CITIES.map((city) => `${city.name}|${city.country}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('includes every default board city with the same time zone', () => {
    for (const city of DEFAULT_CITIES) {
      const match = CITIES.find((place) => place.name === city.name)
      expect(match?.timeZone).toBe(city.timeZone)
    }
  })
})