import type { Place } from './cities'
import { normalize } from './search'
import { formatOffset, utcOffsetMinutes } from './zones'

/**
 * The visitor's own time zone, as a readable city name and offset. Pure: the
 * zone is passed in, so tests don't depend on where they run.
 */

/**
 * A readable city name for an IANA zone, taken from the zone's last part
 * ("America/Argentina/Buenos_Aires" -> "Buenos Aires"). If the city list has
 * that city in that zone, its spelling wins ("America/Bogota" -> "Bogotá").
 */
export function zoneCityName(timeZone: string, places: readonly Place[]): string {
  const fromId = (timeZone.split('/').at(-1) ?? timeZone).replaceAll('_', ' ')
  const listed = places.find(
    (place) => place.timeZone === timeZone && normalize(place.name) === normalize(fromId),
  )
  return listed?.name ?? fromId
}

/** The time zone button's text, e.g. "Lagos · GMT+1". */
export function homeLabel(date: Date, timeZone: string, places: readonly Place[]): string {
  const offset = formatOffset(utcOffsetMinutes(date, timeZone))
  return `${zoneCityName(timeZone, places)} · ${offset}`
}