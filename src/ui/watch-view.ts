import { CITIES } from '../cities'
import { homeLabel } from '../home'
import { handAngles } from '../watch'
import { formatTime, timeParts } from '../zones'

const SVG_NS = 'http://www.w3.org/2000/svg'
const CENTRE = 100

export interface WatchView {
  /** The clock and its caption, to put on the page. */
  element: HTMLDivElement
  /** Starts the second-by-second ticking (when Watch mode opens). */
  start: () => void
  /** Stops ticking (when another mode opens), so nothing runs in the background. */
  stop: () => void
}

/** An SVG element with attributes. */
function svg<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attributes: Record<string, string | number>,
): SVGElementTagNameMap[K] {
  const element = document.createElementNS(SVG_NS, tag)
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, String(value))
  }
  return element
}

/** A point `radius` from the centre, `degrees` clockwise from 12. */
function polar(radius: number, degrees: number): [number, number] {
  const radians = (degrees * Math.PI) / 180
  return [CENTRE + radius * Math.sin(radians), CENTRE - radius * Math.cos(radians)]
}

/** A hand pointing at 12, from `tail` behind the centre to `length` in front. */
function hand(className: string, length: number, tail: number): SVGLineElement {
  return svg('line', {
    class: className,
    x1: CENTRE,
    y1: CENTRE + tail,
    x2: CENTRE,
    y2: CENTRE - length,
  })
}

/** An analogue clock showing the visitor's own time zone (`home`). */
export function createWatchView(home: string): WatchView {
  const element = document.createElement('div')
  element.className = 'watch'
  element.hidden = true

  const clock = svg('svg', { viewBox: '0 0 200 200', role: 'img' })
  clock.append(svg('circle', { class: 'watch-face', cx: CENTRE, cy: CENTRE, r: 96 }))

  for (let tick = 0; tick < 60; tick++) {
    const major = tick % 5 === 0
    const [x1, y1] = polar(major ? 82 : 87, tick * 6)
    const [x2, y2] = polar(91, tick * 6)
    clock.append(svg('line', { class: major ? 'watch-tick major' : 'watch-tick', x1, y1, x2, y2 }))
  }

  for (const [label, degrees] of [['12', 0], ['3', 90], ['6', 180], ['9', 270]] as const) {
    const [x, y] = polar(64, degrees)
    const numeral = svg('text', { class: 'watch-numeral', x, y })
    numeral.textContent = label
    clock.append(numeral)
  }

  const hourHand = hand('watch-hand hour', 46, 8)
  const minuteHand = hand('watch-hand minute', 70, 10)
  const secondHand = hand('watch-hand second', 80, 18)
  clock.append(
    hourHand,
    minuteHand,
    secondHand,
    svg('circle', { class: 'watch-cap', cx: CENTRE, cy: CENTRE, r: 4 }),
  )

  const caption = document.createElement('p')
  caption.className = 'watch-caption'

  element.append(clock, caption)

  let timer = 0

  function draw(now: Date): void {
    const angles = handAngles(timeParts(now, home))
    hourHand.setAttribute('transform', `rotate(${angles.hour} ${CENTRE} ${CENTRE})`)
    minuteHand.setAttribute('transform', `rotate(${angles.minute} ${CENTRE} ${CENTRE})`)
    secondHand.setAttribute('transform', `rotate(${angles.second} ${CENTRE} ${CENTRE})`)
    const label = homeLabel(now, home, CITIES)
    caption.textContent = label
    clock.setAttribute('aria-label', `Analogue clock: ${formatTime(now, home)} in ${label}`)
  }

  /** Draw now, then again just after the next second starts. */
  function tick(): void {
    const now = new Date()
    draw(now)
    timer = window.setTimeout(tick, 1000 - (now.getTime() % 1000) + 20)
  }

  return {
    element,
    start() {
      window.clearTimeout(timer)
      tick()
    },
    stop() {
      window.clearTimeout(timer)
    },
  }
}