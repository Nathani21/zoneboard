import { MODE_LABELS, MODES, type Mode } from '../modes'

export interface ModeTabs {
  /** The tabs, to put in the top bar. */
  element: HTMLElement
  /** Marks `mode` as the current tab. */
  update: (mode: Mode) => void
}

/**
 * Links to each mode ("#world", "#watch"). They're ordinary links, so the
 * Back button and shared URLs work; main.ts listens for the hash to change.
 */
export function createModeTabs(): ModeTabs {
  const nav = document.createElement('nav')
  nav.className = 'mode-tabs'
  nav.setAttribute('aria-label', 'Modes')

  const links = MODES.map((mode) => {
    const link = document.createElement('a')
    link.href = `#${mode}`
    link.textContent = MODE_LABELS[mode]
    nav.append(link)
    return link
  })

  return {
    element: nav,
    update(mode) {
      MODES.forEach((option, index) => {
        if (option === mode) {
          links[index].setAttribute('aria-current', 'page')
        } else {
          links[index].removeAttribute('aria-current')
        }
      })
    },
  }
}