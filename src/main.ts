import './style.css'
import { DEFAULT_CITIES, msUntilNextMinute } from './board'
import { resolveHomeTimeZone } from './home'
import { parseSavedCities, serializeCities, STORAGE_KEY } from './storage'
import { createBoardView } from './ui/board-view'
import { createBottomBar } from './ui/bottom-bar'
import { readStorage, writeStorage } from './ui/local-storage'
import { createMenuItems } from './ui/menu-items'
import { createSearchBox } from './ui/search-box'
import { createTopBar } from './ui/top-bar'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) {
  throw new Error('zoneboard: missing #app element in index.html')
}

const board = createBoardView(parseSavedCities(readStorage(STORAGE_KEY)) ?? DEFAULT_CITIES, {
  onChange: (cities) => writeStorage(STORAGE_KEY, serializeCities(cities)),
  announce: (message) => search.announce(message),
})

const search = createSearchBox({
  cities: board.cities,
  onChoose: (place) => board.add(place),
  onClose: (reason) => bottomBar.closeSearch(reason === 'escape'),
})

// The visitor's own time zone, e.g. "Africa/Lagos"
const homeTimeZone = resolveHomeTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
const bottomBar = createBottomBar(search, homeTimeZone)

const main = document.createElement('main')
main.className = 'board'
main.append(board.element)

app.replaceChildren(createTopBar(createMenuItems()), main, bottomBar.element)

/** Update now, then again just after each minute changes. */
function tick(): void {
  const now = new Date()
  board.update(now)
  bottomBar.update(now)
  // +50 ms so the timer lands just after the minute ticks over, not just before
  window.setTimeout(tick, msUntilNextMinute(now) + 50)
}

// Background tabs pause timers, so catch up as soon as the tab is visible again
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    const now = new Date()
    board.update(now)
    bottomBar.update(now)
  }
})

tick()