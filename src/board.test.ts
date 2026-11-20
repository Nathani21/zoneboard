import { describe, expect, it } from 'vitest'
import { boardRow, DEFAULT_CITIES, msUntilNextMinute, NAME_CELLS, toCells } from './board'
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