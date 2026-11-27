/**
 * A stopwatch as plain data. Every function takes the current time (`now`, in
 * milliseconds) instead of reading a clock, so it can be tested exactly.
 */
export interface Stopwatch {
  /** When the current run started, or null while paused. */
  startedAt: number | null
  /** Time from earlier runs, before the latest pause. */
  elapsed: number
}

export const NEW_STOPWATCH: Stopwatch = { startedAt: null, elapsed: 0 }

export function isRunning(stopwatch: Stopwatch): boolean {
  return stopwatch.startedAt !== null
}

/** Starts (or resumes) timing; does nothing if it's already running. */
export function start(stopwatch: Stopwatch, now: number): Stopwatch {
  return isRunning(stopwatch) ? stopwatch : { startedAt: now, elapsed: stopwatch.elapsed }
}

/** Pauses, keeping the time so far; does nothing if it's already paused. */
export function pause(stopwatch: Stopwatch, now: number): Stopwatch {
  if (stopwatch.startedAt === null) {
    return stopwatch
  }
  return { startedAt: null, elapsed: stopwatch.elapsed + (now - stopwatch.startedAt) }
}

/** Total time on the stopwatch at `now`, in milliseconds. */
export function elapsedMs(stopwatch: Stopwatch, now: number): number {
  const running = stopwatch.startedAt === null ? 0 : now - stopwatch.startedAt
  return Math.max(0, stopwatch.elapsed + running)
}

/** Longest time the display can show: 99:59:59. */
const MAX_SECONDS = 99 * 3600 + 59 * 60 + 59

/** Elapsed time as "HH:MM:SS", whole seconds, stopping at 99:59:59. */
export function formatElapsed(ms: number): string {
  const total = Math.min(Math.floor(Math.max(0, ms) / 1000), MAX_SECONDS)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':')
}