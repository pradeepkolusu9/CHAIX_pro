import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Check, Clock, Flag, Lock, MapPin, Trophy } from 'lucide-react'
import {
  Button,
  Card,
  Panel,
  Pill,
  ProgressBar,
  Sigil,
  formatNumber,
} from '../components/ui/index.jsx'
import { useStore } from '../lib/store.jsx'
import { MODULES } from '../data/modules.js'
import { ACCENT, LEVELS, levelNumber, moduleXpTotal } from '../lib/gamification.js'
import { toneFor } from '../lib/moduleTone.js'
import { useCountUp, useReducedMotionPref } from '../lib/hooks.js'

const EASE = [0.16, 1, 0.3, 1]
const ROW = 300 // px per module on desktop; the path geometry is derived from it

/** Badge ids that simply mirror a module completion, mapped to that module. */
const BADGE_MODULE = {
  'cyber-defender': 'cybercrime',
  'road-warrior': 'road',
  'smart-consumer': 'consumer',
  'rights-protector': 'safety',
  'campus-guardian': 'student',
  'workplace-rights': 'workplace',
}

/**
 * How much is honestly left before a badge flips. Returns null when the gap
 * cannot be counted (we then show the badge hint instead of inventing a number).
 */
function badgeRemaining(badge, { stats, unlocked, streak, sixtySecond }) {
  if (!badge) return null
  const open = MODULES.filter((m) => unlocked[m.id])
  const firstIncomplete = MODULES.findIndex((m) => !stats[m.id]?.completed)
  const target = BADGE_MODULE[badge.id]

  if (target) {
    const tIdx = MODULES.findIndex((m) => m.id === target)
    if (firstIncomplete < 0 || tIdx < firstIncomplete) return 1
    return tIdx - firstIncomplete + 1
  }

  switch (badge.id) {
    case 'first-step': {
      const lessons = MODULES.reduce((a, m) => a + (stats[m.id]?.lessonsRead || 0), 0)
      return Math.max(1, 1 - lessons)
    }
    case 'quick-learner':
      return Math.max(
        1,
        open.filter((m) => {
          const s = stats[m.id]
          const pct = s?.quizTotal ? Math.round((s.quizBest / s.quizTotal) * 100) : 0
          return pct < 90
        }).length,
      )
    case 'perfect-ten':
      return Math.max(
        1,
        open.filter((m) => {
          const s = stats[m.id]
          return !(s?.quizTotal && s.quizBest === s.quizTotal)
        }).length,
      )
    case 'streak-master':
      return Math.max(1, 7 - Math.max(streak?.current || 0, streak?.longest || 0))
    case 'first-blood':
      return Math.max(1, 1 - (sixtySecond?.cleared || 0))
    case 'legal-legend':
      return Math.max(1, MODULES.length - MODULES.filter((m) => stats[m.id]?.completed).length)
    default:
      return null
  }
}

/* --------------------------------------------------------------- sky pieces */
/** A soft cloud: three blurred white blobs. CSS only, decorative. */
function Cloud({ className = '' }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute -z-10 h-24 w-56 ${className}`}>
      <span className="absolute left-0 top-8 h-12 w-40 rounded-full bg-pure/80 blur-xl" />
      <span className="absolute left-10 top-0 h-20 w-24 rounded-full bg-pure/80 blur-xl" />
      <span className="absolute left-24 top-6 h-14 w-28 rounded-full bg-pure/70 blur-xl" />
    </div>
  )
}

/** Measure an element's width so the SVG path can be drawn 1:1 in pixels. */
function useWidth() {
  const ref = useRef(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    setW(el.getBoundingClientRect().width)
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}

/* -------------------------------------------------------------------- tile */
function NodeTile({ r, pulse }) {
  const { state, m } = r
  const locked = state === 'locked'
  const shape = 'rounded-2xl lg:rounded-[28px]'
  return (
    <div className={`relative bg-pure ${shape}`}>
      {state === 'current' && pulse && (
        <span aria-hidden="true" className={`absolute inset-0 animate-pulse-ring ${shape}`} />
      )}
      <div
        className={`tile tile-${toneFor(m.id)} relative h-16 w-16 lg:h-24 lg:w-24 ${shape} ${
          state === 'done' ? 'shadow-glow-xp ring-4 ring-xp-400/60' : ''
        } ${state === 'current' ? 'ring-4 ring-electric-500/50' : ''} ${
          locked ? 'opacity-85 saturate-[.55]' : ''
        }`}
      >
        <Sigil id={m.id} size={36} />
      </div>
      {state === 'done' && (
        <span className="absolute -right-2 -top-2 grid h-8 w-8 place-items-center rounded-full bg-good text-pure shadow-glow-xp ring-2 ring-pure">
          <Check size={16} strokeWidth={3} />
          <span className="sr-only">Completed</span>
        </span>
      )}
      {locked && (
        <span className="absolute -right-2 -top-2 grid h-8 w-8 place-items-center rounded-full bg-ink-800 text-pure ring-2 ring-pure">
          <Lock size={14} strokeWidth={2.4} />
          <span className="sr-only">Locked</span>
        </span>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------- card */
function NodeCard({ r }) {
  const { state, m, s } = r
  const locked = state === 'locked'
  const isNext = r.isNext

  const shell = locked
    ? 'rounded-3xl bg-pure/60 p-5 shadow-sheet ring-1 ring-inset ring-white/[0.08] backdrop-blur-md'
    : state === 'current'
      ? 'sheet-lg sheet-focal p-5 ring-2 ring-electric-500/40 sm:p-6'
      : 'sheet p-5'

  return (
    <div className={`group transition-transform duration-300 lg:hover:-translate-y-0.5 ${shell}`} tabIndex={-1}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="eyebrow">Mission {String(r.index).padStart(2, '0')}</span>
        {state === 'current' && (
          <span className="chip-electric">
            <MapPin size={11} strokeWidth={2.4} />
            You are here
          </span>
        )}
        {state === 'done' && <Pill tone="good" icon={Check}>Completed</Pill>}
        {isNext && <Pill icon={Lock}>Up next</Pill>}
      </div>

      <h3 className="t2 mt-1.5">{m.name}</h3>
      {(!locked || isNext) && <p className="copy mt-1">{m.tagline}</p>}

      {locked ? (
        <p className="caption mt-2 flex items-start gap-1.5 text-fg-muted">
          <Lock size={12} strokeWidth={2.4} className="mt-[3px] shrink-0" />
          <span>
            Unlocks after {r.blocker ? r.blocker.name : 'the previous module'}
            {r.blocker && r.blocker.pct > 0 ? ` (${r.blocker.pct}% done)` : ''}
          </span>
        </p>
      ) : (
        <ProgressBar
          className="mt-4"
          value={s.pct}
          variant={state === 'done' ? 'xp' : 'default'}
          showLabel
          size="sm"
          label={`${r.doneUnits} of ${r.units} activities`}
        />
      )}

      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        <span className="chip-xp">+{r.xp} XP</span>
        <span className="chip">
          <Clock size={11} strokeWidth={2.4} />~{m.minutes} min
        </span>
        <span className="chip">{m.difficulty}</span>
      </div>

      {/* expands on hover / keyboard focus on desktop; always open on touch layouts */}
      <div
        className={`grid grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-out lg:grid-rows-[0fr] lg:group-focus-within:grid-rows-[1fr] lg:group-hover:grid-rows-[1fr] ${
          state === 'current' ? '' : 'max-lg:hidden'
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="pt-4">
            {m.blurb && <p className="copy line-clamp-3">{m.blurb}</p>}
            <p className="caption tnum mt-2">
              {s.scenariosDone}/{s.scenarioTotal} scenarios · Quiz {s.quizBest}/{s.quizTotal}
            </p>
          </div>
        </div>
      </div>

      {state === 'done' && (
        <div className="mt-4">
          <Button as={Link} to={`/lesson/${m.id}`} variant="ghost" size="sm" iconRight={ArrowRight}>
            Replay
          </Button>
        </div>
      )}

      {state === 'current' && (
        <div className="mt-4">
          <Button as={Link} to={`/lesson/${m.id}`} variant="primary" iconRight={ArrowRight}>
            {s.pct > 0 ? 'Continue' : 'Start'}
          </Button>
        </div>
      )}
    </div>
  )
}

/* ----------------------------------------------------------------- journey */
export default function Journey() {
  const { level, stats, unlocked, nextBadge, impact, streak, sixtySecond } = useStore()
  const reduce = useReducedMotionPref()
  const nodes = useRef({})
  const accent = ACCENT[level.accent] || ACCENT.electric
  const xpShown = useCountUp(level.xp, { duration: 1100 })
  const [mapRef, mapW] = useWidth()

  const rows = useMemo(
    () =>
      MODULES.map((m, i) => {
        const s = stats[m.id] || {
          pct: 0,
          completed: false,
          lessonTotal: m.lessons.length,
          lessonsRead: 0,
          scenariosDone: 0,
          scenarioTotal: m.scenarios.length,
          quizBest: 0,
          quizTotal: m.quiz.length,
          quizDone: false,
        }
        const open = Boolean(unlocked[m.id])
        const state = s.completed ? 'done' : open ? 'current' : 'locked'
        // the module this one is actually waiting on (previous *incomplete*)
        const blocker = MODULES.slice(0, i)
          .reverse()
          .find((mm) => !stats[mm.id]?.completed)
        const units = s.lessonTotal + s.scenarioTotal + s.quizTotal
        const doneUnits = s.lessonsRead + s.scenariosDone + (s.quizDone ? s.quizTotal : 0)
        return {
          m,
          i,
          index: i + 1,
          s,
          open,
          state,
          side: i % 2 === 0 ? 'L' : 'R',
          blocker: blocker ? { name: blocker.name, pct: stats[blocker.id]?.pct || 0 } : null,
          units,
          doneUnits,
          xp: moduleXpTotal(m),
        }
      }),
    [stats, unlocked],
  )

  const doneCount = rows.filter((r) => r.state === 'done').length
  const allDone = doneCount === rows.length
  const current = rows.find((r) => r.state === 'current') || null
  const nextLocked = rows.find((r) => !r.open) || null
  const badgeLeft = badgeRemaining(nextBadge, { stats, unlocked, streak, sixtySecond })
  const shown = rows.map((r) => ({ ...r, isNext: nextLocked ? r.m.id === nextLocked.m.id : false }))

  const jump = (key, behavior) => {
    const el = nodes.current[key]
    if (!el) return
    el.scrollIntoView({ behavior: behavior || (reduce ? 'auto' : 'smooth'), block: 'center' })
  }

  // The map climbs upward, so land the reader on their own node, not the summit.
  useEffect(() => {
    if (!current) return undefined
    const id = setTimeout(() => jump(current.m.id, 'auto'), 120)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* the winding path, drawn in real pixels; module 1 sits at the bottom */
  const H = rows.length * ROW
  const path = useMemo(() => {
    if (!mapW) return ''
    const pts = [
      { x: mapW / 2, y: H + 36 },
      ...rows.map((r) => ({ x: mapW * (r.side === 'L' ? 0.3 : 0.7), y: (rows.length - 1 - r.i) * ROW + ROW / 2 })),
      { x: mapW / 2, y: -36 },
    ]
    return pts.reduce((d, p, k) => {
      if (k === 0) return `M${p.x} ${p.y}`
      const a = pts[k - 1]
      const mid = (a.y + p.y) / 2
      return `${d} C${a.x} ${mid} ${p.x} ${mid} ${p.x} ${p.y}`
    }, '')
  }, [mapW, rows, H])
  const lit = allDone ? 1 : (doneCount + 1) / (rows.length + 1)

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* --------------------------------------------------------- header */}
      <header className="grid gap-6 lg:grid-cols-12 lg:items-end">
        <div className="min-w-0 lg:col-span-7">
          <div className="eyebrow mb-2">The map</div>
          <h1 className="t1">Your Legal Journey</h1>
          <p className="lead mt-2 max-w-xl">
            {allDone
              ? `All ${rows.length} modules cleared. You made it to the top.`
              : `${doneCount} of ${rows.length} modules done. Climb the path, one module opens the next.`}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="chip-electric">{impact.journeyPct}% of the journey</span>
            {nextLocked && <span className="chip">Next unlock: {nextLocked.m.name}</span>}
            {!nextBadge ? (
              <span className="chip-good">Every badge earned</span>
            ) : badgeLeft != null ? (
              <span className="chip-xp">Badge almost yours: {badgeLeft} to go</span>
            ) : (
              <span className="chip">{nextBadge.hint}</span>
            )}
          </div>
          {current && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button variant="ghost" size="sm" icon={MapPin} onClick={() => jump(current.m.id)}>
                Jump to my spot
              </Button>
              <div className="no-scrollbar hidden items-center gap-1 lg:flex" role="group" aria-label="Jump to module">
                {rows.map((r) => (
                  <button
                    key={r.m.id}
                    type="button"
                    onClick={() => jump(r.m.id)}
                    aria-label={`Jump to ${r.m.name}`}
                    className={`tnum grid h-9 w-9 place-items-center rounded-full text-caption font-bold transition-colors ${
                      r.state === 'current'
                        ? 'bg-electric-500 text-pure'
                        : r.state === 'done'
                          ? 'bg-xp-200 text-xp-300'
                          : 'bg-white/[0.06] text-fg-dim hover:text-fg'
                    }`}
                  >
                    {r.index}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* level card */}
        <Card className="lg:col-span-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="eyebrow">Current level</div>
              <div className="t2 mt-1 truncate">{level.name}</div>
            </div>
            <div className={`num-xl ${accent.text}`}>{levelNumber(level.level)}</div>
          </div>
          <ProgressBar
            className="mt-4"
            value={level.pct}
            variant="xp"
            showLabel
            label={level.isMax ? 'Highest level' : `${formatNumber(level.into)} / ${formatNumber(level.span)} XP`}
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="chip-xp">{formatNumber(xpShown)} XP</span>
            <span className="caption">
              {level.isMax
                ? 'Maximum level reached'
                : `${formatNumber(level.toNext)} XP to level ${levelNumber(level.level + 1)}`}
            </span>
          </div>
        </Card>
      </header>

      {/* -------------------------------------------- completion celebration */}
      {allDone && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <Panel className="sheet-focal p-6 text-center sm:p-10">
            <Sigil id="legal-legend" size={40} className="mx-auto text-xp-300" />
            <div className="eyebrow mt-4">Journey complete</div>
            <h2 className="t1 mt-1.5">Legal Legend</h2>
            <p className="copy measure mx-auto mt-2">
              {formatNumber(level.xp)} XP earned across scenarios, quizzes and lessons. Every module
              stays open to replay whenever you need a refresher.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Button as={Link} to="/leaderboard" variant="primary" iconRight={ArrowRight}>
                See the leaderboard
              </Button>
              <Button as={Link} to="/achievements" variant="ghost">
                All badges
              </Button>
              <Button as={Link} to="/learn" variant="quiet">
                Replay a module
              </Button>
            </div>
          </Panel>
        </motion.div>
      )}

      {/* ------------------------------------------------------ the map */}
      <section className="relative isolate overflow-x-clip" aria-label="Journey map">
        {/* light at the summit */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-56 left-1/2 -z-10 h-[520px] w-[900px] max-w-[160%] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(255,214,140,0.6),rgba(255,236,190,0.25)_55%,transparent)]"
        />
        <Cloud className="left-[2%] top-[4%]" />
        <Cloud className="right-[0%] top-[20%] scale-110" />
        <Cloud className="left-[4%] top-[42%]" />
        <Cloud className="right-[4%] top-[64%] scale-125" />
        <Cloud className="left-[0%] top-[84%]" />

        {/* summit */}
        <div className="flex flex-col items-center pb-2 text-center">
          <div className="tile tile-xp grid h-14 w-14 place-items-center rounded-2xl shadow-glow-xp">
            <Trophy size={24} strokeWidth={2} />
          </div>
          <div className="eyebrow mt-2">Summit</div>
          <p className="t3">Legal Legend</p>
        </div>

        <div ref={mapRef} className="relative">
          {/* winding path, desktop */}
          {mapW > 0 && (
            <svg
              aria-hidden="true"
              width={mapW}
              height={H}
              viewBox={`0 0 ${mapW} ${H}`}
              className="pointer-events-none absolute inset-0 hidden overflow-visible lg:block"
            >
              <path d={path} fill="none" stroke="rgba(61,99,245,0.10)" strokeWidth="18" strokeLinecap="round" />
              <path
                d={path}
                fill="none"
                stroke="rgba(61,99,245,0.4)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="1 11"
              />
              <motion.path
                d={path}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="7"
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 8px rgba(245,158,11,0.55))' }}
                initial={{ pathLength: reduce ? lit : 0 }}
                animate={{ pathLength: lit }}
                transition={{ duration: reduce ? 0 : 1.4, ease: EASE, delay: 0.2 }}
              />
            </svg>
          )}
          {/* single-column path, mobile */}
          <div
            aria-hidden="true"
            className="absolute -top-2 bottom-0 left-8 -translate-x-1/2 border-l-[3px] border-dashed border-electric-500/30 lg:hidden"
          />

          <ol className="relative flex flex-col-reverse">
            {shown.map((r) => {
              const left = r.side === 'L'
              return (
                <motion.li
                  key={r.m.id}
                  ref={(el) => {
                    nodes.current[r.m.id] = el
                  }}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.34, ease: EASE }}
                  className="relative flex items-start gap-4 pb-8 lg:block lg:h-[300px] lg:pb-0"
                >
                  <div
                    className={`shrink-0 lg:absolute lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 ${
                      left ? 'lg:left-[30%]' : 'lg:left-[70%]'
                    }`}
                  >
                    <NodeTile r={r} pulse={!reduce} />
                  </div>
                  <div
                    className={`min-w-0 flex-1 lg:absolute lg:top-1/2 lg:w-[calc(70%-110px)] lg:max-w-[440px] lg:-translate-y-1/2 lg:flex-none ${
                      left ? 'lg:left-[calc(30%+80px)]' : 'lg:right-[calc(30%+80px)]'
                    }`}
                  >
                    <NodeCard r={r} />
                  </div>
                </motion.li>
              )
            })}
          </ol>
        </div>

        {/* start */}
        <div className="mt-2 flex flex-col items-center text-center">
          <div className="tile tile-muted grid h-14 w-14 place-items-center rounded-2xl">
            <Flag size={22} strokeWidth={2.2} />
          </div>
          <div className="eyebrow mt-2">Start</div>
          <p className="t3">{LEVELS[0].name}</p>
        </div>
      </section>
    </div>
  )
}
