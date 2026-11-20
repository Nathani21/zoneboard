import './style.css'
import { boardRow, DEFAULT_CITIES, msUntilNextMinute, type BoardRow } from './board'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) {
  throw new Error('zoneboard: missing #app element in index.html')
}

const board = document.createElement('main')
board.className = 'board'
app.replaceChildren(board)

/** A row of tiles, one per character. Hidden from screen readers (they get the text instead). */
function renderCells(cells: string[], className: string): HTMLElement {
  const group = document.createElement('span')
  group.className = className
  group.setAttribute('aria-hidden', 'true')
  for (const char of cells) {
    const cell = document.createElement('span')
    cell.className = 'cell'
    cell.textContent = char
    group.append(cell)
  }
  return group
}

function renderRow(row: BoardRow): HTMLElement {
  const item = document.createElement('li')
  item.className = 'row'

  const spoken = document.createElement('span')
  spoken.className = 'sr-only'
  spoken.textContent = `${row.name}: ${row.time}, ${row.offset}`

  const offset = document.createElement('span')
  offset.className = 'offset'
  offset.setAttribute('aria-hidden', 'true')
  offset.textContent = row.offset

  item.append(
    spoken,
    renderCells(Array.from(row.time), 'time'),
    renderCells(row.nameCells, 'name'),
    offset,
  )
  return item
}

function render(now: Date): void {
  const list = document.createElement('ol')
  list.className = 'rows'
  list.setAttribute('aria-label', 'World clock')
  for (const city of DEFAULT_CITIES) {
    list.append(renderRow(boardRow(now, city)))
  }
  board.replaceChildren(list)
}

/** Draw now, then again just after each minute changes. */
function tick(): void {
  const now = new Date()
  render(now)
  // +50 ms so the timer lands just after the minute ticks over, not just before
  window.setTimeout(tick, msUntilNextMinute(now) + 50)
}

// Background tabs pause timers, so redraw as soon as the tab is visible again
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    render(new Date())
  }
})

tick()