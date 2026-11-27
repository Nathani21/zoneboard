import { describe, expect, it } from 'vitest'
import { MODE_LABELS, MODES, parseMode } from './modes'

describe('parseMode', () => {
  it.each([
    ['#watch', 'watch'],
    ['#world', 'world'],
    ['#WATCH', 'watch'],
    ['watch', 'watch'],
    ['', 'world'],
    ['#', 'world'],
    ['#nope', 'world'],
  ])('%j -> %s', (hash, expected) => {
    expect(parseMode(hash)).toBe(expected)
  })
})

describe('MODE_LABELS', () => {
  it('has a label for every mode', () => {
    for (const mode of MODES) {
      expect(MODE_LABELS[mode]).toBeTruthy()
    }
  })
})