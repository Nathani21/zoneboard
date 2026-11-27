import { describe, expect, it } from 'vitest'
import { parseQuoteIndex, pickQuoteIndex, QUOTES } from './quotes'

describe('QUOTES', () => {
  it('every quote has text and an author, and is short enough to read at a glance', () => {
    const bad = QUOTES.filter((q) => !q.text.trim() || !q.author.trim() || q.text.length > 120)
    expect(bad).toEqual([])
  })

  it('has no repeated quotes', () => {
    expect(new Set(QUOTES.map((q) => q.text)).size).toBe(QUOTES.length)
  })
})

describe('pickQuoteIndex', () => {
  const first = () => 0
  const last = () => 0.999999

  it('picks any quote when there was none before', () => {
    expect(pickQuoteIndex(5, first, null)).toBe(0)
    expect(pickQuoteIndex(5, last, null)).toBe(4)
  })

  it('never repeats the previous quote', () => {
    expect(pickQuoteIndex(5, first, 0)).toBe(1)
    expect(pickQuoteIndex(5, last, 4)).toBe(3)
    expect(pickQuoteIndex(5, () => 0.5, 2)).toBe(3)
  })

  it('treats an out-of-range previous as none', () => {
    expect(pickQuoteIndex(5, last, 9)).toBe(4)
  })

  it('returns 0 when there is only one quote', () => {
    expect(pickQuoteIndex(1, last, 0)).toBe(0)
  })
})

describe('parseQuoteIndex', () => {
  it.each([
    ['3', 3],
    ['0', 0],
    [null, null],
    ['', null],
    ['-1', null],
    ['2.5', null],
    ['abc', null],
    ['10', null],
  ])('%j -> %j', (text, expected) => {
    expect(parseQuoteIndex(text, 10)).toBe(expected)
  })
})