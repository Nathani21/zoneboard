/**
 * Pure time-zone helpers for zoneboard. No DOM access, so everything here
 * can be unit-tested in Node.
 */

/** Returns true if the browser/Node knows this IANA time zone (e.g. "Africa/Lagos"). */
export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone })
    return true
  } catch {
    return false
  }
}

/** 24-hour "HH:MM" time in the given zone, e.g. "06:28". */
export function formatTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date)
}

/** Offset from UTC in minutes at that moment, e.g. -240 for New York in summer. */
export function utcOffsetMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'longOffset',
  }).formatToParts(date)
  const name = parts.find((part) => part.type === 'timeZoneName')?.value ?? 'GMT'
  const match = /^GMT([+-])(\d{2}):(\d{2})$/.exec(name)
  if (!match) {
    return 0 // plain "GMT" means UTC+0
  }
  const sign = match[1] === '-' ? -1 : 1
  return sign * (Number(match[2]) * 60 + Number(match[3]))
}

/** Short offset label: 0 -> "GMT", -240 -> "GMT-4", 330 -> "GMT+5:30". */
export function formatOffset(minutes: number): string {
  if (minutes === 0) {
    return 'GMT'
  }
  const sign = minutes < 0 ? '-' : '+'
  const total = Math.abs(minutes)
  const hours = Math.floor(total / 60)
  const mins = total % 60
  return mins === 0
    ? `GMT${sign}${hours}`
    : `GMT${sign}${hours}:${String(mins).padStart(2, '0')}`
}


/**
 * Short date in the given zone, e.g. "Wed 25 Nov". The locale decides the
 * order and punctuation; leave it out to use the visitor's own.
 */
export function formatDate(date: Date, timeZone: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date)
}