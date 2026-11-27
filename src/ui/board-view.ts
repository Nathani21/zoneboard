import {
  addCity,
  boardRow,
  NAME_CELLS,
  removeCity,
  rowCells,
  type City,
} from '../board'
import { scrambleFrame, scrambleLength } from '../scramble'
import { createTile, setTile, type Tile } from './flap'

/**
 * How long each scramble frame stays on screen. A little longer than one
 * whole flip (2 × --half-flip in style.css), so each fold finishes.
 */
const FRAME_MS = 120
const TIME_CELLS = 5

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

/** One row on the page, kept between updates so only changed tiles animate. */
interface RowView {
  city: City
  item: HTMLLIElement
  remove: HTMLButtonElement
  cells: Tile[]
  offset: HTMLSpanElement
  spoken: HTMLSpanElement
  target: string[]
  animation: number
}

export interface BoardViewOptions {
  /** Called with the new list after a city is added or removed (to save it). */
  onChange: (cities: readonly City[]) => void
  /** Called with a short message for screen readers, e.g. "Removed Tokyo." */
  announce: (message: string) => void
}

export interface BoardView {
  /** The board's list of rows, to put on the page. */
  element: HTMLOListElement
  /** The cities currently on the board, top to bottom. */
  cities: () => readonly City[]
  /** Adds a city at the bottom; returns false if it was already there or the board is full. */
  add: (city: City) => boolean
  /** Redraws every row for `now`, animating tiles that change. */
  update: (now: Date) => void
}

/** A group of blank tiles. Hidden from screen readers (they get the text instead). */
function createCells(count: number, className: string): [HTMLSpanElement, Tile[]] {
  const group = document.createElement('span')
  group.className = className
  group.setAttribute('aria-hidden', 'true')
  const cells: Tile[] = []
  for (let i = 0; i < count; i++) {
    const tile = createTile()
    group.append(tile.element)
    cells.push(tile)
  }
  return [group, cells]
}

/** Put characters on the tiles; only tiles whose character changes flip. */
function show(view: RowView, chars: readonly string[], animate: boolean): void {
  chars.forEach((char, index) => {
    setTile(view.cells[index], char, animate)
  })
}

/** Flip a row's tiles from what they show now to `target`. */
function animateTo(view: RowView, target: string[]): void {
  const from = view.target
  view.target = target
  const frames = scrambleLength(from, target)
  const animation = ++view.animation // a newer animation cancels this one

  if (frames === 0 || reduceMotion.matches) {
    show(view, target, false)
    return
  }

  let frame = 0
  let lastFrameTime = -Infinity
  const step = (time: number) => {
    if (animation !== view.animation) {
      return
    }
    if (time - lastFrameTime >= FRAME_MS) {
      lastFrameTime = time
      show(view, scrambleFrame(from, target, frame, Math.random), true)
      frame++
    }
    if (frame < frames) {
      requestAnimationFrame(step)
    } else {
      show(view, target, true)
    }
  }
  requestAnimationFrame(step)
}

function updateView(view: RowView, now: Date): void {
  const row = boardRow(now, view.city)
  view.spoken.textContent = `${row.name}: ${row.time}, ${row.offset}`
  view.offset.textContent = row.offset
  animateTo(view, rowCells(row))
}

/** The split-flap board: one row per city, with × buttons to remove them. */
export function createBoardView(initial: readonly City[], options: BoardViewOptions): BoardView {
  const list = document.createElement('ol')
  list.className = 'rows'
  list.setAttribute('aria-label', 'World clock')

  let cities = initial
  const views: RowView[] = []

  /** The last city can't be removed, so hide its button. */
  function updateRemoveButtons(): void {
    for (const view of views) {
      view.remove.disabled = cities.length <= 1
    }
  }

  function removeRow(view: RowView): void {
    const next = removeCity(cities, view.city)
    if (next === cities) {
      return
    }
    cities = next
    const index = views.indexOf(view)
    views.splice(index, 1)
    view.animation++ // stop any animation still running on this row
    view.item.remove()
    updateRemoveButtons()
    options.onChange(cities)
    options.announce(`Removed ${view.city.name}.`)
    // Keep keyboard focus nearby instead of losing it with the removed button
    const neighbour = views[index] ?? views[index - 1]
    neighbour.remove.focus()
  }

  function createRow(city: City): RowView {
    const item = document.createElement('li')
    item.className = 'row'

    const spoken = document.createElement('span')
    spoken.className = 'sr-only'

    const [timeGroup, timeCells] = createCells(TIME_CELLS, 'time')
    const [nameGroup, nameCells] = createCells(NAME_CELLS, 'name')

    const offset = document.createElement('span')
    offset.className = 'offset'
    offset.setAttribute('aria-hidden', 'true')

    const remove = document.createElement('button')
    remove.type = 'button'
    remove.className = 'remove'
    remove.textContent = '×'
    remove.setAttribute('aria-label', `Remove ${city.name}`)

    item.append(spoken, timeGroup, nameGroup, offset, remove)
    list.append(item)

    const cells = [...timeCells, ...nameCells]
    const view: RowView = {
      city,
      item,
      remove,
      cells,
      offset,
      spoken,
      // '' (not a space) so every tile, blanks included, flips in on the first draw
      target: cells.map(() => ''),
      animation: 0,
    }
    remove.addEventListener('click', () => removeRow(view))
    views.push(view)
    return view
  }

  for (const city of cities) {
    createRow(city)
  }
  updateRemoveButtons()

  return {
    element: list,
    cities: () => cities,
    add(city) {
      const next = addCity(cities, city)
      if (next === cities) {
        return false
      }
      cities = next
      updateView(createRow(city), new Date())
      updateRemoveButtons()
      options.onChange(cities)
      return true
    },
    update(now) {
      for (const view of views) {
        updateView(view, now)
      }
    },
  }
}