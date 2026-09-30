import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Compass, Lock, Search, SearchX, X } from 'lucide-react'
import {
  Button,
  EmptyState,
  IconBadge,
  Panel,
  Pill,
  ProgressBar,
  Tabs,
  formatNumber,
  sigilGlyph,
} from '../components/ui/index.jsx'
import { useStore } from '../lib/store.jsx'
import { MODULES } from '../data/modules.js'
import { moduleXpTotal } from '../lib/gamification.js'
import { useReducedMotionPref } from '../lib/hooks.js'

const EASE = [0.16, 1, 0.3, 1]

/** module.accent -> IconBadge tone */
const TONE = { electric: 'electric', violet: 'violet', xp: 'xp' }

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

/* ------------------------------------------------------------- module card */
function ModuleCard({ row, prevName, focused, innerRef }) {
  const { m, s, open, status, tone, xp } = row
  const locked = !open

  const body = (
    <div
      className={`pressable group relative flex h-full flex-col p-4 sm:p-5 ${
        locked ? 'opacity-70 saturate-0' : ''
      }`}
    >
      {focused && (
        <span
          className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-inset ring-electric-500/40"
          aria-hidden="true"
        />
      )}

      {/* head — one leading mark, the module's own Sigil */}
      <div className="flex items-start gap-3.5">
        <IconBadge icon={sigilGlyph(m.id)} tone={tone} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="t3">{m.name}</h3>
          <p className="copy mt-1">{m.tagline}</p>
        </div>
      </div>

      {/* meta */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Pill>{m.difficulty}</Pill>
        {locked && <Pill>Locked</Pill>}
        {status === 'done' && <Pill tone="good">Completed</Pill>}
        {status === 'progress' && <Pill tone="electric">In progress</Pill>}
        {status === 'fresh' && <Pill tone="muted">Not started</Pill>}
      </div>

      {/* locked reason / progress */}
      {locked ? (
        /* `items-start`, not `items-center`: this is a SENTENCE, not a label, so it
           wraps to two lines. `truncate` here both cut it mid-word AND, because the
           flex ancestor had no `min-w-0`, pushed the whole page to 508px at a 360px
           viewport — 148px of horizontal overflow on the module library. */
        <p className="mt-4 flex items-start gap-2">
          <Lock size={13} strokeWidth={2.2} className="mt-[3px] shrink-0 text-fg-faint" />
          <span className="caption min-w-0">
            Complete the previous module to unlock
            {prevName ? ` · finish ${prevName}` : ''}
            {s.pct > 0 ? ` · ${s.pct}% done` : ''}
          </span>
        </p>
      ) : (
        <div className="mt-4">
          <ProgressBar
            value={s.pct}
            variant={s.completed ? 'xp' : 'default'}
            showLabel
            size="sm"
            label={s.completed ? 'Complete' : 'Progress'}
          />
        </div>
      )}

      {/* counts */}
      <p className="caption mt-4">
        {m.scenarios.length} scenarios · {m.quiz.length} questions · ~{m.minutes} min
      </p>

      {/* footer — the whole tile is the link, so the verb is type, not an icon */}
      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <span className="num text-xp-300">+{formatNumber(xp)} XP</span>
        {open && (
          <span className="eyebrow transition-colors group-hover:text-fg-muted">
            {s.pct > 0 && !s.completed ? 'Continue' : s.completed ? 'Replay' : 'Start'}
          </span>
        )}
      </div>
    </div>
  )

  // A locked module is not clickable — it is a `<div>`, never a dead button.
  if (!open) return <div ref={innerRef} className="h-full">{body}</div>

  return (
    <Link to={`/lesson/${m.id}`} className="group block h-full rounded-xl">
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

  const focusId = MODULES.some((m) => m.id === params.get('focus'))
    ? params.get('focus')
    : null

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
          tone: TONE[m.accent] || 'electric',
          xp: moduleXpTotal(m),
        }
      }),
    [stats, unlocked],
  )

  /* deep link from search: bring the target card into view */
  useEffect(() => {
    if (!focusId) return undefined
    const id = setTimeout(() => {
      const el = cards.current[focusId]
      if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
    }, 160)
    return () => clearTimeout(id)
  }, [focusId, reduce])

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

  return (
    <div className="space-y-6">
      {/* --------------------------------------------------------- header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="eyebrow mb-2">Library</div>
          <h1 className="t1">Learn legal topics</h1>
          <p className="copy mt-2">
            {totals.modules} modules · {totals.scenarios} real-life scenarios · {totals.questions}{' '}
            quiz questions
          </p>
        </div>
        <Button
          as={Link}
          to="/journey"
          variant="ghost"
          size="sm"
          iconRight={ArrowRight}
          className="self-start"
        >
          Back to the map
        </Button>
      </header>

      {/* ------------------------------------------- continue learning (focal) */}
      {resume && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
        >
          <Panel className="sheet-focal p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3.5">
                <IconBadge icon={sigilGlyph(resume.m.id)} tone={resume.tone} size="lg" />
                <div className="min-w-0">
                  <div className="eyebrow">Pick up where you left off</div>
                  <h2 className="t3 mt-1 truncate">{resume.m.name}</h2>
                  <p className="copy mt-0.5">{resume.m.tagline}</p>
                </div>
              </div>
              <div className="w-full shrink-0 sm:w-64">
                <ProgressBar
                  value={resume.s.pct}
                  showLabel
                  size="sm"
                  label={`${resume.s.scenariosDone}/${resume.s.scenarioTotal} scenarios cleared`}
                />
                <div className="mt-3">
                  {/* the one btn-primary on this screen */}
                  <Button
                    as={Link}
                    to={`/lesson/${resume.m.id}`}
                    variant="primary"
                    size="sm"
                    iconRight={ArrowRight}
                  >
                    Continue learning
                  </Button>
                </div>
              </div>
            </div>
          </Panel>
        </motion.div>
      )}

      {/* ------------------------------------------- filter bar (flat, no box) */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-dim"
              strokeWidth={2.2}
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search modules — cyber fraud, refunds, ragging…"
              aria-label="Search modules"
              className="w-full rounded-xl bg-white/[0.04] py-2.5 pl-9 pr-3 text-sm text-fg outline-none ring-1 ring-inset ring-white/[0.06] transition-colors placeholder:text-fg-dim hover:bg-white/[0.06] focus:bg-white/[0.07] focus:ring-2 focus:ring-inset focus:ring-electric-500/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="chip shrink-0 tabular-nums">
              {filtered.length} of {MODULES.length} modules
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
          <div className="hidden h-6 w-px bg-white/[0.05] sm:block" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <Tabs tabs={STATUS_TABS} value={status} onChange={setStatus} />
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------- grid */}
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
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <motion.div
              key={r.m.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.28, ease: EASE }}
              whileHover={r.open ? { y: -2 } : undefined}
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

      {/* honest footer note — the map explains unlock order */}
      <div className="flex items-start gap-2.5">
        <Compass className="mt-0.5 h-4 w-4 shrink-0 text-fg-faint" strokeWidth={2.1} />
        <p className="copy measure">
          Modules unlock in a fixed order on the journey map, so each topic builds on the last.
          Locked modules still show what they cover and how much XP they hold. The{' '}
          <Link to="/journey" className="font-semibold text-electric-300 hover:underline">
            journey map
          </Link>{' '}
          shows the full path.
        </p>
      </div>
    </div>
  )
}
