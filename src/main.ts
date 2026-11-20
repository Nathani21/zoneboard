import './style.css'
import {
  boardRow,
  DEFAULT_CITIES,
  msUntilNextMinute,
  NAME_CELLS,
  rowCells,
  type City,
} from './board'
import { scrambleFrame, scrambleLength } from './scramble'

/** How long each scramble frame stays on screen. */
const FRAME_MS = 50
const TIME_CELLS = 5

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

/** One row on the page, kept between updates so only changed tiles animate. */
interface RowView {
  city: City
  cells: HTMLSpanElement[]
  offset: HTMLSpanElement
  spoken: HTMLSpanElement
  target: string[]
  animation: number
}

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) {
  throw new Error('zoneboard: missing #app element in index.html')
}

const board = document.createElement('main')
board.className = 'board'
const list = document.createElement('ol')
list.className = 'rows'
list.setAttribute('aria-label', 'World clock')
board.append(list)
app.replaceChildren(board)

/** A group of blank tiles. Hidden from screen readers (they get the text instead). */
function createCells(count: number, className: string): [HTMLSpanElement, HTMLSpanElement[]] {
  const group = document.createElement('span')
  group.className = className
  group.setAttribute('aria-hidden', 'true')
  const cells: HTMLSpanElement[] = []
  for (let i = 0; i < count; i++) {
    const cell = document.createElement('span')
    cell.className = 'cell'
    cell.textContent = ' '
    group.append(cell)
    cells.push(cell)
  }
  return [group, cells]
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

  item.append(spoken, timeGroup, nameGroup, offset)
  list.append(item)

  const cells = [...timeCells, ...nameCells]
  return { city, cells, offset, spoken, target: cells.map(() => ' '), animation: 0 }
}

/** Put characters on the tiles, touching only tiles that change. */
function show(view: RowView, chars: readonly string[]): void {
  chars.forEach((char, index) => {
    const cell = view.cells[index]
    if (cell.textContent !== char) {
      cell.textContent = char
    }
  })
}

/** Flip a row's tiles from what they show now to `target`. */
function animateTo(view: RowView, target: string[]): void {
  const from = view.target
  view.target = target
  const frames = scrambleLength(from, target)
  const animation = ++view.animation // a newer animation cancels this one

  if (frames === 0 || reduceMotion.matches) {
    show(view, target)
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
      show(view, scrambleFrame(from, target, frame, Math.random))
      frame++
    }
    if (frame < frames) {
      requestAnimationFrame(step)
    } else {
      show(view, target)
    }
  }
  requestAnimationFrame(step)
}

const views = DEFAULT_CITIES.map(createRow)

function update(now: Date): void {
  for (const view of views) {
    const row = boardRow(now, view.city)
    view.spoken.textContent = `${row.name}: ${row.time}, ${row.offset}`
    view.offset.textContent = row.offset
    animateTo(view, rowCells(row))
  }
}

/** Update now, then again just after each minute changes. */
function tick(): void {
  const now = new Date()
  update(now)
  // +50 ms so the timer lands just after the minute ticks over, not just before
  window.setTimeout(tick, msUntilNextMinute(now) + 50)
}

// Background tabs pause timers, so catch up as soon as the tab is visible again
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    update(new Date())
  }
})

tick()