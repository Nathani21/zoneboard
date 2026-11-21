import { describe, expect, it } from 'vitest'
import {
  addCity,
  boardRow,
  DEFAULT_CITIES,
  MAX_ROWS,
  msUntilNextMinute,
  NAME_CELLS,
  rowCells,
  sameCity,
  toCells,
  withoutCities,
  type City,
} from './board'
import { isValidTimeZone } from './zones'

const at = (iso: string) => new Date(iso)

describe('toCells', () => {
  it('upper-cases and pads short text with spaces', () => {
    expect(toCells('Tokyo', 8)).toEqual(['T', 'O', 'K', 'Y', 'O', ' ', ' ', ' '])
  })

  it('cuts off text that is too long', () => {
    expect(toCells('San Francisco', 5).join('')).toBe('SAN F')
  })

  it('keeps accented letters as single cells', () => {
    expect(toCells('São Paulo', 9).join('')).toBe('SÃO PAULO')
  })

  it('returns all spaces for empty text', () => {
    expect(toCells('', 3)).toEqual([' ', ' ', ' '])
  })
})

describe('boardRow', () => {
  it('builds a row for London on 4 Oct 2026 (summer time)', () => {
    const row = boardRow(at('2026-10-04T13:28:00Z'), {
      name: 'London',
      timeZone: 'Europe/London',
    })
    expect(row.name).toBe('London')
    expect(row.time).toBe('14:28')
    expect(row.offset).toBe('GMT+1')
    expect(row.nameCells).toHaveLength(NAME_CELLS)
    expect(row.nameCells.join('').trimEnd()).toBe('LONDON')
  })
})

describe('rowCells', () => {
  it('puts the five time tiles before the name tiles', () => {
    const row = boardRow(at('2026-10-04T13:28:00Z'), { name: 'Tokyo', timeZone: 'Asia/Tokyo' })
    const cells = rowCells(row)
    expect(cells).toHaveLength(5 + NAME_CELLS)
    expect(cells.join('').trimEnd()).toBe('22:28TOKYO')
  })
})

describe('DEFAULT_CITIES', () => {
  it.each(DEFAULT_CITIES.map((city) => [city.name, city.timeZone]))(
    '%s uses a valid time zone (%s) and fits the board',
    (name, timeZone) => {
      expect(isValidTimeZone(timeZone)).toBe(true)
      expect(name.length).toBeLessThanOrEqual(NAME_CELLS)
    },
  )
})

describe('msUntilNextMinute', () => {
  it.each([
    ['2026-10-04T13:28:00.000Z', 60_000],
    ['2026-10-04T13:28:45.500Z', 14_500],
    ['2026-10-04T13:28:59.999Z', 1],
  ])('at %s waits %i ms', (iso, expected) => {
    expect(msUntilNextMinute(at(iso))).toBe(expected)
  })
})


const city = (name: string, timeZone = 'UTC'): City => ({ name, timeZone })

describe('sameCity', () => {
  it('matches on name and time zone', () => {
    expect(sameCity(city('Lagos', 'Africa/Lagos'), city('Lagos', 'Africa/Lagos'))).toBe(true)
    expect(sameCity(city('Lagos', 'Africa/Lagos'), city('Lagos', 'UTC'))).toBe(false)
    expect(sameCity(city('Lagos'), city('Abuja'))).toBe(false)
  })
})

describe('addCity', () => {
  it('adds a new city at the bottom without changing the original list', () => {
    const board = [city('A'), city('B')]
    expect(addCity(board, city('C'))).toEqual([city('A'), city('B'), city('C')])
    expect(board).toHaveLength(2)
  })

  it('returns the same list when the city is already on the board', () => {
    const board = [city('A'), city('B')]
    expect(addCity(board, city('B'))).toBe(board)
  })

  it('returns the same list when the board is full', () => {
    const board = Array.from({ length: MAX_ROWS }, (_, i) => city(`City ${i}`))
    expect(addCity(board, city('One too many'))).toBe(board)
  })
})

describe('withoutCities', () => {
  it('removes cities that are already on the board', () => {
    const places = [city('A'), city('B'), city('C')]
    expect(withoutCities(places, [city('B')])).toEqual([city('A'), city('C')])
  })

  it('keeps everything when the board is empty', () => {
    expect(withoutCities([city('A')], [])).toEqual([city('A')])
  })
})