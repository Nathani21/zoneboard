import { CITIES } from '../cities'
import { homeLabel } from '../home'
import { formatDate } from '../zones'
import { icon, SEARCH_ICON } from './icons'
import type { SearchBox } from './search-box'

export interface BottomBar {
  /** The bar, to put on the page. */
  element: HTMLElement
  /** Refreshes the date and the offset on the time zone button. */
  update: (now: Date) => void
  /**
   * Swaps the search box back for the time zone button. With `restoreFocus`
   * (after Esc), keyboard focus goes back to the button instead of being lost.
   */
  closeSearch: (restoreFocus: boolean) => void
}

/**
 * The bar across the bottom: today's date on the left, and in the middle a
 * button showing the visitor's own time zone (`home`, an IANA zone such as
 * "Africa/Lagos") that opens the city search.
 */
export function createBottomBar(search: SearchBox, home: string): BottomBar {

  const bar = document.createElement('footer')
  bar.className = 'bottom-bar'

  const date = document.createElement('p')
  date.className = 'chip date-chip'

  const centre = document.createElement('div')
  centre.className = 'bottom-centre'

  const zoneButton = document.createElement('button')
  zoneButton.type = 'button'
  zoneButton.className = 'chip zone-button'
  const zoneText = document.createElement('span')
  zoneButton.append(icon(SEARCH_ICON), zoneText)

  search.element.hidden = true
  centre.append(search.status, zoneButton, search.element)
  bar.append(date, centre)

  zoneButton.addEventListener('click', () => {
    zoneButton.hidden = true
    search.element.hidden = false
    bar.classList.add('searching')
    search.focus()
  })

  return {
    element: bar,
    update(now) {
      date.textContent = formatDate(now, home)
      const label = homeLabel(now, home, CITIES)
      zoneText.textContent = label
      zoneButton.setAttribute('aria-label', `Your time zone: ${label}. Add a city`)
    },
    closeSearch(restoreFocus) {
      search.element.hidden = true
      zoneButton.hidden = false
      bar.classList.remove('searching')
      if (restoreFocus) {
        zoneButton.focus()
      }
    },
  }
}