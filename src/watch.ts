import type { TimeParts } from './zones'

/** Where each hand of an analogue clock points, in degrees clockwise from 12. */
export interface HandAngles {
  hour: number
  minute: number
  second: number
}

/**
 * Hand angles for a clock reading. The hour hand moves on through the hour and
 * the minute hand through the minute; the second hand jumps once a second.
 */
export function handAngles({ hours, minutes, seconds }: TimeParts): HandAngles {
  return {
    hour: (hours % 12) * 30 + minutes * 0.5 + seconds / 120,
    minute: minutes * 6 + seconds * 0.1,
    second: seconds * 6,
  }
}


/** The centre of the clock face, in the SVG's 200 × 200 coordinate space. */
export const CLOCK_CENTRE = 100

/**
 * The point `radius` from the centre at `degrees` clockwise from 12, as [x, y].
 * SVG's y axis points down, so 12 o'clock is above the centre (smaller y).
 */
export function polar(radius: number, degrees: number): [number, number] {
  const radians = (degrees * Math.PI) / 180
  return [CLOCK_CENTRE + radius * Math.sin(radians), CLOCK_CENTRE - radius * Math.cos(radians)]
}