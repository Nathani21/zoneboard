import './style.css'
import {
  addCity,
  boardRow,
  DEFAULT_CITIES,
  MAX_ROWS,
  msUntilNextMinute,
  NAME_CELLS,
  removeCity,
  rowCells,
  withoutCities,
  type City,
} from './board'
import { CITIES, type Place } from './cities'
import { scrambleFrame, scrambleLength } from './scramble'
import { resultDetail, searchCities } from './search'
import {
  parseSavedCities,
  parseTheme,
  serializeCities,
  STORAGE_KEY,
  THEME_KEY,
  THEMES,
  type Theme,
} from './storage'

/** How long each scramble frame stays on screen. */
const FRAME_MS = 50
const TIME_CELLS = 5

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

/** One row on the page, kept between updates so only changed tiles animate. */
interface RowView {
  city: City
  item: HTMLLIElement
  remove: HTMLButtonElement
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
    target: cells.map(() => ' '),
    animation: 0,
  }
  remove.addEventListener('click', () => removeRow(view))
  return view
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

/** The visitor's saved cities, or the defaults. Storage can be blocked, so failures fall back. */
function loadCities(): readonly City[] {
  try {
    return parseSavedCities(localStorage.getItem(STORAGE_KEY)) ?? DEFAULT_CITIES
  } catch {
    return DEFAULT_CITIES
  }
}

function saveCities(): void {
  try {
    localStorage.setItem(STORAGE_KEY, serializeCities(cities))
  } catch {
    // Storage blocked (some private modes or settings): the board still works, it just isn't remembered
  }
}

let cities: readonly City[] = loadCities()
const views = cities.map(createRow)

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
  saveCities()
  updateRemoveButtons()
  status.textContent = `Removed ${view.city.name}.`
  // Keep keyboard focus nearby instead of losing it with the removed button
  const neighbour = views[index] ?? views[index - 1]
  neighbour.remove.focus()
}

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
  saveCities()
  updateRemoveButtons()
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

// ---- Theme: System / Light / Dark ----

const THEME_LABELS: Record<Theme, string> = { system: 'System', light: 'Light', dark: 'Dark' }

/** 'system' removes the override, so the page follows the operating system again. */
function applyTheme(theme: Theme): void {
  if (theme === 'system') {
    delete document.documentElement.dataset.theme
  } else {
    document.documentElement.dataset.theme = theme
  }
}

function loadTheme(): Theme {
  try {
    return parseTheme(localStorage.getItem(THEME_KEY))
  } catch {
    return 'system'
  }
}

function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // Storage blocked: the theme still changes, it just isn't remembered
  }
}

let theme = loadTheme()

const themeSwitch = document.createElement('div')
themeSwitch.className = 'theme-switch'
themeSwitch.setAttribute('role', 'group')
themeSwitch.setAttribute('aria-label', 'Theme')

const themeButtons = THEMES.map((option) => {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = THEME_LABELS[option]
  button.addEventListener('click', () => {
    theme = option
    applyTheme(theme)
    saveTheme(theme)
    updateThemeButtons()
  })
  themeSwitch.append(button)
  return button
})

function updateThemeButtons(): void {
  THEMES.forEach((option, index) => {
    themeButtons[index].setAttribute('aria-pressed', String(option === theme))
  })
}

document.querySelector('.site-footer')?.prepend(themeSwitch)
applyTheme(theme)
updateThemeButtons()

updateRemoveButtons()
tick()