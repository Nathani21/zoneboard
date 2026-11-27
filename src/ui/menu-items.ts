import { createThemeSwitch } from './theme-switch'
import { X_HANDLE, X_PROFILE_URL } from './top-bar'

/**
 * What the ☰ menu holds: the theme switch, the privacy note and a link to the
 * maker on X (the top bar's 𝕏 button is hidden on narrow screens).
 */
export function createMenuItems(): HTMLElement[] {
  const themeLabel = document.createElement('p')
  themeLabel.className = 'menu-label'
  themeLabel.textContent = 'Theme'

  const privacyNote = document.createElement('p')
  privacyNote.className = 'privacy-note'
  privacyNote.textContent =
    'Your city list is saved only in this browser. It is never sent to a server.'

  const xLink = document.createElement('a')
  xLink.className = 'menu-link'
  xLink.href = X_PROFILE_URL
  xLink.target = '_blank'
  xLink.rel = 'noopener noreferrer'
  xLink.textContent = `Made by ${X_HANDLE} on 𝕏`

  return [themeLabel, createThemeSwitch(), privacyNote, xLink]
}