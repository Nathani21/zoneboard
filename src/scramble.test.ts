import { describe, expect, it } from 'vitest'
import {
  FLAP_CHARS,
  SCRAMBLE_FRAMES,
  STAGGER_FRAMES,
  scrambleFrame,
  scrambleLength,
  settleFrame,
} from './scramble'

const first = () => 0 // always picks FLAP_CHARS[0]
const last = () => 0.999999 // always picks the last character

describe('settleFrame', () => {
  it('settles tiles left to right', () => {
    expect(settleFrame(0)).toBe(SCRAMBLE_FRAMES)
    expect(settleFrame(3)).toBe(SCRAMBLE_FRAMES + 3 * STAGGER_FRAMES)
  })
})

describe('scrambleFrame', () => {
  it('never scrambles tiles that stay the same', () => {
    expect(scrambleFrame(['1', '2'], ['1', '2'], 0, first)).toEqual(['1', '2'])
  })

  it('shows a random character on a changing tile before it settles', () => {
    expect(scrambleFrame([' '], ['B'], 0, first)).toEqual([FLAP_CHARS[0]])
  })

  it('stays inside FLAP_CHARS when random is just below 1', () => {
    expect(scrambleFrame([' '], ['B'], 0, last)).toEqual([FLAP_CHARS[FLAP_CHARS.length - 1]])
  })

  it('shows the final character once the tile settles', () => {
    expect(scrambleFrame([' '], ['B'], settleFrame(0), first)).toEqual(['B'])
  })

  it('lets the left tile settle before the right one', () => {
    expect(scrambleFrame([' ', ' '], ['X', 'Y'], settleFrame(0), first)).toEqual(['X', FLAP_CHARS[0]])
  })

  it('only scrambles the tile that changed (14:28 -> 14:29)', () => {
    const frame = scrambleFrame(Array.from('14:28'), Array.from('14:29'), 0, first)
    expect(frame.join('')).toBe(`14:2${FLAP_CHARS[0]}`)
  })
})

describe('scrambleLength', () => {
  it('is 0 when nothing changes', () => {
    expect(scrambleLength(['A', 'B'], ['A', 'B'])).toBe(0)
  })

  it('lasts until the last changed tile settles', () => {
    expect(scrambleLength(Array.from('14:28'), Array.from('14:29'))).toBe(settleFrame(4) + 1)
  })

  it('ignores unchanged tiles after the last change', () => {
    expect(scrambleLength(['A', 'B', 'C'], ['X', 'B', 'C'])).toBe(settleFrame(0) + 1)
  })
})