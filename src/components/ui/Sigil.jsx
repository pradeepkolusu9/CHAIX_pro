/**
 * LawLink Sigil — the domain-identity mark set.
 * Council doc: docs/council/03-iconography.md
 *
 * Rules enforced here, not left to callers:
 *   - 24x24, fill none, stroke currentColor, stroke-width 1.75 (1.6 under 16px)
 *   - round caps + joins only; path data only
 *   - colour comes only from the parent, via className
 *   - badge ids that certify a module alias straight to that module's mark
 *
 * Two systems, never mixed: lucide (stroke 2.2) for actions and state, Sigils
 * (stroke 1.75) for domain identity only — modules, badges, level.
 */
import { memo } from 'react'

/** 8 topic marks. Carrier silhouette alternates so a row of eight never reads as one shape. */
const MARKS = {
  // nested identity arcs — phishing, impersonation, biometrics
  cybercrime: ['M4.2 17.5A9 9 0 1 1 20.7 10.7', 'M6 13A6 6 0 0 1 18 13', 'M9 13A3 3 0 0 1 15 13'],
  // receipt with a torn bottom edge — bills, refunds, hidden fees
  consumer: [
    'M5 4H19V20L16.75 18.4 14.5 20 12.25 18.4 10 20 7.75 18.4 5 20V4Z',
    'M8.2 9h6.6',
    'M8.2 13h4',
  ],
  // Carriageway receding to a vanishing point. Deliberately built from OPEN
  // strokes, not a closed triangle: a closed triangle is the exact silhouette of
  // lucide's TriangleAlert, so it read as "warning / do not enter" next to a
  // locked-module chip. Open rails + a broken centre line read as road.
  road: [
    'M4.8 20.6 9.4 5.4',
    'M19.2 20.6 14.6 5.4',
    'M12 12.6v2.8',
    'M12 17.4v1.6',
  ],
  // mortarboard: wide diamond over the cap
  student: [
    'M3 9 12 4.6 21 9l-9 4.4L3 9Z',
    'M7 11.2v4.4c0 1.3 2.2 2.4 5 2.4s5-1.1 5-2.4v-4.4',
    'M20.4 9.6v4.6',
  ],
  // banded case — contract, hours, provident fund
  workplace: [
    'M3.6 8.4h16.8v12.2H3.6z',
    'M8.8 8.4V6.2a2.2 2.2 0 0 1 2.2-2.2h2a2.2 2.2 0 0 1 2.2 2.2v2.2',
    'M3.6 13.4h16.8',
  ],
  // an eye you are inside of — Aadhaar asks, face scraping, data breaches
  privacy: [
    'M3.4 12S6.6 5.2 12 5.2 20.6 12 20.6 12 17.4 18.8 12 18.8 3.4 12 3.4 12Z',
    'M14.6 12a2.6 2.6 0 1 1-5.2 0 2.6 2.6 0 0 1 5.2 0Z',
  ],
  // a canopy over a figure — shelter. The one mark that depicts a person.
  safety: [
    'M3.6 11.4 12 4.2l8.4 7.2',
    'M12 10.4a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4Z',
    'M8.6 20.6v-2.8a3.4 3.4 0 0 1 6.8 0v2.8',
  ],
  // the scales — Article 32, equality, the right to a remedy
  fundamental: [
    'M12 4.6v15.8',
    'M6.6 7h10.8M8.4 20.4h7.2',
    'M3.4 14a3.1 3.1 0 0 0 6.2 0L6.6 7 3.4 14Z',
    'M14.4 14a3.1 3.1 0 0 0 6.2 0L17.4 7 14.4 14Z',
  ],

  // ---- the six badges that are not module certifications ----
  // a footprint: the first step
  'first-step': [
    'M8.6 11.4c2.6 0 4 2.6 4 5.4 0 1.9-.8 2.8-2.4 2.8-1.9 0-3.1-1.1-3.1-3.1 0-2.6.6-5.1 1.5-5.1Z',
    'M12.8 5.6a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6Z',
    'M16.2 8.6a1.05 1.05 0 1 1 0 2.1 1.05 1.05 0 0 1 0-2.1Z',
    'M18.6 12a.95.95 0 1 1 0 1.9.95.95 0 1 1 0-1.9Z',
  ],
  // a four-ray spark: the insight
  'quick-learner': ['M12 3.6v3.4M12 17v3.4M3.6 12H7M17 12h3.4', 'M12 9.4a2.6 2.6 0 1 1 0 5.2 2.6 2.6 0 0 1 0-5.2Z'],
  // three day-cells climbing: seven days in a row. Deliberately not a flame.
  'streak-master': ['M4.2 15.8h5v5h-5z', 'M9.5 10.5h5v5h-5z', 'M14.8 5.2h5v5h-5z'],
  // a stopwatch: cleared in 60 seconds
  'first-blood': [
    'M19.4 13.6a7.4 7.4 0 0 1-14.8 0 7.4 7.4 0 0 1 14.8 0Z',
    'M12 13.6V9.6',
    'M9.2 4.4h5.6M12 6.2V4.4',
  ],
  // a ring and a check: 10/10
  'perfect-ten': ['M12 3.4a8.6 8.6 0 1 1 0 17.2 8.6 8.6 0 0 1 0-17.2Z', 'm8.2 12.2 2.7 2.7 5-5.4'],
  // an eight-lobed rosette: one lobe per module
  'legal-legend': [
    'M12 4.2 13.91 7.98 17.94 6.66 16.62 10.69 20.4 12.6 16.62 14.51 17.94 18.54 13.91 17.22 12 21 10.09 17.22 6.06 18.54 7.38 14.51 3.6 12.6 7.38 10.69 6.06 6.66 10.09 7.98Z',
    'M12 10.4a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4Z',
  ],

  // ---- UI frame ----
  // the LevelSeal mark (a shape, not an emoji)
  'level-seal': ['M12 3l7.79 4.5v9L12 21l-7.79-4.5v-9L12 3Z'],
}

/** Badge id -> the mark it certifies. Six badges are a module certification. */
const ALIAS = {
  'cyber-defender': 'cybercrime',
  'smart-consumer': 'consumer',
  'road-warrior': 'road',
  'campus-guardian': 'student',
  'workplace-rights': 'workplace',
  'rights-protector': 'safety',
}

// Resolve aliases once, by reference. MARKS['cyber-defender'] IS MARKS['cybercrime'].
for (const k of Object.keys(ALIAS)) MARKS[k] = MARKS[ALIAS[k]]

export const SIGIL_IDS = Object.keys(MARKS)
export const hasSigil = (id) => Boolean(MARKS[id])

const SIZES = { xs: 14, sm: 18, md: 22, lg: 28, xl: 30, '2xl': 40 }

export const Sigil = memo(function Sigil({ id, size = 'sm', className = '', title }) {
  const d = MARKS[id]
  if (!d) {
    // Loud in dev, invisible in prod. A missing mark must never blank a card.
    if (import.meta.env?.DEV) console.warn(`[Sigil] unknown id "${id}"`)
    return null
  }
  const px = typeof size === 'number' ? size : SIZES[size] ?? SIZES.sm
  const labelled = Boolean(title)
  return (
    <svg
      viewBox="0 0 24 24"
      width={px}
      height={px}
      strokeWidth={px < 16 ? 1.6 : 1.75}
      className={className}
      role={labelled ? 'img' : undefined}
      aria-hidden={labelled ? undefined : 'true'}
      focusable="false"
      // NOTE: the spread MUST come before the explicit attributes. Placed after
      // them it is a no-op, which silently left every mark rendering as a filled
      // black shape instead of a stroke.
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {labelled && <title>{title}</title>}
      {d.map((seg, i) => (
        <path key={i} d={seg} />
      ))}
    </svg>
  )
})

/**
 * Adapter so a Sigil can be handed to anything that expects a lucide component
 * (`IconBadge icon={…}`, `Tabs`, `Pill icon={…}`). This is the whole migration:
 * swap `emoji:` for `icon: sigilGlyph(id)` and every existing consumer keeps working.
 */
export function sigilGlyph(id) {
  // `strokeWidth` is accepted and ignored, so this is a drop-in for a lucide
  // component while keeping the rule that callers cannot restroke a mark.
  const Glyph = ({ size = 18, className = '', strokeWidth: _ignored, ...rest }) => (
    <Sigil id={id} size={size} className={className} {...rest} />
  )
  Glyph.displayName = `SigilGlyph(${id})`
  return Glyph
}

/** Module id -> its Sigil component, for the `icon:` slot in the UI kit. */
export const MODULE_SIGILS = {
  cybercrime: sigilGlyph('cybercrime'),
  consumer: sigilGlyph('consumer'),
  road: sigilGlyph('road'),
  student: sigilGlyph('student'),
  workplace: sigilGlyph('workplace'),
  privacy: sigilGlyph('privacy'),
  safety: sigilGlyph('safety'),
  fundamental: sigilGlyph('fundamental'),
}
