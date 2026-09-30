import { useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Check, Flag, Lock, Trophy } from 'lucide-react'
import {
  Button,
  Card,
  IconBadge,
  MODULE_SIGILS,
  Panel,
  Pill,
  ProgressBar,
  Sigil,
  formatNumber,
} from '../components/ui/index.jsx'
import { useStore } from '../lib/store.jsx'
import { MODULES } from '../data/modules.js'
import { ACCENT, LEVELS, levelNumber, moduleXpTotal } from '../lib/gamification.js'
import { useCountUp, useReducedMotionPref } from '../lib/hooks.js'

const EASE = [0.16, 1, 0.3, 1]

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

/* -------------------------------------------------------------- node marker */
function NodeMarker({ state, accent, index, pulse }) {
  const base = 'relative grid h-11 w-11 place-items-center rounded-full sm:h-14 sm:w-14'

  if (state === 'done') {
    return (
      <div className={`${base} ${accent.bg} text-white ring-4 ring-white/[0.05] ${accent.glow}`}>
        <Check className="h-[18px] w-[18px] sm:h-6 sm:w-6" strokeWidth={3} />
      </div>
    )
  }

  if (state === 'current') {
    return (
      <div className="relative grid place-items-center">
        <div
          className={`absolute inset-0 rounded-full ${pulse ? 'animate-pulse-ring' : ''}`}
          aria-hidden="true"
        />
        <div
          className={`${base} relative bg-ink-850 ring-2 ${accent.ring} ${accent.text} grid place-items-center text-sm font-extrabold tabular-nums sm:text-base`}
        >
          {index}
        </div>
      </div>
    )
  }

  // locked — quiet, and the lock is never the only signal: the row beside it
  // always carries "complete the previous module" copy.
  return (
    <div className={`grid h-9 w-9 place-items-center rounded-full bg-white/[0.04] text-fg-faint sm:h-10 sm:w-10`}>
      <Lock size={13} strokeWidth={2.2} />
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
          index: i + 1,
          s,
          open,
          state,
          blocker: blocker
            ? { name: blocker.name, pct: stats[blocker.id]?.pct || 0 }
            : null,
          accent: ACCENT[m.accent] || ACCENT.electric,
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
  const blocker = nextLocked ? nextLocked.blocker : null
  const badgeLeft = badgeRemaining(nextBadge, { stats, unlocked, streak, sixtySecond })

  const jump = (key) => {
    const el = nodes.current[key]
    if (!el) return
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
  }

  return (
    <div className="space-y-6">
      {/* --------------------------------------------------------- header */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="eyebrow mb-2">The map</div>
          <h1 className="t1">Your Legal Journey</h1>
          <p className="copy measure mt-2">
            {doneCount} of {rows.length} modules complete · {impact.journeyPct}% of the journey ·{' '}
            {rows.length - doneCount} still to unlock
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {allDone ? (
              <>
                <Pill tone="good">All {rows.length} missions cleared</Pill>
                <Pill tone="electric">Legal Legend</Pill>
              </>
            ) : (
              <>
                <Pill tone="electric">
                  Mission {String(current ? current.index : rows.length).padStart(2, '0')} of{' '}
                  {String(rows.length).padStart(2, '0')}
                </Pill>
                <span className="chip">
                  {rows.filter((r) => r.open).length} unlocked ·{' '}
                  {rows.filter((r) => !r.open).length} locked
                </span>
              </>
            )}
          </div>
        </div>

        {/* live level strip */}
        <Card className="w-full shrink-0 p-4 sm:w-[300px]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="eyebrow">Current level</div>
              <div className="t3 mt-1 truncate">{level.name}</div>
            </div>
            {/* the one place the level may be a num-xl, and only beside its name */}
            <div className={`num-xl ${accent.text}`}>{levelNumber(level.level)}</div>
          </div>
          <ProgressBar
            className="mt-3.5"
            value={level.pct}
            variant="xp"
            showLabel
            label={
              level.isMax
                ? 'Highest level'
                : `${formatNumber(level.into)} / ${formatNumber(level.span)} XP`
            }
          />
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
            <span className="chip-xp">{formatNumber(xpShown)} XP</span>
            <span className="caption">
              {level.isMax
                ? 'Maximum level reached'
                : `${formatNumber(level.toNext)} XP to level ${levelNumber(level.level + 1)}`}
            </span>
          </div>
        </Card>
      </header>

      {/* ------------------------------------------- jump to module (desktop) */}
      <div className="hidden lg:block">
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="eyebrow mr-1 shrink-0 pr-1">Jump to</span>
          <button
            onClick={() => jump('start')}
            className="chip shrink-0 whitespace-nowrap text-fg-muted transition-colors hover:text-white"
          >
            Start
          </button>
          {rows.map((r) => {
            const active = r.state === 'current'
            const isNextLocked = nextLocked && r.m.id === nextLocked.m.id
            return (
              <button
                key={r.m.id}
                onClick={() => jump(r.m.id)}
                className={`chip shrink-0 whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-white/[0.09] text-white'
                    : r.state === 'locked'
                      ? 'text-fg-faint'
                      : 'text-fg-dim hover:text-fg-muted'
                }`}
              >
                <span className="tnum opacity-60">{String(r.index).padStart(2, '0')}</span>
                {isNextLocked && <Lock size={12} strokeWidth={2.2} className="text-fg-faint" />}
                {r.m.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* --------------------------------------------- sticky milestone strip */}
      <div className="relative z-30 lg:sticky lg:top-[66px]">
        <Panel className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="flex min-w-0 items-center gap-3">
            <IconBadge
              icon={nextLocked ? MODULE_SIGILS[nextLocked.m.id] : Trophy}
              tone={nextLocked ? 'muted' : 'xp'}
              size="sm"
            />
            <div className="min-w-0">
              <div className="eyebrow">Next module unlock</div>
              <p className="t3 truncate">{nextLocked ? nextLocked.m.name : 'Every module on the map is unlocked'}</p>
              {blocker && <p className="caption mt-0.5 truncate">Finish {blocker.name} to open it</p>}
            </div>
          </div>
          {!nextBadge ? (
            <span className="chip-good shrink-0">Every badge earned</span>
          ) : badgeLeft != null ? (
            <span className="chip-xp shrink-0">Almost unlocked — {badgeLeft} more to go</span>
          ) : (
            <span className="chip shrink-0">{nextBadge.hint}</span>
          )}
        </Panel>
      </div>

      {/* ------------------------------------------------------ the path */}
      <div className="relative pl-[60px] sm:pl-20">
        {/* the travelling line */}
        <div
          className="pointer-events-none absolute bottom-0 left-[21px] top-0 w-px bg-gradient-to-b from-transparent via-electric-500/40 to-transparent sm:left-[27px]"
          aria-hidden="true"
        />

        {/* node 0 — start */}
        <motion.div
          ref={(el) => {
            nodes.current.start = el
          }}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.3, ease: EASE }}
          className="relative mb-6 flex items-start gap-4 sm:mb-8 sm:gap-6"
        >
          <div className="flex w-11 shrink-0 justify-center sm:w-14">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.05] text-fg-muted sm:h-10 sm:w-10">
              <Flag size={14} strokeWidth={2.4} />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <Card className="p-4 sm:p-5">
              <div className="eyebrow">Start</div>
              <div className="t3 mt-1">{LEVELS[0].name}</div>
              <p className="copy measure mt-1.5">
                You begin here. Work the map in order — every module opens the next one, and each
                one you finish permanently raises what you know about your own rights.
              </p>
              {current && (
                <p className="caption mt-2.5">
                  First up: <span className="font-semibold text-fg-muted">{current.m.name}</span>
                </p>
              )}
            </Card>
          </div>
        </motion.div>

        {/* nodes 1..8 — one per module */}
        {rows.map((r, i) => {
          const last = i === rows.length - 1

          /* locked: one genuinely quiet line. No box, no click, one lock. */
          if (r.state === 'locked') {
            return (
              <motion.div
                key={r.m.id}
                ref={(el) => {
                  nodes.current[r.m.id] = el
                }}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.28, ease: EASE }}
                className={`relative flex items-start gap-4 sm:gap-6 ${last ? '' : 'mb-2'}`}
              >
                <div className="flex w-11 shrink-0 justify-center pt-1 sm:w-14">
                  <NodeMarker state="locked" accent={r.accent} index={r.index} pulse={false} />
                </div>
                <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2.5 gap-y-0.5 py-1.5 opacity-40 grayscale">
                  <span className="t3 shrink-0 text-fg-muted">{r.m.name}</span>
                  <span className="caption min-w-0 truncate">
                    Locked — complete the previous module to unlock
                    {r.blocker ? ` · finish ${r.blocker.name} (${r.blocker.pct}%) first` : ''}
                  </span>
                </div>
              </motion.div>
            )
          }

          const body = (
            <div className="min-w-0 flex-1">
              <Card
                className={
                  r.state === 'current' ? `p-4 ring-1 sm:p-5 ${r.accent.ring}` : 'p-4 sm:p-5'
                }
              >
                {/* top row — one leading mark, the module's own Sigil */}
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.05]">
                    <Sigil
                      id={r.m.id}
                      size={18}
                      className={r.state === 'current' ? r.accent.text : 'text-fg-muted'}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="eyebrow">Mission {String(r.index).padStart(2, '0')}</span>
                      {r.state === 'current' && <Pill tone="electric">Next mission</Pill>}
                      {r.state === 'done' && <Pill tone="good">Completed</Pill>}
                    </div>
                    <h3 className="t3 mt-1">{r.m.name}</h3>
                    <p className="copy mt-1">{r.m.tagline}</p>
                  </div>
                </div>

                {/* progress */}
                <ProgressBar
                  className="mt-4"
                  value={r.s.pct}
                  variant={r.state === 'done' ? 'xp' : 'default'}
                  showLabel
                  size="sm"
                  label={`${r.doneUnits} of ${r.units} activities`}
                />

                {/* meta row */}
                <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="chip-xp">+{r.xp} XP</span>
                  <Pill>{r.m.difficulty}</Pill>
                  <span className="caption tnum">
                    {r.s.scenariosDone}/{r.s.scenarioTotal} scenarios
                  </span>
                  <span className="caption tnum">
                    Quiz {r.s.quizBest}/{r.s.quizTotal}
                  </span>
                  <span className="caption">~{r.m.minutes} min</span>
                </div>

                {/* action */}
                {r.state === 'current' && (
                  <div className="mt-4">
                    <Button
                      as={Link}
                      to={`/lesson/${r.m.id}`}
                      variant="primary"
                      size="sm"
                      iconRight={ArrowRight}
                    >
                      {r.s.pct > 0 ? 'Continue' : 'Start'}
                    </Button>
                  </div>
                )}
                {r.state === 'done' && (
                  <div className="mt-4">
                    <Button
                      as={Link}
                      to={`/lesson/${r.m.id}`}
                      variant="ghost"
                      size="sm"
                      iconRight={ArrowRight}
                    >
                      Replay
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          )

          return (
            <motion.div
              key={r.m.id}
              ref={(el) => {
                nodes.current[r.m.id] = el
              }}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.32, ease: EASE }}
              className={`relative flex items-start gap-4 sm:gap-6 ${last ? '' : 'mb-6 sm:mb-8'}`}
            >
              <div className="flex w-11 shrink-0 justify-center sm:w-14">
                <NodeMarker state={r.state} accent={r.accent} index={r.index} pulse={!reduce} />
              </div>
              {body}
            </motion.div>
          )
        })}
      </div>

      {/* -------------------------------------------- completion celebration */}
      {allDone && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <Panel className="sheet-focal p-5 text-center sm:p-8">
            <Sigil id="legal-legend" size={40} className="mx-auto text-xp-300" />
            <div className="eyebrow mt-4">Journey complete</div>
            <h2 className="t2 mt-1.5">Legal Legend</h2>
            <p className="copy measure mx-auto mt-2">
              All {rows.length} modules complete — {formatNumber(level.xp)} XP earned across
              scenarios, quizzes and lessons. Every module on the map is now yours to replay
              whenever you need a refresher.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
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
    </div>
  )
}
