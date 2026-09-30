/**
 * Top bar — the app's only persistent chrome. Restraint is the brief.
 *
 * v2 notes (docs/council):
 *   - L3 surface: the scrolled top bar is `overlay-panel`, the one place a
 *     backdrop-blur is legal.
 *   - The streak chip is the ONLY `warn` element in the product chrome, and the
 *     flame only loops at a streak of 2 or more (one of two permitted loops).
 *   - The XP figure is STATIC. A throttled rAF in a background tab must never
 *     leave a wrong number on screen, so there is no count-up here at all.
 *   - Search rows carry a 16px Sigil — the row's only differentiator.
 */
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Search as SearchIcon, X, Command, Flame, Sparkles, Menu, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../../lib/store.jsx'
import { formatNumber } from '../../lib/dates.js'
import { levelNumber } from '../../lib/gamification.js'
import { searchIndex } from '../../data/modules.js'
import { NAV_ITEMS } from './nav.js'
import { useActions } from '../../lib/store.jsx'
import { Monogram, Sigil } from '../ui/index.jsx'

const ease = [0.16, 1, 0.3, 1]

/* ------------------------------------------------------- global search box */
export function GlobalSearch({ autoFocus = false, onNavigate, className = '' }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(autoFocus)
  const nav = useNavigate()
  const boxRef = useRef(null)

  const term = q.trim().toLowerCase()
  const results = term
    ? searchIndex
        .filter(
          (r) =>
            r.title.toLowerCase().includes(term) ||
            r.text.toLowerCase().includes(term) ||
            r.module.toLowerCase().includes(term),
        )
        .slice(0, 6)
    : []

  useEffect(() => {
    const onDoc = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <div className="relative">
        <SearchIcon
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-dim"
          strokeWidth={2.2}
        />
        <input
          value={q}
          autoFocus={autoFocus}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && results[0]) {
              setOpen(false)
              setQ('')
              onNavigate?.()
              nav(results[0].href || `/learn?focus=${results[0].moduleId}`)
            }
          }}
          placeholder="Search cyber fraud, refund, drunk driving…"
          /* a genuine input, so the one legal ring in the chrome is here */
          className="w-full rounded-xl bg-white/[0.04] py-2.5 pl-9 pr-16 font-body text-body text-fg outline-none ring-1 ring-inset ring-white/[0.07] transition-colors duration-200 placeholder:text-fg-dim hover:bg-white/[0.06] focus:bg-white/[0.06] focus:ring-2 focus:ring-inset focus:ring-electric-400"
        />
        {q ? (
          <button
            onClick={() => setQ('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-fg-dim transition-colors hover:text-fg"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        ) : (
          <span className="chip pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 sm:inline-flex">
            <Command size={10} strokeWidth={2.4} />
            K
          </span>
        )}
      </div>

      <AnimatePresence>
        {open && term && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.18, ease }}
            className="overlay-panel absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl p-1.5"
          >
            {results.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <p className="copy">No match for “{q}”.</p>
                <Link
                  to="/ai"
                  onClick={() => {
                    setOpen(false)
                    onNavigate?.()
                  }}
                  className="mt-1 block font-sans text-caption font-semibold text-electric-300 hover:underline"
                >
                  Ask LawLink AI instead
                </Link>
              </div>
            ) : (
              results.map((r) => (
                <Link
                  key={`${r.kind}-${r.id}-${r.title}`}
                  to={r.href || `/learn?focus=${r.moduleId}`}
                  onClick={() => {
                    setOpen(false)
                    setQ('')
                    onNavigate?.()
                  }}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors duration-200 hover:bg-white/[0.06]"
                >
                  <Sigil id={r.sigil} size={16} className="shrink-0 text-fg-dim" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-sans text-body font-semibold text-fg">
                      {r.title}
                    </span>
                    <span className="block truncate caption">
                      {r.kind === 'topic' ? 'Topic' : r.kind === 'scenario' ? 'Scenario' : 'Quiz'} ·{' '}
                      {r.module}
                    </span>
                  </span>
                  <span className="chip-xp shrink-0">+{r.xp}</span>
                </Link>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ---------------------------------------------------------------- Top bar */
export function TopBar({ onOpenMenu }) {
  const { profile, level, streak, impact } = useStore()
  const { pushToast } = useActions()
  const loc = useLocation()
  const nav = useNavigate()

  const days = streak?.current || 0
  const crumbs = NAV_ITEMS.filter((n) => n.to !== '/' && loc.pathname.startsWith(n.to))

  return (
    <header className="overlay-panel sticky top-0 z-40 border-b border-white/[0.06]">
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:px-6">
        <button
          onClick={onOpenMenu}
          className="btn btn-ghost btn-sm lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={16} />
        </button>

        <div className="hidden min-w-0 items-center gap-1.5 md:flex">
          <Link to="/" className="font-sans text-caption font-semibold text-fg-dim hover:text-fg">
            LawLink
          </Link>
          {crumbs.map((c) => (
            <span key={c.to} className="flex items-center gap-1.5">
              <ChevronRight size={12} className="text-fg-faint" />
              <span className="font-sans text-caption font-semibold text-fg">{c.label}</span>
            </span>
          ))}
        </div>

        <GlobalSearch className="ml-auto w-full max-w-[280px] sm:max-w-[340px]" />

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:ml-0">
          {/* the ONLY warn element in the chrome — and the flame only breathes
              once the streak is worth breathing for */}
          <div
            className="chip-warn"
            title={`${days} day streak · longest ${streak?.longest || 0}`}
          >
            <Flame size={12} className={days >= 2 ? 'animate-flame' : ''} strokeWidth={2.4} />
            <span className="tnum font-bold">{days}</span>
          </div>

          <div className="chip-xp hidden sm:inline-flex" title="Total experience points">
            <Sparkles size={11} strokeWidth={2.4} />
            {/* static by design — the figure must never roll */}
            <span className="tnum font-bold">{formatNumber(level.xp)}</span>
          </div>

          <Link
            to="/profile"
            className="chip transition-colors hover:text-fg"
            title={`${level.name} · ${impact.journeyPct}% of journey`}
          >
            <Sigil id="level-seal" size={14} className="shrink-0 text-violet2-300" />
            <span className="num text-violet2-300">{levelNumber(level.level)}</span>
          </Link>

          <button
            onClick={() => {
              nav('/profile')
              pushToast?.({ title: 'Profile', body: 'Impact, badges and settings.' })
            }}
            aria-label="Profile"
            className="lg:hidden"
          >
            <Monogram name={profile?.name || 'Guest'} userId={profile?.userId} size="sm" />
          </button>
        </div>
      </div>
    </header>
  )
}
