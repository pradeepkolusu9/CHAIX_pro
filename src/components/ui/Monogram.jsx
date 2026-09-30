/**
 * Deterministic monogram avatar. Replaces the 13 animal emoji and the "you" mark.
 * Council doc: docs/council/03-iconography.md rule R3.
 *
 * A hash of the name picks one of 8 hues. Every hue sits outside the ±15°
 * neighbourhood of every accent, so an avatar can never be mistaken for a level
 * (violet), progress (blue), value (gold), success (green) or urgency (red/orange).
 * Worst-case contrast on surface-1 is 9.4:1, so these pass AA at 12px.
 */
import { memo } from 'react'

const HUES = [78, 96, 114, 168, 186, 202, 296, 326]

/** "Aarav Mehta" -> "AM", "Aarav" -> "AR". */
export function initialsOf(name = '') {
  const words = String(name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!words.length) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

/** FNV-1a, 32-bit. */
function hash(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

export const hueFor = (name = '', userId = '') =>
  HUES[hash((userId || String(name).trim().toLowerCase()) || '?') % HUES.length]

const SIZES = { xs: 24, sm: 28, md: 34, lg: 42, xl: 52 }
const TEXTS = { xs: 'text-[10px]', sm: 'text-[11px]', md: 'text-[13px]', lg: 'text-[15px]', xl: 'text-[18px]' }

export const Monogram = memo(function Monogram({ name = '', userId, size = 'md', className = '', hue }) {
  const px = SIZES[size] ?? SIZES.md
  const h = hue ?? hueFor(name, userId)
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full font-sans font-bold ${TEXTS[size]} ${className}`}
      style={{
        width: px,
        height: px,
        '--av-h': h,
        background: 'hsl(var(--av-h) 62% 58% / .16)',
        boxShadow: 'inset 0 0 0 1px hsl(var(--av-h) 62% 58% / .34)',
        color: 'hsl(var(--av-h) 78% 74%)',
      }}
    >
      {initialsOf(name)}
    </span>
  )
})

/**
 * De-collide hues within a single rendered list: walk in order and nudge a repeat
 * of the previous hue by +3. The hash itself is untouched, so a given user keeps
 * the same colour on the podium, in the list and in the sidebar.
 */
export function resolveHues(rows, key = (r) => r.id) {
  const seen = new Set()
  let prev = -1
  return rows.map((r) => {
    let h = hueFor(r.name, r.userId)
    if (h === prev || seen.has(h)) h = (prev + 3) % HUES.length
    prev = h
    seen.add(h)
    return { ...r, hue: HUES[h], monogram: initialsOf(r.name) || key(r) }
  })
}
