/**
 * One split-flap tile. It's drawn as two halves; when the character changes,
 * the old top half folds down over the bottom and lands showing the new one.
 * The fold timing lives in style.css (--half-flip).
 */
export interface Tile {
  element: HTMLSpanElement
  /** The character the tile shows (or is flipping to). */
  char: string
  /** Text of the fixed top and bottom halves. */
  top: HTMLSpanElement
  bottom: HTMLSpanElement
  /** The moving halves of a flip that's still running. */
  flaps: HTMLSpanElement[]
}

/** A top or bottom half: a clipped box holding a full-height character. */
function half(
  position: 'top' | 'bottom',
  kind: 'half' | 'flap',
  char: string,
): [HTMLSpanElement, HTMLSpanElement] {
  const outer = document.createElement('span')
  outer.className = `${kind} ${position}`
  const inner = document.createElement('span')
  inner.textContent = char
  outer.append(inner)
  return [outer, inner]
}

/** A blank tile. */
export function createTile(): Tile {
  const element = document.createElement('span')
  element.className = 'cell'
  const [topHalf, top] = half('top', 'half', '')
  const [bottomHalf, bottom] = half('bottom', 'half', '')
  element.append(topHalf, bottomHalf)
  return { element, char: '', top, bottom, flaps: [] }
}

/**
 * Shows `next` on the tile. With `animate`, the old character's top half
 * folds down and the new character's bottom half lands under it.
 */
export function setTile(tile: Tile, next: string, animate: boolean): void {
  if (tile.char === next) {
    return
  }
  const previous = tile.char
  tile.char = next

  // A newer flip replaces one that's still running
  for (const flap of tile.flaps) {
    flap.remove()
  }
  tile.flaps = []

  // The new top is revealed as the old top folds away
  tile.top.textContent = next
  if (!animate) {
    tile.bottom.textContent = next
    return
  }
  // The old bottom stays until the new bottom lands on it
  tile.bottom.textContent = previous

  const [falling] = half('top', 'flap', previous)
  const [landing] = half('bottom', 'flap', next)
  landing.addEventListener('animationend', () => {
    tile.bottom.textContent = tile.char
    falling.remove()
    landing.remove()
  })
  tile.flaps = [falling, landing]
  tile.element.append(falling, landing)
}