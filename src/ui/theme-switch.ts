import { parseTheme, THEME_KEY, THEMES, type Theme } from '../storage'
import { readStorage, writeStorage } from './local-storage'

const THEME_LABELS: Record<Theme, string> = { system: 'System', light: 'Light', dark: 'Dark' }

/** 'system' removes the override, so the page follows the operating system again. */
function applyTheme(theme: Theme): void {
  if (theme === 'system') {
    delete document.documentElement.dataset.theme
  } else {
    document.documentElement.dataset.theme = theme
  }
}

/**
 * The System / Light / Dark switch. Applies the saved theme straight away and
 * saves every change.
 */
export function createThemeSwitch(): HTMLDivElement {
  let theme = parseTheme(readStorage(THEME_KEY))

  const themeSwitch = document.createElement('div')
  themeSwitch.className = 'theme-switch'
  themeSwitch.setAttribute('role', 'group')
  themeSwitch.setAttribute('aria-label', 'Theme')

  const buttons = THEMES.map((option) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = THEME_LABELS[option]
    button.addEventListener('click', () => {
      theme = option
      applyTheme(theme)
      writeStorage(THEME_KEY, theme)
      updateButtons()
    })
    themeSwitch.append(button)
    return button
  })

  function updateButtons(): void {
    THEMES.forEach((option, index) => {
      buttons[index].setAttribute('aria-pressed', String(option === theme))
    })
  }

  applyTheme(theme)
  updateButtons()
  return themeSwitch
}