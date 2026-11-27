import { describe, expect, it } from 'vitest'
import {
  elapsedMs,
  formatElapsed,
  isRunning,
  NEW_STOPWATCH,
  pause,
  start,
} from './stopwatch'

describe('stopwatch', () => {
  it('starts at zero and paused', () => {
    expect(isRunning(NEW_STOPWATCH)).toBe(false)
    expect(elapsedMs(NEW_STOPWATCH, 5000)).toBe(0)
  })

  it('counts while running', () => {
    const running = start(NEW_STOPWATCH, 1000)
    expect(isRunning(running)).toBe(true)
    expect(elapsedMs(running, 4500)).toBe(3500)
  })

  it('keeps its time when paused and stops counting', () => {
    const paused = pause(start(NEW_STOPWATCH, 1000), 4000)
    expect(isRunning(paused)).toBe(false)
    expect(elapsedMs(paused, 99_000)).toBe(3000)
  })

  it('adds a resumed run to the time so far', () => {
    const resumed = start(pause(start(NEW_STOPWATCH, 0), 2000), 10_000)
    expect(elapsedMs(resumed, 13_000)).toBe(5000)
  })

  it('ignores start while running and pause while paused', () => {
    const running = start(NEW_STOPWATCH, 1000)
    expect(start(running, 2000)).toBe(running)
    expect(pause(NEW_STOPWATCH, 2000)).toBe(NEW_STOPWATCH)
  })

  it('never goes below zero if the clock goes backwards', () => {
    expect(elapsedMs(start(NEW_STOPWATCH, 5000), 4000)).toBe(0)
  })
})

describe('formatElapsed', () => {
  it.each([
    [0, '00:00:00'],
    [999, '00:00:00'],
    [1000, '00:00:01'],
    [61_000, '00:01:01'],
    [3_600_000, '01:00:00'],
    [(25 * 3600 + 5 * 60 + 9) * 1000, '25:05:09'],
    [100 * 3_600_000, '99:59:59'],
    [-500, '00:00:00'],
  ])('%i ms -> %s', (ms, expected) => {
    expect(formatElapsed(ms)).toBe(expected)
  })
})