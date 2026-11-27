import { parseQuoteIndex, pickQuoteIndex, QUOTE_KEY, QUOTES } from '../quotes'
import {
  elapsedMs,
  formatElapsed,
  isRunning,
  NEW_STOPWATCH,
  pause,
  start,
  type Stopwatch,
} from '../stopwatch'
import { readStorage, writeStorage } from './local-storage'

/** How often the display refreshes while the stopwatch runs. */
const REFRESH_MS = 200

export interface FocusView {
  /** The stopwatch, its buttons and the quote, to put on the page. */
  element: HTMLDivElement
  /** Starts refreshing the display (when Focus mode opens). */
  start: () => void
  /** Stops refreshing (when another mode opens). The stopwatch keeps timing. */
  stop: () => void
}

/** A quote that's different from the one shown on the last visit. */
function createQuote(): HTMLElement {
  const previous = parseQuoteIndex(readStorage(QUOTE_KEY), QUOTES.length)
  const index = pickQuoteIndex(QUOTES.length, Math.random, previous)
  writeStorage(QUOTE_KEY, String(index))

  const figure = document.createElement('figure')
  figure.className = 'focus-quote'
  const text = document.createElement('blockquote')
  text.textContent = QUOTES[index].text
  const author = document.createElement('figcaption')
  author.textContent = `— ${QUOTES[index].author}`
  figure.append(text, author)
  return figure
}

/** Focus mode: a stopwatch on split-flap tiles, with a quote underneath. */
export function createFocusView(): FocusView {
  const element = document.createElement('div')
  element.className = 'focus'
  element.hidden = true

  // role="timer" tells screen readers this is a changing time; they read it on request
  const display = document.createElement('div')
  display.className = 'focus-time'
  display.setAttribute('role', 'timer')
  display.setAttribute('aria-label', 'Stopwatch')

  const tiles = document.createElement('span')
  tiles.className = 'time'
  tiles.setAttribute('aria-hidden', 'true')
  const cells = Array.from(formatElapsed(0), () => {
    const cell = document.createElement('span')
    cell.className = 'cell'
    tiles.append(cell)
    return cell
  })

  const spoken = document.createElement('span')
  spoken.className = 'sr-only'
  display.append(tiles, spoken)

  const controls = document.createElement('div')
  controls.className = 'focus-controls'
  const startButton = document.createElement('button')
  startButton.type = 'button'
  startButton.className = 'chip focus-button primary'
  const resetButton = document.createElement('button')
  resetButton.type = 'button'
  resetButton.className = 'chip focus-button'
  resetButton.textContent = 'Reset'
  controls.append(startButton, resetButton)

  element.append(display, controls, createQuote())

  let stopwatch: Stopwatch = NEW_STOPWATCH
  let timer = 0
  let visible = false

  function render(): void {
    const now = performance.now()
    const text = formatElapsed(elapsedMs(stopwatch, now))
    Array.from(text).forEach((char, index) => {
      if (cells[index].textContent !== char) {
        cells[index].textContent = char
      }
    })
    spoken.textContent = text
    const running = isRunning(stopwatch)
    startButton.textContent = running ? 'Pause' : elapsedMs(stopwatch, now) > 0 ? 'Resume' : 'Start'
    resetButton.disabled = !running && elapsedMs(stopwatch, now) === 0
  }

  /** Refresh while the stopwatch runs and Focus is on screen; otherwise rest. */
  function schedule(): void {
    window.clearTimeout(timer)
    if (visible && isRunning(stopwatch)) {
      timer = window.setTimeout(() => {
        render()
        schedule()
      }, REFRESH_MS)
    }
  }

  startButton.addEventListener('click', () => {
    const now = performance.now()
    stopwatch = isRunning(stopwatch) ? pause(stopwatch, now) : start(stopwatch, now)
    render()
    schedule()
  })

  resetButton.addEventListener('click', () => {
    stopwatch = NEW_STOPWATCH
    render()
    schedule()
    startButton.focus()
  })

  render()

  return {
    element,
    start() {
      visible = true
      render()
      schedule()
    },
    stop() {
      visible = false
      window.clearTimeout(timer)
    },
  }
}