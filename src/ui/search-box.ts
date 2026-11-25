import { MAX_ROWS, type City } from '../board'
import { CITIES, type Place } from '../cities'
import { findCitiesToAdd, resultDetail, type SearchOutcome } from '../search'

/** What the status line under the box says for each search outcome. */
const MESSAGES: Record<SearchOutcome, string> = {
  empty: '',
  results: '',
  full: `The board is full (${MAX_ROWS} cities).`,
  'on-board': 'Already on the board.',
  'no-match': 'No matching city.',
}

export interface SearchBoxOptions {
  /** The cities currently on the board (they're left out of the results). */
  cities: () => readonly City[]
  /** Adds the chosen place; returns false if it couldn't be added. */
  onChoose: (place: Place) => boolean
}

export interface SearchBox {
  /** The search box, results list and status line, to put on the page. */
  element: HTMLDivElement
  /** Shows a short message under the box, also read out by screen readers. */
  announce: (message: string) => void
}

/** "Add a city": type, pick a result, and it joins the board. */
export function createSearchBox(options: SearchBoxOptions): SearchBox {
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
    const result = findCitiesToAdd(input.value, CITIES, options.cities())
    matches = result.matches
    status.textContent = MESSAGES[result.outcome]
    active = matches.length > 0 ? 0 : -1
    renderResults()
  }

  function closeResults(): void {
    matches = []
    active = -1
    renderResults()
  }

  function choose(place: Place): void {
    if (!options.onChoose(place)) {
      return
    }
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

  return {
    element: search,
    announce(message) {
      status.textContent = message
    },
  }
}