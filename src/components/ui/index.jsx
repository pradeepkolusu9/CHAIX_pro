/**
 * LawLink UI kit v2 — council-issued.
 *
 * Every page must build from these primitives so the product reads as one system.
 * Rules that are NOT negotiable (docs/council/01-visual-language.md):
 *   - No raw hex. Use the token classes.
 *   - `.display` is WORDS only, max one per screen. Numbers use num-xl / num-lg / num.
 *   - One hue per job: blue = action, gold = earned, violet = level only,
 *     green = verified/correct, orange = heat/streak, red = urgent.
 *   - Separation is tonal. Do not add `border border-white/...` to a surface.
 *   - One btn-primary per screen.
 */
import { forwardRef, useId, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, CalendarClock, X, BookOpen, Link2, Scale, Info, FileClock } from 'lucide-react'
import { useCountUp } from '../../lib/hooks.js'
import { LAST_VERIFIED_LABEL } from '../../lib/review.js'
import { formatNumber } from '../../lib/dates.js'
import { Button } from './Button.jsx'
import { useDialog } from './useDialog.js'
import { Sigil, sigilGlyph, MODULE_SIGILS, SIGIL_IDS, hasSigil } from './Sigil.jsx'
import { Monogram, initialsOf, hueFor, resolveHues } from './Monogram.jsx'

export { Button, Sigil, sigilGlyph, MODULE_SIGILS, SIGIL_IDS, hasSigil, Monogram, initialsOf, hueFor, resolveHues }

/* ------------------------------------------------------------------ Card */
/** Default raised surface. No border, no backdrop-blur — tone does the work. */
export function Card({ as: As = 'div', className = '', hover = false, children, ...rest }) {
  return (
    <As className={`sheet p-5 ${hover ? 'pressable hover:-translate-y-0.5' : ''} ${className}`} {...rest}>
      {children}
    </As>
  )
}

/** Large focal surface. Combine with `sheet-focal` for the one hero on a screen. */
export function Panel({ className = '', children, ...rest }) {
  return (
    <div className={`sheet-lg ${className}`} {...rest}>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------- Headings */
/**
 * The one card rhythm, shipped so 17 screens cannot drift.
 * eyebrow → title → sub, always in that order.
 */
export function CardHead({ eyebrow, title, sub, action, tone, as: As = 'h3', className = '' }) {
  return (
    <div className={`mb-3 flex items-end justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        {eyebrow && <div className={`eyebrow mb-2 ${tone || ''}`}>{eyebrow}</div>}
        <As className="t2 truncate">{title}</As>
        {sub && <p className="copy mt-1">{sub}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/** Section-level heading for a page. */
export function SectionHeading({ eyebrow, title, sub, action, className = '' }) {
  return (
    <div className={`mb-4 flex items-end justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
        <h2 className="t1 truncate">{title}</h2>
        {sub && <p className="copy mt-1">{sub}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/* ------------------------------------------------------------ ProgressBar */
export function ProgressBar({
  value = 0,
  max = 100,
  variant = 'default',
  size = 'md',
  showLabel = false,
  label,
  className = '',
  delay = 0.1,
}) {
  const pct = Math.max(0, Math.min(100, max ? (value / max) * 100 : 0))
  const h = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2'
  const fill = {
    default: 'track-fill',
    xp: 'track-fill-xp',
    good: 'track-fill-good',
    muted: 'track-fill-muted',
  }[variant]
  return (
    <div className={className}>
      {(showLabel || label) && (
        <div className="mb-1.5 flex items-center justify-between">
          <span className="caption">{label}</span>
          {showLabel && <span className="eyebrow tnum">{Math.round(pct)}%</span>}
        </div>
      )}
      <div
        className={`track ${h}`}
        role="progressbar"
        aria-label={label || 'Progress'}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
          className={fill}
        />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- StatStrip */
/**
 * Unboxed stat row. Lives on the canvas — no container, no border.
 * `tone` is semantic and opt-in: 'xp' only for earned value, 'good' at >=80%,
 * 'warn' below 40% or a streak at risk. Never decorative.
 */
export function StatStrip({ items, className = '' }) {
  const toneClass = (t) =>
    t === 'xp' ? 'text-xp-300' : t === 'good' ? 'text-good' : t === 'warn' ? 'text-warn' : t === 'danger' ? 'text-danger' : ''
  // Static class names only — a dynamic `grid-cols-${n}` is invisible to Tailwind's
  // scanner, so the grid would silently fall back to 2 columns.
  const cols =
    items.length >= 5
      ? 'sm:grid-cols-5'
      : items.length === 4
        ? 'sm:grid-cols-4'
        : items.length === 3
          ? 'sm:grid-cols-3'
          : 'sm:grid-cols-2'
  return (
    <div className={`grid grid-cols-2 gap-y-6 divide-x divide-white/[0.05] ${cols} ${className}`}>
      {items.map((s) => (
        <StatCell key={s.label} {...s} toneClass={toneClass(s.tone)} />
      ))}
    </div>
  )
}

function StatCell({ label, value, suffix, toneClass = '' }) {
  return (
    <div className="px-4 first:pl-0 sm:first:pl-0">
      <div className="eyebrow mb-1.5 truncate">{label}</div>
      <div className={`num-lg ${toneClass}`}>
        {value}
        {suffix && <span className="text-caption font-semibold text-fg-dim">{suffix}</span>}
      </div>
    </div>
  )
}

/**
 * @deprecated Migrate to <StatStrip> (unboxed row) or <Figure> (single number).
 * Kept only so pages not yet migrated still compile on the v2 tokens. The old
 * five-hue decorative tone map is gone — `violet` is no longer a valid tone,
 * because violet is the level-identity hue and nothing else.
 */
export function Stat({ label, value, suffix, sub, tone, className = '' }) {
  const toneClass =
    tone === 'xp' ? 'text-xp-300' : tone === 'good' ? 'text-good' : tone === 'warn' ? 'text-warn' : tone === 'danger' ? 'text-danger' : ''
  return (
    <div className={`min-w-0 ${className}`}>
      <div className="eyebrow mb-1.5 truncate">{label}</div>
      <div className={`num-lg ${toneClass}`}>
        {value}
        {suffix && <span className="text-caption font-semibold text-fg-dim">{suffix}</span>}
      </div>
      {sub && <div className="caption mt-1">{sub}</div>}
    </div>
  )
}

/* ------------------------------------------------------------- LevelSeal */
/**
 * A level is a seal, not a headline. One component so the level reads as the same
 * object on every screen. Violet is the level-identity hue and is used nowhere else.
 */
export function LevelSeal({ number, name, sub, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet2-500/[0.10] ring-1 ring-inset ring-violet2-400/25">
        <Sigil id="level-seal" size={20} className="text-violet2-300" />
      </div>
      <div className="min-w-0">
        <div className="t3 truncate">
          <span className="num text-violet2-300">{number}</span> {name}
        </div>
        {sub && <div className="caption tnum truncate">{sub}</div>}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Pill */
export function Pill({ icon: Icon, children, tone = 'default', className = '' }) {
  const tones = {
    default: 'chip',
    xp: 'chip-xp',
    good: 'chip-good',
    danger: 'chip-danger',
    warn: 'chip-warn',
    electric: 'chip-electric',
  }
  return (
    <span className={`${tones[tone] || tones.default} ${className}`}>
      {Icon && <Icon size={11} strokeWidth={2.4} />}
      {children}
    </span>
  )
}

/* ------------------------------------------------------------------ Modal */
export const Modal = forwardRef(function Modal(
  { open, onClose, children, size = 'md', dismissible = true, className = '', label, labelledBy },
  _ref,
) {
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  const panel = useDialog({ open, onClose, dismissible })
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-ink-950/45 backdrop-blur-sm" onClick={dismissible ? onClose : undefined} />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            aria-labelledby={labelledBy}
            tabIndex={-1}
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className={`overlay-panel relative z-10 w-full overflow-hidden rounded-2xl outline-none ${sizes[size]} ${className}`}
          >
            {dismissible && (
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute right-3 top-3 z-20 rounded-lg p-1.5 text-fg-dim transition-colors hover:bg-white/10 hover:text-fg"
              >
                <X size={16} />
              </button>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})

/** Yes/no confirmation for destructive actions. */
export function ConfirmModal({ open, onClose, onConfirm, title, body, confirmLabel = 'Confirm', danger = true }) {
  const id = useId()
  return (
    <Modal open={open} onClose={onClose} size="sm" labelledBy={id}>
      <div className="p-6 pr-12">
        <h2 id={id} className="t2">
          {title}
        </h2>
        <p className="copy mt-2">{body}</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose} data-autofocus>
            Cancel
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------- Tabs */
/** Pass `idPrefix` to wire ids: tabs `${p}-tab-${key}`, panels should be `${p}-panel-${key}`. */
export function Tabs({ tabs, value, onChange, className = '', idPrefix, label }) {
  const list = useRef(null)
  const onKeyDown = (e) => {
    const i = tabs.findIndex((t) => t.key === value)
    const next =
      e.key === 'ArrowRight' ? (i + 1) % tabs.length
      : e.key === 'ArrowLeft' ? (i - 1 + tabs.length) % tabs.length
      : e.key === 'Home' ? 0
      : e.key === 'End' ? tabs.length - 1
      : -1
    if (next < 0) return
    e.preventDefault()
    onChange(tabs[next].key)
    requestAnimationFrame(() => list.current?.querySelectorAll('[role="tab"]')[next]?.focus())
  }
  return (
    /* `min-w-0` is required: this is an `overflow-x-auto` flex child, and a flex
       item's default `min-width:auto` refuses to shrink below its content, which
       pushed the whole page to ~470px at 360 and cut off the scenario card. */
    <div
      ref={list}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={`no-scrollbar -mx-1 flex min-w-0 gap-1 overflow-x-auto px-1 ${className}`}
    >
      {tabs.map((t) => {
        const active = t.key === value
        return (
          <button
            key={t.key}
            role="tab"
            id={idPrefix ? `${idPrefix}-tab-${t.key}` : undefined}
            aria-selected={active}
            aria-controls={idPrefix ? `${idPrefix}-panel-${t.key}` : undefined}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.key)}
            className={`relative shrink-0 whitespace-nowrap rounded-xl px-3.5 py-2 font-sans text-body font-semibold transition-colors duration-200 ${
              active ? 'text-electric-300' : 'text-fg-dim hover:bg-white/[0.05] hover:text-fg'
            }`}
          >
            {active && (
              <motion.span
                layoutId={`tab-${tabs.map((x) => x.key).join('')}`}
                className="absolute inset-0 rounded-xl bg-electric-500/10"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {t.icon && <t.icon size={14} strokeWidth={2.1} />}
              {t.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ----------------------------------------------- Legal trust / source block */
export function LegalBasis({ basis, source, lastVerified, className = '' }) {
  if (!basis) return null
  const rows = [
    basis.law && {
      icon: Scale,
      label: 'Legal basis',
      value: `${basis.law}${basis.section ? ` — ${basis.section}` : ''}`,
    },
    basis.note && { icon: BookOpen, label: 'In plain words', value: basis.note, serif: true },
    source && { icon: Link2, label: 'Official source', value: source, href: basis.link },
    lastVerified && { icon: CalendarClock, label: LAST_VERIFIED_LABEL, value: lastVerified },
  ].filter(Boolean)

  return (
    <div className={`sheet p-4 ${className}`}>
      <div className="mb-3 flex items-center gap-1.5">
        <ShieldCheck size={13} className="text-good" strokeWidth={2.4} />
        <span className="eyebrow">Legal trust &amp; source</span>
      </div>
      <dl className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex gap-3">
            <r.icon size={13} className="mt-0.5 shrink-0 text-fg-faint" strokeWidth={2.2} />
            <div className="min-w-0 flex-1">
              <dt className="eyebrow">{r.label}</dt>
              <dd className={`mt-0.5 ${r.serif ? 'serif text-[15px] italic text-fg-muted' : 'copy'}`}>
                {r.href ? (
                  <a
                    href={r.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-electric-300 underline decoration-electric-500/40 underline-offset-2 hover:decoration-electric-400"
                  >
                    {r.value}
                  </a>
                ) : (
                  r.value
                )}
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  )
}

/**
 * Provenance tag.
 *
 * This used to read "Verified <date>" on every item, using one hardcoded date for
 * the whole product. That is a false claim: the content was AI-authored and
 * internally checked, not verified against the primary source by a lawyer. So the
 * tag now says what is actually true, and the date is the AUTHORING date, labelled
 * as such. `VerifiedTag` is kept as an alias so 14 call sites keep working.
 */
export function VerifiedTag({ date, className = '' }) {
  return (
    <span className={`chip ${className}`} title={`Content authored ${date}. Not yet reviewed by a lawyer.`}>
      <FileClock size={11} strokeWidth={2.4} />
      Draft · written {date}
    </span>
  )
}

/** The emergency directory IS genuinely checked, so it keeps a real green tick. */
export function VerifiedDirectoryTag({ date, className = '' }) {
  return (
    <span className={`chip-good ${className}`}>
      <ShieldCheck size={11} strokeWidth={2.4} />
      Checked {date}
    </span>
  )
}

/**
 * Legal disclaimer. Deliberately NEUTRAL — it must not steal the orange hue,
 * which is reserved for streak and time pressure. Text is never changed.
 */
export function DisclaimerNote({ text, className = '', compact = false }) {
  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl bg-white/[0.02] ring-1 ring-inset ring-white/[0.06] ${
        compact ? 'px-3 py-2' : 'px-3.5 py-3'
      } ${className}`}
    >
      <Scale size={13} className="mt-0.5 shrink-0 text-fg-dim" strokeWidth={2.2} />
      {/* `.disclaimer` is 13px fg-muted (6.1:1), not 12px fg-dim (1.62:1 measured).
          Legal text is not a caption — it has to be readable at a glance. */}
      <p className="disclaimer">
        {text ||
          'LawLink provides legal awareness and educational information only. It is not a substitute for professional legal advice.'}
      </p>
    </div>
  )
}

/** The informational note (not legal) still uses the info affordance. */
export function InfoNote({ children, className = '' }) {
  return (
    <div className={`flex items-start gap-2.5 rounded-xl bg-white/[0.02] px-3.5 py-3 ring-1 ring-inset ring-white/[0.06] ${className}`}>
      <Info size={13} className="mt-0.5 shrink-0 text-fg-dim" strokeWidth={2.2} />
      <p className="caption text-fg-dim">{children}</p>
    </div>
  )
}

/* ------------------------------------------------------------ EmptyState */
export function EmptyState({ icon: Icon, title, body, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-14 text-center ${className}`}>
      {Icon && (
        <div className="tile tile-electric mb-4 h-16 w-16 rounded-3xl">
          <Icon size={26} strokeWidth={1.9} />
        </div>
      )}
      <h3 className="t2">{title}</h3>
      {body && <p className="copy mt-2 max-w-sm">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/* ------------------------------------------------------------- Skeletons */
/**
 * Route-load placeholder. Deliberately NOT `animate-pulse`: with route-level
 * code splitting a pulse fired on every navigation, which is a third competing
 * infinite loop and reads as "nothing is happening" for a chunk that resolves in
 * ~80ms. A single non-looping fade reads as a scene change instead.
 */
export const Skeleton = ({ className = '' }) => (
  <div className={`rounded-xl bg-white/[0.07] motion-safe:animate-[fadeIn_.2s_ease-out] ${className}`} />
)

/* ------------------------------------------------------------- IconBadge */
export function IconBadge({ icon: Icon, tone = 'electric', size = 'md', className = '' }) {
  const sizes = { xs: 'h-7 w-7 rounded-lg', sm: 'h-8 w-8 rounded-[10px]', md: 'h-10 w-10 rounded-xl', lg: 'h-14 w-14 rounded-2xl' }
  const isizes = { xs: 14, sm: 16, md: 19, lg: 26 }
  return (
    <div className={`tile tile-${tone} ${sizes[size]} ${className}`}>
      <Icon size={isizes[size]} strokeWidth={2} />
    </div>
  )
}

/** Animated figure. Correct on first paint; eases only when the value changes. */
export function Figure({ value, size = 'lg', tone, className = '' }) {
  const n = useCountUp(value)
  const sizeClass = { xl: 'num-xl', lg: 'num-lg', sm: 'num' }[size]
  const toneClass = tone === 'xp' ? 'text-xp-300' : tone === 'good' ? 'text-good' : tone === 'violet' ? 'text-violet2-300' : ''
  return <span className={`${sizeClass} ${toneClass} ${className}`}>{formatNumber(n)}</span>
}

export { formatNumber }
