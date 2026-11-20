import { describe, expect, it } from 'vitest'
import type { Place } from './cities'
import { normalize, searchCities } from './search'

const place = (name: string, country = 'Testland'): Place => ({
  name,
  country,
  timeZone: 'UTC',
})

const names = (results: Place[]) => results.map((result) => result.name)

const PLACES: Place[] = [
  place('Santiago', 'Chile'),
  place('San Juan', 'Puerto Rico'),
  place('San Francisco', 'USA'),
  place('São Paulo', 'Brazil'),
  place('New York', 'USA'),
  place('Bogotá', 'Colombia'),
  place('Tokyo', 'Japan'),
  place('Osaka', 'Japan'),
  place('Port-au-Port', 'Testland'),
  place('Lagos', 'Nigeria'),
  place('Lagoa', 'Portugal'),
]

describe('normalize', () => {
  it.each([
    ['  SÃO  paulo ', 'sao paulo'],
    ['Bogotá', 'bogota'],
    ["St. John's", "st. john's"],
    ['', ''],
  ])('%j -> %j', (input, expected) => {
    expect(normalize(input)).toBe(expected)
  })
})

describe('searchCities', () => {
  it.each(['', '   '])('returns nothing for a blank query (%j)', (query) => {
    expect(searchCities(query, PLACES)).toEqual([])
  })

  it('returns nothing when no city matches', () => {
    expect(searchCities('zzz', PLACES)).toEqual([])
  })

  it('finds names that start with the query, alphabetically', () => {
    expect(names(searchCities('san', PLACES))).toEqual(['San Francisco', 'San Juan', 'Santiago'])
  })

  it('ignores case and accents', () => {
    expect(names(searchCities('BOGOTA', PLACES))).toEqual(['Bogotá'])
    expect(names(searchCities('sao', PLACES))).toEqual(['São Paulo'])
  })

  it('matches a later word of the name', () => {
    expect(names(searchCities('york', PLACES))).toEqual(['New York'])
    expect(names(searchCities('au', PLACES))).toEqual(['Port-au-Port'])
  })

  it('puts an exact name before longer names', () => {
    expect(names(searchCities('lagos', PLACES))).toEqual(['Lagos'])
    expect(names(searchCities('lago', PLACES))).toEqual(['Lagoa', 'Lagos'])
  })

  it('finds cities by country, after name matches', () => {
    expect(names(searchCities('japan', PLACES))).toEqual(['Osaka', 'Tokyo'])
    // "us" starts no city name, so both USA cities match through their country
    expect(names(searchCities('us', PLACES))).toEqual(['New York', 'San Francisco'])
  })

  it('ranks name matches above country matches', () => {
    const places = [place('Zed', 'Paris Country'), place('Paris', 'France')]
    expect(names(searchCities('paris', places))).toEqual(['Paris', 'Zed'])
  })

  it('returns at most `limit` results', () => {
    expect(searchCities('s', PLACES, 2)).toHaveLength(2)
  })
})