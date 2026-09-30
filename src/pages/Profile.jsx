/**
 * Profile — /profile
 *
 * "Your Legal IQ / Your Impact". The AppShell already surfaces level, XP and
 * streak in the top bar, so this page deliberately goes one level deeper:
 * the ladder, the week grid, the XP ledger, quiz history and module mastery.
 *
 * Every number on this page is derived from real activity in the store.
 * Nothing is hardcoded and nothing claims real-world social impact.
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Pencil,
  Check,
  X,
  Flame,
  ArrowRight,
  HardDrive,
  RotateCcw,
  LogOut,
  Target,
  History,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { useStore, useActions } from '../lib/store.jsx'
import {
  Card,
  SectionHeading,
  ProgressBar,
  StatStrip,
  LevelSeal,
  Pill,
  Modal,
  EmptyState,
  DisclaimerNote,
  Button,
  Sigil,
  Monogram,
} from '../components/ui/index.jsx'
import { BADGES, LEVELS, levelNumber } from '../lib/gamification.js'
import { MODULES, getModuleById } from '../data/modules.js'
import { formatRelative, formatNumber } from '../lib/dates.js'

const EASE = [0.16, 1, 0.3, 1]
const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.28, ease: EASE, delay },
})

/* -------------------------------------------------------------------- page */
export default function Profile() {
  const {
    profile,
    level,
    impact,
    stats,
    week,
    streak,
    ledger,
    quizHistory,
    ownedBadges,
    backend,
    cloud,
  } = useStore()
  const { actions } = useActions()
  const nav = useNavigate()

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!profile) return null

  /* The derived badge set is authoritative; `impact.badges` only counts the ids
     already written to storage, so take whichever is further along. */
  const badgesEarned = Math.max(impact.badges, ownedBadges.length)
  const recentLedger = ledger.slice(0, 8)
  const recentQuizzes = quizHistory.slice(0, 8)

  /* --------------------------------------------------------------- actions */
  const startEdit = () => {
    setDraft(profile.name)
    setEditing(true)
  }

  const saveName = async () => {
    const next = draft.trim()
    if (next.length < 2) {
      actions.pushToast({ title: 'Name not changed', body: 'Use at least 2 characters.' })
      setEditing(false)
      return
    }
    setEditing(false)
    if (next === profile.name) return
    await actions.updateProfile({ name: next })
    actions.pushToast({ title: 'Name updated', body: `You are now ${next}.`, tone: 'electric' })
  }

  const doReset = async () => {
    setBusy(true)
    try {
      await actions.resetProgress()
      setConfirmOpen(false)
    } finally {
      setBusy(false)
    }
  }

  const doSignOut = async () => {
    setBusy(true)
    try {
      await actions.logout()
      nav('/')
    } finally {
      setBusy(false)
    }
  }

  /* -------------------------------------------------------------- sections */

  /* 2 — impact: one unboxed strip, no container, no cards */
  const impactStrip = (
    <StatStrip
      items={[
        { label: 'Lessons', value: impact.lessonsCompleted },
        {
          label: 'Quiz accuracy',
          value: impact.quizAccuracy,
          suffix: '%',
          tone: impact.quizAccuracy >= 80 ? 'good' : impact.quizAccuracy < 40 ? 'warn' : undefined,
        },
        { label: 'Modules', value: impact.modulesDone, suffix: `/${impact.modulesTotal}` },
        { label: 'Day streak', value: impact.streak, tone: impact.streak >= 3 ? 'warn' : undefined },
        { label: 'Badges', value: badgesEarned, tone: 'xp' },
      ]}
    />
  )

  /* 3 — the ladder. A level is a seal, not a headline. */
  const ladder = (
    <Card className="p-4 sm:p-5">
      <ol className="divide-y divide-white/[0.05]">
        {LEVELS.map((l) => {
          const isCurrent = l.level === level.level
          const done = l.level < level.level
          const locked = l.level > level.level
          const need = Math.max(0, l.min - level.xp)

          return (
            <li key={l.level} className={`flex items-center gap-3 py-3 ${locked ? 'opacity-55' : ''}`}>
              {isCurrent ? (
                <LevelSeal
                  number={levelNumber(l.level)}
                  name={l.name}
                  sub={`${formatNumber(need)} XP to Level ${levelNumber(l.level + 1)}`}
                />
              ) : (
                <>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl">
                    {done ? (
                      <Check size={16} strokeWidth={3} className="text-good" />
                    ) : (
                      <span className="num text-fg-faint">{levelNumber(l.level)}</span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="t3 truncate">{l.name}</div>
                    <div className="caption tnum">
                      {formatNumber(l.min)} XP {locked ? 'required' : 'to unlock'}
                    </div>
                  </div>
                  {locked ? (
                    <span className="caption tnum shrink-0">+{formatNumber(need)} XP</span>
                  ) : (
                    <Pill tone="good" className="shrink-0">
                      Complete
                    </Pill>
                  )}
                </>
              )}
            </li>
          )
        })}
      </ol>
    </Card>
  )

  /* 4 — the streak week as quiet one-line cells */
  const streakWeek = (
    <Card className="p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="eyebrow">This week</div>
        <span className="caption tnum">
          {week.filter((d) => d.done).length} of {week.length} days
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {week.map((d) => (
          <div key={d.date} className="flex min-w-0 flex-col items-center gap-1.5">
            <div className="flex items-center gap-1.5" title={d.date}>
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  d.done ? 'bg-warn' : d.future ? 'bg-white/[0.08]' : 'bg-white/[0.18]'
                }`}
                aria-hidden="true"
              />
              <span className="num text-fg-dim">{d.day}</span>
            </div>
            <span className="eyebrow">{d.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2 border-t border-white/[0.06] pt-3">
        <div className="flex items-center justify-between gap-3 text-body">
          <span className="text-fg-muted">Longest streak</span>
          <span className="num">
            {streak.longest} day{streak.longest === 1 ? '' : 's'}
          </span>
        </div>
        <p className="caption">
          A day counts once you complete any lesson, scenario, quiz or daily challenge. The streak
          breaks if a full day passes with nothing done.
        </p>
      </div>
    </Card>
  )

  /* 5 — XP ledger: a flat list, not a timeline of cards */
  const ledgerList = recentLedger.length ? (
    <ul className="divide-y divide-white/[0.05]">
      {recentLedger.map((e) => (
        <li key={e.id} className="flex items-center gap-4 py-3">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-body font-semibold text-fg">{e.reason}</span>
            <span className="caption">{formatRelative(e.at)}</span>
          </span>
          <span className="num shrink-0 text-xp-300">+{formatNumber(e.amount)}</span>
        </li>
      ))}
    </ul>
  ) : (
    <EmptyState
      icon={History}
      title="No activity yet"
      body="Complete your first scenario to see your activity here."
      action={
        <Button as={Link} to="/learn" variant="primary" size="sm" iconRight={ArrowRight}>
          Open the first module
        </Button>
      }
    />
  )

  /* 6 — quiz history: flat list */
  const quizList = recentQuizzes.length ? (
    <ul className="divide-y divide-white/[0.05]">
      {recentQuizzes.map((q, i) => {
        const m = getModuleById(q.moduleId)
        const pct = q.total ? Math.round((q.score / q.total) * 100) : 0
        return (
          <li key={`${q.moduleId}-${q.at}-${i}`} className="flex items-center gap-3 py-3">
            <Sigil id={q.moduleId} size={16} className="shrink-0 text-fg-dim" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-body font-semibold text-fg">{m?.name || q.moduleId}</div>
              <div className="caption">
                {q.score}/{q.total} correct · {formatRelative(q.at)}
              </div>
            </div>
            <span className={`num shrink-0 ${pct >= 80 ? 'text-good' : 'text-fg-muted'}`}>{pct}%</span>
          </li>
        )
      })}
    </ul>
  ) : (
    <EmptyState
      icon={Target}
      title="No quizzes taken yet"
      body="Finish the quiz at the end of any module and your score history builds here."
    />
  )

  /* 7 — module mastery: one flat list, one sigil per row */
  const masteryList = (
    <ul className="divide-y divide-white/[0.05]">
      {MODULES.map((m) => {
        const s = stats[m.id] || {}
        const pct = s.pct || 0
        return (
          <li key={m.id} className="py-3">
            <div className="flex items-center gap-3">
              <Sigil id={m.id} size={16} className="shrink-0 text-fg-dim" />
              <span className="t3 min-w-0 flex-1 truncate">{m.name}</span>
              {s.completed ? (
                <Pill tone="good" className="shrink-0">
                  Complete
                </Pill>
              ) : (
                <span className="num shrink-0 text-fg-dim">{pct}%</span>
              )}
            </div>
            {/* A static track: only one bar on this screen is allowed to move. */}
            <div className="mt-2 flex items-center gap-3 pl-7">
              <span className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-white/[0.09]">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: s.completed ? '#22C55E' : '#4D7CFE',
                  }}
                />
              </span>
              <span className="caption tnum shrink-0">
                {s.lessonsRead || 0}/{s.lessonTotal || 0} lessons
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )

  /* ------------------------------------------------------------------ page */
  return (
    <div className="mx-auto max-w-[900px] space-y-10 pb-4">
      {/* ------------------------------------------------ 1. header card */}
      <motion.div {...rise(0)}>
        <Card className="p-4 sm:p-5">
          <div className="flex flex-wrap items-start gap-4">
            <Monogram name={profile.name} size="lg" title={profile.name} />

            <div className="min-w-0 flex-1">
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveName()
                      if (e.key === 'Escape') setEditing(false)
                    }}
                    aria-label="Edit your name"
                    className="pressable w-full max-w-xs px-3 py-2 text-body font-semibold text-fg outline-none focus:ring-2 focus:ring-inset focus:ring-electric-500/50"
                  />
                  <button
                    onClick={saveName}
                    aria-label="Save name"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-good/15 text-good transition-colors hover:bg-good/25"
                  >
                    <Check size={16} strokeWidth={2.6} />
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    aria-label="Cancel"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-fg-dim transition-colors hover:bg-white/10 hover:text-fg"
                  >
                    <X size={16} strokeWidth={2.4} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="t1 truncate">{profile.name}</h1>
                  <button
                    onClick={startEdit}
                    aria-label="Edit your name"
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-fg-dim transition-colors hover:bg-white/10 hover:text-fg"
                  >
                    <Pencil size={13} strokeWidth={2.2} />
                  </button>
                </div>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                <LevelSeal
                  number={levelNumber(level.level)}
                  name={level.name}
                  sub={`${formatNumber(level.xp)} XP`}
                />
                {profile.isDemo && <Pill tone="electric">Demo account</Pill>}
                {profile.college && <Pill>{profile.college}</Pill>}
              </div>

              <div className="mt-4">
                <ProgressBar
                  value={level.isMax ? 100 : level.pct}
                  variant="xp"
                  showLabel
                  label={
                    level.isMax
                      ? 'Maximum level reached'
                      : `Level ${levelNumber(level.level)} to Level ${levelNumber(level.next.level)}`
                  }
                />
                <p className="caption mt-2">
                  {level.isMax
                    ? 'You have reached the top of the ladder.'
                    : `${formatNumber(level.toNext)} XP to Level ${levelNumber(level.next.level)} — ${level.next.name}.`}
                </p>
                <p className="caption mt-1">
                  {impact.journeyPct}% of your legal journey completed — the share of all module
                  lessons, scenarios and quiz questions you have finished, across {impact.modulesTotal}{' '}
                  modules.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* -------------------------------------------------- 2. your impact */}
      <section>
        <SectionHeading
          eyebrow="Your impact"
          title="What you have actually done"
          sub="Counted from your own activity on this device — nothing here is estimated."
        />
        {impactStrip}
        <p className="caption mt-4">
          {impact.quizzesTaken} quiz{impact.quizzesTaken === 1 ? '' : 'zes'} submitted · longest streak{' '}
          {streak.longest} day{streak.longest === 1 ? '' : 's'} · {badgesEarned} of {BADGES.length} badges
          available.
        </p>
      </section>

      {/* ------------------------------------------------ 3. level ladder */}
      <section>
        <SectionHeading
          eyebrow="Progression"
          title="The eight levels"
          sub="Each level opens a new set of badges and a bigger XP band."
        />
        {ladder}
      </section>

      {/* ----------------------------------------------- 4. streak panel */}
      <section>
        <SectionHeading
          eyebrow="Consistency"
          title="Your streak"
          sub="One lesson a day is enough. The point is to keep the habit, not to grind."
        />
        <div className="grid gap-4 sm:grid-cols-[minmax(0,200px)_minmax(0,1fr)]">
          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-warn/[0.10]">
                {/* Gated like the top-bar chip: a flame that breathes on a 0- or
                    1-day streak is nagging, and motion on a mark is banned anyway. */}
                <Flame
                  size={18}
                  strokeWidth={2.2}
                  className={`text-warn ${(impact.streak ?? 0) >= 2 ? 'animate-flame' : ''}`}
                />
              </span>
              <div className="min-w-0">
                <div className="eyebrow">Current streak</div>
                <div className={`num-lg mt-0.5 ${impact.streak >= 3 ? 'text-warn' : ''}`}>
                  {impact.streak}
                </div>
              </div>
            </div>
          </Card>
          {streakWeek}
        </div>
      </section>

      {/* -------------------------------------------- 5. XP ledger */}
      <section>
        <SectionHeading
          eyebrow="XP ledger"
          title="Recent activity"
          sub="The last 8 XP awards, newest first. This is the complete record on this device."
        />
        {ledgerList}
      </section>

      {/* -------------------------------------------- 6. quiz history */}
      <section>
        <SectionHeading
          eyebrow="Quiz history"
          title="How you scored"
          sub="Every quiz you have submitted, with the module it belongs to."
        />
        {quizList}
      </section>

      {/* ------------------------------------------- 7. module mastery */}
      <section>
        <SectionHeading
          eyebrow="Module mastery"
          title="Where you stand across all 8 modules"
          sub="Each bar blends that module's lessons, scenarios and quiz."
        />
        {masteryList}
      </section>

      {/* ------------------------------------------ 8. account & data */}
      <section>
        <SectionHeading eyebrow="Account & data" title="Where your progress lives" />
        <Card className="p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={cloud ? 'electric' : 'default'}>
                  {backend} · {cloud ? 'Supabase cloud row' : 'local only'}
                </Pill>
                <Pill>No payment data collected</Pill>
              </div>
              <p className="copy measure mt-3">
                {cloud
                  ? 'A Supabase project is configured, so your progress is written to one private cloud row and mirrored in this browser for instant loading. If the cloud is unreachable the app falls back to local storage and says so.'
                  : 'Everything above is stored in this browser only, on this device, under a single LawLink key. Nothing is uploaded, there is no account server, and clearing site data or switching device starts a fresh journey.'}
              </p>
              <p className="caption measure mt-2">
                Resetting clears XP, streaks, badges, quiz history and module progress but keeps your
                name. Signing out removes the account from this device entirely.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button variant="danger" size="sm" icon={RotateCcw} onClick={() => setConfirmOpen(true)}>
                Reset all progress
              </Button>
              <Button variant="ghost" size="sm" icon={LogOut} loading={busy} onClick={doSignOut}>
                Sign out
              </Button>
            </div>
          </div>

          <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} size="sm">
            <div className="p-5 sm:p-6">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-danger/[0.10]">
                <AlertTriangle size={20} className="text-danger" strokeWidth={2.2} />
              </div>
              <h3 className="t2 mt-4">Reset all progress?</h3>
              <p className="copy mt-2">
                This clears {formatNumber(impact.xp)} XP, your {impact.streak}-day streak, {badgesEarned}{' '}
                {badgesEarned === 1 ? 'badge' : 'badges'}, every quiz score and all module progress. It
                cannot be undone.
              </p>
              <div className="mt-5 space-y-2">
                <Button variant="danger" className="w-full" loading={busy} icon={RotateCcw} onClick={doReset}>
                  Yes, reset everything
                </Button>
                <Button variant="quiet" className="w-full" onClick={() => setConfirmOpen(false)}>
                  Keep my progress
                </Button>
              </div>
            </div>
          </Modal>
        </Card>
      </section>

      {/* ---------------------------------------------------- 9. disclaimer */}
      <div className="space-y-3 border-t border-white/[0.05] pt-8">
        <DisclaimerNote />
        <p className="flex items-start gap-2 text-caption leading-relaxed text-fg-dim">
          <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-fg-faint" strokeWidth={2.2} />
          Every number on this page comes from activity recorded on this device. LawLink is legal
          awareness and education only — it does not measure real-world outcomes and it is not legal
          advice.
        </p>
        <p className="flex items-start gap-2 text-caption leading-relaxed text-fg-dim">
          <XCircle size={13} className="mt-0.5 shrink-0 text-fg-faint" strokeWidth={2.2} />
          Badges shown as available are not yet earned — this page never claims progress you have not
          made.
        </p>
      </div>
    </div>
  )
}
