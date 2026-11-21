import { formatOffset, formatTime, utcOffsetMinutes } from './zones'

/** A city shown on the board: its display name and IANA time zone. */
export interface City {
  name: string
  timeZone: string
}

/** One board row, ready to draw. */
export interface BoardRow {
  name: string
  time: string
  nameCells: string[]
  offset: string
}

/** Cities shown until the visitor picks their own. */
export const DEFAULT_CITIES: readonly City[] = [
  { name: 'Los Angeles', timeZone: 'America/Los_Angeles' },
  { name: 'New York', timeZone: 'America/New_York' },
  { name: 'London', timeZone: 'Europe/London' },
  { name: 'Lagos', timeZone: 'Africa/Lagos' },
  { name: 'Dubai', timeZone: 'Asia/Dubai' },
  { name: 'Tokyo', timeZone: 'Asia/Tokyo' },
]

/** Number of character tiles in the city-name column. */
export const NAME_CELLS = 13

/** Most rows the board shows. */
export const MAX_ROWS = 8

/** True if both are the same city (same name and time zone). */
export function sameCity(a: City, b: City): boolean {
  return a.name === b.name && a.timeZone === b.timeZone
}

/**
 * The board with `city` added at the bottom. Returns the same array, unchanged,
 * if the city is already on the board or the board is full.
 */
export function addCity(cities: readonly City[], city: City): readonly City[] {
  if (cities.length >= MAX_ROWS || cities.some((onBoard) => sameCity(onBoard, city))) {
    return cities
  }
  return [...cities, city]
}

/** `places` without the cities already on the board, so search doesn't offer them again. */
export function withoutCities<T extends City>(places: readonly T[], onBoard: readonly City[]): T[] {
  return places.filter((place) => !onBoard.some((city) => sameCity(city, place)))
}

/**
 * Splits text into exactly `width` upper-case cells: shorter text is padded
 * with spaces, longer text is cut off.
 */
export function toCells(text: string, width: number): string[] {
  const cells = Array.from(text.toUpperCase()).slice(0, width)
  while (cells.length < width) {
    cells.push(' ')
  }
  return cells
}

/** Everything the board needs to draw one city at a given moment. */
export function boardRow(date: Date, city: City): BoardRow {
  return {
    name: city.name,
    time: formatTime(date, city.timeZone),
    nameCells: toCells(city.name, NAME_CELLS),
    offset: formatOffset(utcOffsetMinutes(date, city.timeZone)),
  }
}

/** All of a row's tiles in order: the five time tiles, then the name tiles. */
export function rowCells(row: BoardRow): string[] {
  return [...Array.from(row.time), ...row.nameCells]
}

/** Milliseconds from `date` until the next whole minute (never 0). */
export function msUntilNextMinute(date: Date): number {
  return 60_000 - (date.getTime() % 60_000)
}