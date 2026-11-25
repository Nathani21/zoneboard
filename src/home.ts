import type { Place } from './cities'
import { normalize } from './search'
import { formatOffset, isValidTimeZone, utcOffsetMinutes } from './zones'

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

/**
 * Old zone names that browsers still report (Chrome says "Asia/Calcutta" for
 * someone in India), mapped to their current names.
 */
const RENAMED_ZONES = new Map<string, string>([
  ['America/Buenos_Aires', 'America/Argentina/Buenos_Aires'],
  ['Asia/Calcutta', 'Asia/Kolkata'],
  ['Asia/Dacca', 'Asia/Dhaka'],
  ['Asia/Katmandu', 'Asia/Kathmandu'],
  ['Asia/Rangoon', 'Asia/Yangon'],
  ['Asia/Saigon', 'Asia/Ho_Chi_Minh'],
  ['Asia/Thimbu', 'Asia/Thimphu'],
  ['Asia/Ulan_Bator', 'Asia/Ulaanbaatar'],
  ['Atlantic/Faeroe', 'Atlantic/Faroe'],
  ['Europe/Kiev', 'Europe/Kyiv'],
])

/**
 * The visitor's zone from what the browser reports: the current name if the
 * browser used an old one, or UTC if it reported nothing usable.
 */
export function resolveHomeTimeZone(detected: string | undefined): string {
  if (!detected) {
    return 'UTC'
  }
  const current = RENAMED_ZONES.get(detected) ?? detected
  if (isValidTimeZone(current)) {
    return current
  }
  return isValidTimeZone(detected) ? detected : 'UTC'
}

/** The time zone button's text, e.g. "Lagos · GMT+1". */
export function homeLabel(date: Date, timeZone: string, places: readonly Place[]): string {
  const offset = formatOffset(utcOffsetMinutes(date, timeZone))
  return `${zoneCityName(timeZone, places)} · ${offset}`
}