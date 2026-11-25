import { createThemeSwitch } from './theme-switch'

/** What the ☰ menu holds: the theme switch and the privacy note. */
export function createMenuItems(): HTMLElement[] {
  const themeLabel = document.createElement('p')
  themeLabel.className = 'menu-label'
  themeLabel.textContent = 'Theme'

  const privacyNote = document.createElement('p')
  privacyNote.className = 'privacy-note'
  privacyNote.textContent =
    'Your city list is saved only in this browser. It is never sent to a server.'

  return [themeLabel, createThemeSwitch(), privacyNote]
}