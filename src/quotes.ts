/**
 * Short quotes for Focus mode. Only old, well-attested lines from authors who
 * died long ago (or proverbs), so they're free to use and credit is certain.
 */
export interface Quote {
  text: string
  author: string
}

export const QUOTES: readonly Quote[] = [
  { text: 'The journey of a thousand miles begins with a single step.', author: 'Laozi' },
  { text: 'He who has begun has half done. Dare to be wise.', author: 'Horace' },
  { text: 'To do two things at once is to do neither.', author: 'Publilius Syrus' },
  { text: 'Time is the most valuable thing a man can spend.', author: 'Theophrastus' },
  { text: 'Practice is everything.', author: 'Periander' },
  { text: 'Lost time is never found again.', author: 'Benjamin Franklin' },
  { text: 'He that can have patience can have what he will.', author: 'Benjamin Franklin' },
  { text: 'Genius is one per cent inspiration and ninety-nine per cent perspiration.', author: 'Thomas Edison' },
  { text: 'Nothing is particularly hard if you divide it into small jobs.', author: 'Henry Ford' },
  { text: "Rome wasn't built in a day.", author: 'Proverb' },
]

/** The localStorage key for the last quote shown, so the next visit shows another. */
export const QUOTE_KEY = 'zoneboard:quote'

/**
 * A random quote index from `count`, never `previous` (when there's a choice),
 * so each visit shows a different quote. `random` is like Math.random.
 */
export function pickQuoteIndex(count: number, random: () => number, previous: number | null): number {
  if (count <= 1) {
    return 0
  }
  if (previous === null || previous < 0 || previous >= count) {
    return Math.floor(random() * count)
  }
  // Pick from the other count - 1 quotes, skipping over `previous`
  const index = Math.floor(random() * (count - 1))
  return index >= previous ? index + 1 : index
}

/** The saved quote index, or null if nothing valid is saved. */
export function parseQuoteIndex(text: string | null, count: number): number | null {
  if (text === null || !/^\d+$/.test(text)) {
    return null
  }
  const index = Number(text)
  return index < count ? index : null
}