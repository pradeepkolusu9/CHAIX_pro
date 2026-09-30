/**
 * A 60-second ring is a *timer*, not a progress bar.
 *
 * It was drawn as a full circle that unwound from 12 o'clock, so at 45 seconds
 * left it read as "50% done" — the exact inverse of the truth, on the one
 * screen where a misread costs the player their run. A clock is right, so the
 * ring is now right, and the remaining arc is drawn from the top.
 *
 * No dependency: the math is here, and it is tested.
 */

/** Sweep angle (deg, 0 = 12 o'clock, clockwise) for `secondsLeft` out of `total`. */
export function clockSweep(secondsLeft, total) {
  if (!total) return 0
  const clamped = Math.max(0, Math.min(total, secondsLeft))
  return (clamped / total) * 360
}

/**
 * SVG arc path for a ring segment, starting at 12 o'clock and sweeping clockwise.
 * `r` is the ring radius, already inset by half the stroke width (see
 * `ringGeometry`) so the stroke stays inside the viewBox at any size.
 */
export function ringArc({ r, sweepDeg }) {
  const sweep = Math.max(0, Math.min(359.999, sweepDeg))
  // A full circle cannot be drawn as one arc — split it just short of 360 and let
  // the round caps close the gap, so `sweep = 360` still renders.
  const a = sweep >= 359.99 ? 359.99 : sweep
  const rad = (deg) => (deg * Math.PI) / 180
  const x0 = r
  const y0 = 0
  const x1 = r * Math.cos(rad(a))
  const y1 = r * Math.sin(rad(a))
  const large = a > 180 ? 1 : 0
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(3)} ${y1.toFixed(3)}`
}

/** Geometry for a ring that fits a `size`px box without clipping its stroke. */
export function ringGeometry(size, sw = 6) {
  const r = (size - sw) / 2
  const c = size / 2
  return { r, c, sw }
}

/**
 * Urgency colour. Deliberately keyed to seconds-left, not to elapsed fraction,
 * and returned as a token name so the app never hardcodes a hex here.
 * Colour is never the only signal — the digits and the label carry it too.
 */
export function timerTone(secondsLeft) {
  if (secondsLeft <= 10) return 'danger'
  if (secondsLeft <= 20) return 'warn'
  return 'good'
}

export const TONE_TOKEN = {
  good: 'text-good',
  warn: 'text-warn',
  danger: 'text-danger',
}

export const formatClock = (secondsLeft) => {
  const s = Math.max(0, Math.ceil(secondsLeft))
  return `00:${String(s).padStart(2, '0')}`
}
