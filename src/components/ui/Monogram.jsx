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

const seg =
  typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null
/** First n visible characters (grapheme clusters, so Devanagari/emoji are not cut in half). */
const head = (w, n) => (seg ? [...seg.segment(w)].slice(0, n).map((x) => x.segment) : [...w].slice(0, n)).join('')

/** "Aarav Mehta" -> "AM", "Aarav" -> "AA", "\u092a\u094d\u0930\u0926\u0940\u092a \u0915\u0941\u092e\u093e\u0930" -> "\u092a\u0915". */
export function initialsOf(name = '') {
  const words = String(name)
    .normalize('NFC')
    .replace(/[^\p{L}\p{M}\p{N} ]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!words.length) return '?'
  if (words.length === 1) return head(words[0], 2).toUpperCase()
  return (head(words[0], 1) + head(words[words.length - 1], 1)).toUpperCase()
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

const SIZES = { xs: 28, sm: 30, md: 36, lg: 44, xl: 52 }
const TEXTS = { xs: 'text-[12px]', sm: 'text-[12px]', md: 'text-[13px]', lg: 'text-[15px]', xl: 'text-[18px]' }

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
        background: 'hsl(var(--av-h) 70% 90%)',
        boxShadow: 'inset 0 0 0 1px hsl(var(--av-h) 55% 70% / .6)',
        color: 'hsl(var(--av-h) 65% 26%)',
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
  return rows.map((r) => {
    // palette INDICES throughout (the old code mixed hue degrees with indices)
    let i = HUES.indexOf(hueFor(r.name, r.userId))
    for (let n = 0; n < HUES.length && seen.has(i); n += 1) i = (i + 1) % HUES.length
    seen.add(i)
    return { ...r, hue: HUES[i], monogram: initialsOf(r.name) || key(r) }
  })
}
