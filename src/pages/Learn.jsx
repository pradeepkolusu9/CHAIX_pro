import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Check, Clock, Compass, Lock, Search, SearchX, X } from 'lucide-react'
import {
  Button,
  EmptyState,
  Panel,
  Pill,
  Sigil,
  Tabs,
  formatNumber,
} from '../components/ui/index.jsx'
import { useStore } from '../lib/store.jsx'
import { MODULES } from '../data/modules.js'
import { moduleXpTotal } from '../lib/gamification.js'
import { toneFor } from '../lib/moduleTone.js'
import { useReducedMotionPref } from '../lib/hooks.js'

const EASE = [0.16, 1, 0.3, 1]

const DIFFICULTY_TABS = [
  { key: 'all', label: 'All levels' },
  ...Array.from(new Set(MODULES.map((m) => m.difficulty))).map((d) => ({ key: d, label: d })),
]

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'progress', label: 'In progress' },
  { key: 'done', label: 'Completed' },
  { key: 'locked', label: 'Locked' },
]

/* ------------------------------------------------------------ progress ring */
function Ring({ pct, done, size = 52 }) {
  const stroke = 5
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(61,99,245,0.12)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={done ? '#F59E0B' : '#3D63F5'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="tnum absolute inset-0 grid place-items-center text-micro font-bold text-fg">
        {done ? <Check size={16} strokeWidth={3} className="text-xp-300" /> : `${pct}%`}
      </span>
    </div>
  )
}

function Chips({ m, xp }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="chip">{m.difficulty}</span>
      <span className="chip">
        <Clock size={11} strokeWidth={2.4} />~{m.minutes} min
      </span>
      <span className="chip-xp">+{formatNumber(xp)} XP</span>
    </div>
  )
}

/* ------------------------------------------------------------- featured card */
function Featured({ row, focused, innerRef }) {
  const { m, s, xp, tone } = row
  return (
    <div ref={innerRef}>
      <Panel className={`sheet-focal p-6 sm:p-8 ${focused ? 'ring-2 ring-electric-500/40' : ''}`}>
        <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
          <div className="flex min-w-0 items-start gap-5 lg:col-span-8">
            <div className={`tile tile-${tone} h-20 w-20 rounded-[24px] sm:h-24 sm:w-24 sm:rounded-[28px]`}>
              <Sigil id={m.id} size={38} />
            </div>
            <div className="min-w-0">
              <div className="eyebrow">Pick up where you left off</div>
              <h2 className="t1 mt-1.5">{m.name}</h2>
              <p className="lead mt-2 max-w-xl">{m.blurb || m.tagline}</p>
              <div className="mt-4">
                <Chips m={m} xp={xp} />
              </div>
            </div>
          </div>
          <div className="lg:col-span-4">
            <div className="flex items-center gap-4">
              <Ring pct={s.pct} size={72} />
              <div className="min-w-0">
                <div className="t3">
                  {s.scenariosDone}/{s.scenarioTotal} scenarios cleared
                </div>
                <div className="caption">{s.pct > 0 ? 'Nice momentum, keep going' : 'Ready when you are'}</div>
              </div>
            </div>
            <div className="mt-5">
              {/* the one btn-primary on this screen */}
              <Button as={Link} to={`/lesson/${m.id}`} variant="primary" size="lg" iconRight={ArrowRight}>
                {s.pct > 0 ? 'Continue learning' : 'Start module'}
              </Button>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  )
}

/* ------------------------------------------------------------- module card */
function ModuleCard({ row, prevName, focused, innerRef }) {
  const { m, s, open, status, tone, xp } = row
  const locked = !open

  const body = (
    <div
      className={`group relative flex h-full flex-col p-5 ${
        locked
          ? 'rounded-3xl bg-pure/60 shadow-sheet ring-1 ring-inset ring-white/[0.08] backdrop-blur-md'
          : 'sheet transition-shadow duration-200 hover:shadow-sheet-lg'
      } ${focused ? 'ring-2 ring-electric-500/50' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="relative">
          <div className={`tile tile-${tone} h-14 w-14 rounded-2xl ${locked ? 'opacity-85 saturate-[.55]' : ''}`}>
            <Sigil id={m.id} size={28} />
          </div>
          {locked && (
            <span className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-ink-800 text-pure ring-2 ring-pure">
              <Lock size={11} strokeWidth={2.6} />
              <span className="sr-only">Locked</span>
            </span>
          )}
        </div>
        {!locked && <Ring pct={s.pct} done={s.completed} />}
        {locked && s.pct > 0 && <span className="chip tnum">{s.pct}% done</span>}
      </div>

      <h3 className="t2 mt-4">{m.name}</h3>
      <p className="copy mt-1">{m.tagline}</p>

      {locked ? (
        <p className="caption mt-3 flex items-start gap-1.5 text-fg-muted">
          <Lock size={12} strokeWidth={2.4} className="mt-[3px] shrink-0" />
          <span className="min-w-0">Unlocks after {prevName || 'the previous module'}</span>
        </p>
      ) : (
        <div className="mt-3">
          {status === 'done' && (
            <Pill tone="good" icon={Check}>
              Completed
            </Pill>
          )}
          {status === 'progress' && <Pill tone="electric">In progress</Pill>}
          {status === 'fresh' && <Pill>Not started</Pill>}
        </div>
      )}

      <div className="mt-4">
        <Chips m={m} xp={xp} />
      </div>
      <p className="caption mt-3">
        {m.scenarios.length} scenarios · {m.quiz.length} questions
      </p>

      {open && (
        <div className="mt-auto flex items-center gap-1.5 pt-4 font-sans text-caption font-bold text-electric-300">
          {s.pct > 0 && !s.completed ? 'Continue' : s.completed ? 'Replay' : 'Start'}
          <ArrowRight size={14} strokeWidth={2.5} className="transition-transform group-hover:translate-x-0.5" />
        </div>
      )}
    </div>
  )

  // A locked module is not clickable — it is a `<div>`, never a dead button.
  if (!open)
    return (
      <div ref={innerRef} className="h-full">
        {body}
      </div>
    )

  return (
    <Link to={`/lesson/${m.id}`} className="group block h-full rounded-3xl">
      <div ref={innerRef} className="h-full">
        {body}
      </div>
    </Link>
  )
}

/* -------------------------------------------------------------- the library */
export default function Learn() {
  const { stats, unlocked } = useStore()
  const [params] = useSearchParams()
  const reduce = useReducedMotionPref()
  const cards = useRef({})

  const [q, setQ] = useState('')
  const [difficulty, setDifficulty] = useState('all')
  const [status, setStatus] = useState('all')

  const focusParam = MODULES.some((m) => m.id === params.get('focus')) ? params.get('focus') : null
  const [focusId, setFocusId] = useState(focusParam)

  const totals = useMemo(
    () =>
      MODULES.reduce(
        (a, m) => ({
          modules: a.modules + 1,
          scenarios: a.scenarios + m.scenarios.length,
          questions: a.questions + m.quiz.length,
        }),
        { modules: 0, scenarios: 0, questions: 0 },
      ),
    [],
  )

  const rows = useMemo(
    () =>
      MODULES.map((m, i) => {
        const s = stats[m.id] || {
          pct: 0,
          completed: false,
          scenariosDone: 0,
          scenarioTotal: m.scenarios.length,
          quizBest: 0,
          quizTotal: m.quiz.length,
        }
        const open = Boolean(unlocked[m.id])
        const status = s.completed ? 'done' : s.pct > 0 ? 'progress' : open ? 'fresh' : 'locked'
        // the module a locked card is actually waiting on
        const blocker = MODULES.slice(0, i)
          .reverse()
          .find((mm) => !stats[mm.id]?.completed)
        return {
          m,
          s,
          open,
          status,
          prevName: blocker ? blocker.name : null,
          tone: toneFor(m.id),
          xp: moduleXpTotal(m),
        }
      }),
    [stats, unlocked],
  )

  /* deep link from search: bring the target card into view, ring it for ~2s */
  useEffect(() => {
    setFocusId(focusParam)
    if (!focusParam) return undefined
    const id = setTimeout(() => {
      const el = cards.current[focusParam]
      if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
    }, 160)
    const clear = setTimeout(() => setFocusId(null), 2200)
    return () => {
      clearTimeout(id)
      clearTimeout(clear)
    }
  }, [focusParam, reduce])

  const term = q.trim().toLowerCase()
  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (difficulty !== 'all' && r.m.difficulty !== difficulty) return false
        if (status !== 'all') {
          if (status === 'locked' && r.open) return false
          if (status !== 'locked' && r.status !== status) return false
        }
        if (!term) return true
        return (
          r.m.name.toLowerCase().includes(term) ||
          r.m.tagline.toLowerCase().includes(term) ||
          r.m.blurb.toLowerCase().includes(term)
        )
      }),
    [rows, difficulty, status, term],
  )

  const dirty = Boolean(term) || difficulty !== 'all' || status !== 'all'
  const clear = () => {
    setQ('')
    setDifficulty('all')
    setStatus('all')
  }

  /* the one module to pick up next */
  const resume =
    rows.find((r) => r.open && !r.s.completed && r.s.pct > 0) ||
    rows.find((r) => r.open && !r.s.completed) ||
    null

  // Featured only when nothing is filtered; while filtering, every match lives in the grid.
  const showFeatured = Boolean(resume) && !dirty
  const gridRows = showFeatured ? filtered.filter((r) => r.m.id !== resume.m.id) : filtered

  return (
    <div className="space-y-12">
      {/* --------------------------------------------------------- header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="eyebrow mb-2">Library</div>
          <h1 className="t1">Learn legal topics</h1>
          <p className="lead mt-2">
            {totals.modules} modules · {totals.scenarios} real-life scenarios · {totals.questions} quiz
            questions
          </p>
        </div>
        <Button as={Link} to="/journey" variant="ghost" size="sm" iconRight={ArrowRight} className="self-start">
          Back to the map
        </Button>
      </header>

      {/* ------------------------------------------------ featured (focal) */}
      {showFeatured && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
        >
          <Featured
            row={resume}
            focused={resume.m.id === focusId}
            innerRef={(el) => {
              cards.current[resume.m.id] = el
            }}
          />
        </motion.div>
      )}

      {/* ---------------------------------------------------- filters + grid */}
      <section className="space-y-6">
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-dim"
                strokeWidth={2.2}
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search modules: cyber fraud, refunds, ragging…"
                aria-label="Search modules"
                className="w-full rounded-2xl bg-pure py-3 pl-10 pr-3 text-body text-fg shadow-sheet outline-none ring-1 ring-inset ring-white/[0.1] transition-shadow placeholder:text-fg-dim focus:ring-2 focus:ring-inset focus:ring-electric-500/60"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="chip shrink-0 tabular-nums">
                {showFeatured ? `${gridRows.length} more modules` : `${filtered.length} of ${MODULES.length} modules`}
              </span>
              {dirty && (
                <Button variant="quiet" size="sm" icon={X} onClick={clear} className="shrink-0">
                  Clear filters
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
            <div className="min-w-0 flex-1">
              <Tabs tabs={DIFFICULTY_TABS} value={difficulty} onChange={setDifficulty} />
            </div>
            <div className="hidden h-6 w-px bg-white/[0.1] sm:block" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <Tabs tabs={STATUS_TABS} value={status} onChange={setStatus} />
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No modules match those filters"
            body={`Try a different search term, or reset the difficulty and status filters to see all ${MODULES.length} modules.`}
            action={
              <Button variant="ghost" icon={X} onClick={clear}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {gridRows.map((r) => (
              <motion.div
                key={r.m.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.28, ease: EASE }}
                whileHover={r.open ? { y: -3 } : undefined}
                className="h-full"
              >
                <ModuleCard
                  row={r}
                  prevName={r.prevName}
                  focused={r.m.id === focusId}
                  innerRef={(el) => {
                    cards.current[r.m.id] = el
                  }}
                />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* honest footer note: the map explains unlock order */}
      <div className="flex items-start gap-2.5">
        <Compass className="mt-0.5 h-4 w-4 shrink-0 text-fg-dim" strokeWidth={2.1} />
        <p className="copy measure">
          Modules unlock in a fixed order, so each topic builds on the last. The{' '}
          <Link to="/journey" className="font-semibold text-electric-300 hover:underline">
            journey map
          </Link>{' '}
          shows the full path.
        </p>
      </div>
    </div>
  )
}
