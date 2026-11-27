import { describe, expect, it } from 'vitest'
import { handAngles } from './watch'

describe('handAngles', () => {
  it.each([
    [{ hours: 0, minutes: 0, seconds: 0 }, { hour: 0, minute: 0, second: 0 }],
    [{ hours: 3, minutes: 0, seconds: 0 }, { hour: 90, minute: 0, second: 0 }],
    [{ hours: 6, minutes: 30, seconds: 0 }, { hour: 195, minute: 180, second: 0 }],
    [{ hours: 9, minutes: 45, seconds: 30 }, { hour: 292.75, minute: 273, second: 180 }],
    [{ hours: 15, minutes: 0, seconds: 0 }, { hour: 90, minute: 0, second: 0 }],
  ])('%j -> %j', (parts, expected) => {
    expect(handAngles(parts)).toEqual(expected)
  })
})