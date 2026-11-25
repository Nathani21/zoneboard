import { MAX_ROWS, withoutCities, type City } from './board'
import type { Place } from './cities'
import { formatOffset, utcOffsetMinutes } from './zones'

/**
 * Lower-cases, trims, collapses spaces and strips accents, so "  SÃO  paulo"
 * and "sao paulo" compare equal.
 */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Words of a name, split on spaces, hyphens, dots and apostrophes. */
function words(text: string): string[] {
  return text.split(/[\s\-.']+/).filter(Boolean)
}

/**
 * How well a place matches an already-normalized query; lower is better,
 * null means no match. 0 exact name, 1 name starts with the query,
 * 2 a later word of the name does ("york" -> New York), 3 the country does.
 */
function matchRank(place: Place, query: string): number | null {
  const name = normalize(place.name)
  if (name === query) return 0
  if (name.startsWith(query)) return 1
  if (words(name).some((word) => word.startsWith(query))) return 2
  const country = normalize(place.country)
  if (country.startsWith(query) || words(country).some((word) => word.startsWith(query))) {
    return 3
  }
  return null
}

/**
 * Places matching `query`, best matches first and alphabetical within the
 * same rank, at most `limit` of them. A blank query returns nothing.
 */
export function searchCities(query: string, places: readonly Place[], limit = 6): Place[] {
  const q = normalize(query)
  if (q === '') {
    return []
  }
  return places
    .map((place) => ({ place, rank: matchRank(place, q) }))
    .filter((match): match is { place: Place; rank: number } => match.rank !== null)
    .sort((a, b) => a.rank - b.rank || a.place.name.localeCompare(b.place.name, 'en'))
    .slice(0, limit)
    .map((match) => match.place)
}

/** The small text under a search result, e.g. "USA · GMT-8". */
export function resultDetail(place: Place, date: Date): string {
  return `${place.country} · ${formatOffset(utcOffsetMinutes(date, place.timeZone))}`
}


/** What a search for a city to add came to, so the search box knows what to say. */
export type SearchOutcome = 'empty' | 'results' | 'full' | 'on-board' | 'no-match'

export interface CitiesToAdd {
  matches: Place[]
  outcome: SearchOutcome
}

/**
 * Cities matching `query` that can still be added to the board, and why the
 * list is empty when it is: a blank query, a full board, every match already
 * on the board, or no match at all.
 */
export function findCitiesToAdd(
  query: string,
  places: readonly Place[],
  onBoard: readonly City[],
  maxRows = MAX_ROWS,
): CitiesToAdd {
  const blank = query.trim() === ''
  if (onBoard.length >= maxRows) {
    return { matches: [], outcome: blank ? 'empty' : 'full' }
  }
  if (blank) {
    return { matches: [], outcome: 'empty' }
  }
  const matches = searchCities(query, withoutCities(places, onBoard))
  if (matches.length > 0) {
    return { matches, outcome: 'results' }
  }
  const outcome = searchCities(query, places).length > 0 ? 'on-board' : 'no-match'
  return { matches: [], outcome }
}