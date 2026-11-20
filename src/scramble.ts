/**
 * Pure split-flap scramble logic. Given the characters a row shows now and the
 * characters it should show, works out what each animation frame looks like.
 * No DOM or timers here, so it can be unit-tested.
 */

/** Characters a tile flips through while it scrambles. */
export const FLAP_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

/** Frames a changed tile scrambles before the first tile settles. */
export const SCRAMBLE_FRAMES = 6

/** Extra frames each tile waits after the one to its left, so tiles settle left to right. */
export const STAGGER_FRAMES = 1

/** The frame at which tile `index` shows its final character. */
export function settleFrame(index: number): number {
  return SCRAMBLE_FRAMES + index * STAGGER_FRAMES
}

/**
 * What a row shows at `frame`. Tiles that don't change show their final
 * character straight away; changed tiles show a random character until they settle.
 * `random` returns a number in [0, 1), like Math.random (injected so tests can fix it).
 */
export function scrambleFrame(
  from: readonly string[],
  to: readonly string[],
  frame: number,
  random: () => number,
): string[] {
  return to.map((target, index) => {
    if (from[index] === target || frame >= settleFrame(index)) {
      return target
    }
    return FLAP_CHARS[Math.floor(random() * FLAP_CHARS.length)]
  })
}

/** How many frames the animation from `from` to `to` lasts (0 if nothing changes). */
export function scrambleLength(from: readonly string[], to: readonly string[]): number {
  let lastChanged = -1
  to.forEach((target, index) => {
    if (from[index] !== target) {
      lastChanged = index
    }
  })
  return lastChanged === -1 ? 0 : settleFrame(lastChanged) + 1
}