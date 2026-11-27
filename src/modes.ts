/** The app's screens, in the order the tabs show them. */
export const MODES = ['world', 'watch'] as const

export type Mode = (typeof MODES)[number]

/** Tab labels for each mode. */
export const MODE_LABELS: Record<Mode, string> = {
  world: 'World Time',
  watch: 'Watch',
}

/**
 * The mode a URL hash asks for ("#watch" -> watch). Anything else, including
 * no hash, opens World Time, so old links keep working.
 */
export function parseMode(hash: string): Mode {
  const name = hash.replace(/^#/, '').toLowerCase()
  return MODES.find((mode) => mode === name) ?? 'world'
}