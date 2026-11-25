import './style.css'
import { DEFAULT_CITIES, msUntilNextMinute } from './board'
import { parseSavedCities, serializeCities, STORAGE_KEY } from './storage'
import { createBoardView } from './ui/board-view'
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
})

const main = document.createElement('main')
main.className = 'board'
main.append(board.element, search.element)

app.replaceChildren(createTopBar(createMenuItems()), main)

/** Update now, then again just after each minute changes. */
function tick(): void {
  const now = new Date()
  board.update(now)
  // +50 ms so the timer lands just after the minute ticks over, not just before
  window.setTimeout(tick, msUntilNextMinute(now) + 50)
}

// Background tabs pause timers, so catch up as soon as the tab is visible again
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    board.update(new Date())
  }
})

tick()