import './style.css'
import {
  addCity,
  boardRow,
  DEFAULT_CITIES,
  MAX_ROWS,
  msUntilNextMinute,
  NAME_CELLS,
  rowCells,
  withoutCities,
  type City,
} from './board'
import { CITIES, type Place } from './cities'
import { scrambleFrame, scrambleLength } from './scramble'
import { resultDetail, searchCities } from './search'

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

let cities: readonly City[] = DEFAULT_CITIES
const views = cities.map(createRow)

function updateView(view: RowView, now: Date): void {
  const row = boardRow(now, view.city)
  view.spoken.textContent = `${row.name}: ${row.time}, ${row.offset}`
  view.offset.textContent = row.offset
  animateTo(view, rowCells(row))
}

function update(now: Date): void {
  for (const view of views) {
    updateView(view, now)
  }
}


// ---- Search: type a city, pick a result, and it joins the board ----

const search = document.createElement('div')
search.className = 'search'

const input = document.createElement('input')
input.type = 'search'
input.placeholder = 'Add a city'
input.autocomplete = 'off'
input.spellcheck = false
input.setAttribute('aria-label', 'Add a city')
input.setAttribute('role', 'combobox')
input.setAttribute('aria-autocomplete', 'list')
input.setAttribute('aria-controls', 'search-results')
input.setAttribute('aria-expanded', 'false')

const results = document.createElement('ul')
results.id = 'search-results'
results.className = 'results'
results.setAttribute('role', 'listbox')
results.hidden = true

const status = document.createElement('p')
status.className = 'search-status'
status.setAttribute('aria-live', 'polite')

search.append(input, results, status)
board.append(search)

let matches: Place[] = []
let active = -1

function renderResults(): void {
  const now = new Date()
  results.replaceChildren(
    ...matches.map((place, index) => {
      const option = document.createElement('li')
      option.id = `search-result-${index}`
      option.setAttribute('role', 'option')
      option.setAttribute('aria-selected', String(index === active))

      const name = document.createElement('span')
      name.className = 'result-name'
      name.textContent = place.name

      const detail = document.createElement('span')
      detail.className = 'result-detail'
      detail.textContent = resultDetail(place, now)

      option.append(name, detail)
      // mousedown, not click: keeps focus in the input so the list doesn't close first
      option.addEventListener('mousedown', (event) => {
        event.preventDefault()
        choose(place)
      })
      return option
    }),
  )
  const open = matches.length > 0
  results.hidden = !open
  input.setAttribute('aria-expanded', String(open))
  if (open && active >= 0) {
    input.setAttribute('aria-activedescendant', `search-result-${active}`)
  } else {
    input.removeAttribute('aria-activedescendant')
  }
}

function runSearch(): void {
  const query = input.value
  if (cities.length >= MAX_ROWS) {
    matches = []
    status.textContent = query.trim() ? `The board is full (${MAX_ROWS} cities).` : ''
  } else {
    matches = searchCities(query, withoutCities(CITIES, cities))
    if (!query.trim() || matches.length > 0) {
      status.textContent = ''
    } else if (searchCities(query, CITIES).length > 0) {
      status.textContent = 'Already on the board.'
    } else {
      status.textContent = 'No matching city.'
    }
  }
  active = matches.length > 0 ? 0 : -1
  renderResults()
}

function closeResults(): void {
  matches = []
  active = -1
  renderResults()
}

function choose(place: Place): void {
  const next = addCity(cities, place)
  if (next === cities) {
    return
  }
  cities = next
  const view = createRow(place)
  views.push(view)
  updateView(view, new Date())
  input.value = ''
  closeResults()
  status.textContent = `Added ${place.name}.`
}

input.addEventListener('input', runSearch)
input.addEventListener('focus', runSearch)
input.addEventListener('blur', closeResults)
input.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    if (matches.length === 0) {
      return
    }
    event.preventDefault()
    const step = event.key === 'ArrowDown' ? 1 : -1
    active = (active + step + matches.length) % matches.length
    renderResults()
  } else if (event.key === 'Enter' && active >= 0) {
    event.preventDefault()
    choose(matches[active])
  } else if (event.key === 'Escape') {
    input.value = ''
    status.textContent = ''
    closeResults()
  }
})

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