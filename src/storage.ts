import { MAX_ROWS, NAME_CELLS, sameCity, type City } from './board'
import { isValidTimeZone } from './zones'

/**
 * Turning the board into text for the browser's storage and back. Pure: this
 * module never touches localStorage itself, so it can be unit-tested. Saved
 * text is treated as untrusted, since anyone can edit it in DevTools.
 */

/** The localStorage key the board's cities are saved under. */
export const STORAGE_KEY = 'zoneboard:cities'

/** The board as JSON, keeping only each city's name and time zone. */
export function serializeCities(cities: readonly City[]): string {
  return JSON.stringify(cities.map(({ name, timeZone }) => ({ name, timeZone })))
}

/** True if `item` looks like a city this board can show. */
function isSavedCity(item: unknown): item is City {
  if (typeof item !== 'object' || item === null) {
    return false
  }
  const { name, timeZone } = item as Record<string, unknown>
  return (
    typeof name === 'string' &&
    name.trim() !== '' &&
    name.length <= NAME_CELLS &&
    typeof timeZone === 'string' &&
    isValidTimeZone(timeZone)
  )
}

/**
 * Cities from saved text, skipping anything invalid or repeated and keeping
 * at most MAX_ROWS. Returns null when there's nothing usable (nothing saved,
 * broken JSON, or no valid cities), so the caller can fall back to defaults.
 */
export function parseSavedCities(text: string | null): City[] | null {
  if (text === null) {
    return null
  }
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return null
  }
  if (!Array.isArray(data)) {
    return null
  }
  const cities: City[] = []
  for (const item of data) {
    if (!isSavedCity(item)) {
      continue
    }
    const city = { name: item.name, timeZone: item.timeZone }
    if (cities.some((saved) => sameCity(saved, city))) {
      continue
    }
    cities.push(city)
    if (cities.length === MAX_ROWS) {
      break
    }
  }
  return cities.length > 0 ? cities : null
}