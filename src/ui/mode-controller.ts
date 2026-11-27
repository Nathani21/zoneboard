import { MODES, type Mode } from '../modes'
import type { ModeTabs } from './mode-tabs'

/** One mode's screen. `start` and `stop` let it run timers only while it's open. */
export interface ModeScreen {
  element: HTMLElement
  start?: () => void
  stop?: () => void
}

export interface ModeController {
  /** Opens `mode`'s screen and closes the others. */
  show: (mode: Mode) => void
}

/**
 * Keeps the screens, the tabs and the page's data-mode in step. Every mode
 * must have a screen (the Record type makes the build fail otherwise).
 */
export function createModeController(
  screens: Record<Mode, ModeScreen>,
  tabs: ModeTabs,
  onChange: () => void,
): ModeController {
  return {
    show(mode) {
      document.documentElement.dataset.mode = mode
      for (const option of MODES) {
        const screen = screens[option]
        screen.element.hidden = option !== mode
        if (option === mode) {
          screen.start?.()
        } else {
          screen.stop?.()
        }
      }
      tabs.update(mode)
      onChange()
    },
  }
}