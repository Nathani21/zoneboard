/** Links and labels for the top bar. */
const X_PROFILE_URL = 'https://x.com/NoobLabs_21'
const X_HANDLE = '@NoobLabs_21'

const SVG_NS = 'http://www.w3.org/2000/svg'

/** A small line icon drawn from SVG path data (no images, no innerHTML). */
function icon(paths: string[]): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('aria-hidden', 'true')
  for (const d of paths) {
    const path = document.createElementNS(SVG_NS, 'path')
    path.setAttribute('d', d)
    svg.append(path)
  }
  return svg
}

const MENU_ICON = ['M4 7h16', 'M4 12h16', 'M4 17h16']
const ENTER_FULLSCREEN_ICON = ['M4 9V4h5', 'M15 4h5v5', 'M20 15v5h-5', 'M9 20H4v-5']
const EXIT_FULLSCREEN_ICON = ['M9 4v5H4', 'M20 9h-5V4', 'M15 20v-5h5', 'M4 15h5v5']

/** The menu button and the panel it opens. Esc or a click outside closes it. */
function createMenu(items: HTMLElement[]): HTMLDivElement {
  const menu = document.createElement('div')
  menu.className = 'menu'

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'icon-button'
  button.setAttribute('aria-label', 'Menu')
  button.setAttribute('aria-expanded', 'false')
  button.setAttribute('aria-controls', 'menu-panel')
  button.append(icon(MENU_ICON))

  const panel = document.createElement('div')
  panel.id = 'menu-panel'
  panel.className = 'menu-panel'
  panel.hidden = true
  panel.append(...items)

  let open = false

  function setOpen(next: boolean): void {
    open = next
    panel.hidden = !open
    button.setAttribute('aria-expanded', String(open))
  }

  button.addEventListener('click', () => setOpen(!open))

  document.addEventListener('pointerdown', (event) => {
    if (open && !menu.contains(event.target as Node)) {
      setOpen(false)
    }
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && open) {
      setOpen(false)
      button.focus()
    }
  })

  menu.append(button, panel)
  return menu
}

/** Link to the maker's X profile, opening in a new tab. */
function createXLink(): HTMLAnchorElement {
  const link = document.createElement('a')
  link.className = 'icon-button'
  link.href = X_PROFILE_URL
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  link.setAttribute('aria-label', `${X_HANDLE} on X (opens in a new tab)`)
  link.textContent = '𝕏'
  return link
}

/**
 * Fullscreen on and off. Returns null where the browser doesn't allow it
 * (iPhone Safari, for example), so no dead button is shown.
 */
function createFullscreenButton(): HTMLButtonElement | null {
  if (!document.fullscreenEnabled) {
    return null
  }
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'icon-button'

  function update(): void {
    const on = document.fullscreenElement !== null
    button.setAttribute('aria-label', on ? 'Exit full screen' : 'Full screen')
    button.replaceChildren(icon(on ? EXIT_FULLSCREEN_ICON : ENTER_FULLSCREEN_ICON))
  }

  button.addEventListener('click', () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void document.documentElement.requestFullscreen()
    }
  })
  // Also catches leaving full screen with Esc or F11
  document.addEventListener('fullscreenchange', update)
  update()
  return button
}

/** The bar across the top: menu on the left, X and full screen on the right. */
export function createTopBar(menuItems: HTMLElement[]): HTMLElement {
  const bar = document.createElement('header')
  bar.className = 'top-bar'

  const left = document.createElement('div')
  left.className = 'top-bar-group'
  left.append(createMenu(menuItems))

  const right = document.createElement('div')
  right.className = 'top-bar-group'
  right.append(createXLink())
  const fullscreen = createFullscreenButton()
  if (fullscreen) {
    right.append(fullscreen)
  }

  bar.append(left, right)
  return bar
}