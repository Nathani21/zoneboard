const SVG_NS = 'http://www.w3.org/2000/svg'

/** A small line icon drawn from SVG path data (no images, no innerHTML). */
export function icon(paths: string[]): SVGSVGElement {
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

export const MENU_ICON = ['M4 7h16', 'M4 12h16', 'M4 17h16']
export const ENTER_FULLSCREEN_ICON = ['M4 9V4h5', 'M15 4h5v5', 'M20 15v5h-5', 'M9 20H4v-5']
export const EXIT_FULLSCREEN_ICON = ['M9 4v5H4', 'M20 9h-5V4', 'M15 20v-5h5', 'M4 15h5v5']
export const SEARCH_ICON = ['M10.5 4a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13', 'M15.5 15.5L20 20']