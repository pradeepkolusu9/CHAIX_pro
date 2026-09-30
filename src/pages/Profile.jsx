/**
 * Profile — /profile
 * Header + level seal, then two columns: stats and level ladder (left), streak,
 * XP ledger, quiz history and module mastery (right). Danger zone last.
 * Every number is derived from real activity in the store.
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
  RotateCcw,
  LogOut,
  Target,
  History,
  AlertTriangle,
  Lock,
  Zap,
} from 'lucide-react'
import { useStore, useActions } from '../lib/store.jsx'
import {
  SectionHeading,
  ProgressBar,
  StatStrip,
  Pill,
  Modal,
  EmptyState,
  DisclaimerNote,
  Button,
  Sigil,
  Monogram,
  IconBadge,
} from '../components/ui/index.jsx'
import { BADGES, LEVELS, levelNumber } from '../lib/gamification.js'
import { MODULES, getModuleById } from '../data/modules.js'
import { formatRelative, formatNumber } from '../lib/dates.js'
import { toneFor } from '../lib/moduleTone.js'

const EASE = [0.16, 1, 0.3, 1]
const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: EASE, delay },
})

const fieldCls =
  'pressable w-full px-3 py-2 text-body font-semibold text-fg outline-none focus:ring-2 focus:ring-inset focus:ring-electric-500/50'

export default function Profile() {
  const { profile, level, impact, stats, week, streak, ledger, quizHistory, ownedBadges, backend, cloud } = useStore()
  const { actions } = useActions()
  const nav = useNavigate()

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [collegeDraft, setCollegeDraft] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!profile) return null

  /* The derived badge set is authoritative; take whichever is further along. */
  const badgesEarned = Math.max(impact.badges, ownedBadges.length)
  const recentLedger = ledger.slice(0, 8)
  const recentQuizzes = quizHistory.slice(0, 8)
  const levelPct = level.isMax ? 100 : Math.round(((level.into || 0) / (level.span || 1)) * 100)

  const startEdit = () => {
    setDraft(profile.name)
    setCollegeDraft(profile.college || '')
    setEditing(true)
  }

  const saveProfile = async () => {
    const next = draft.trim()
    const college = collegeDraft.trim()
    setEditing(false)
    const patch = {}
    if (next.length < 2) actions.pushToast({ title: 'Name not changed', body: 'Use at least 2 characters.' })
    else if (next !== profile.name) patch.name = next
    if (college !== (profile.college || '')) patch.college = college
    if (!Object.keys(patch).length) return
    await actions.updateProfile(patch)
    actions.pushToast({
      title: 'Profile updated',
      body: patch.name ? `You are now ${next}.` : 'College saved.',
      tone: 'electric',
    })
  }

  const onKey = (e) => {
    if (e.key === 'Enter') saveProfile()
    if (e.key === 'Escape') setEditing(false)
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

  return (
    <div className="mx-auto max-w-[1180px] space-y-12 pb-6">
      {/* ------------------------------------------------ header */}
      <motion.div {...rise(0)} className="sheet-lg sheet-focal p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <Monogram name={profile.name} size="xl" className="!h-24 !w-24 !text-[34px]" />
          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="flex flex-col gap-2 sm:max-w-md">
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={onKey}
                  aria-label="Edit your name"
                  className={fieldCls}
                />
                <input
                  value={collegeDraft}
                  onChange={(e) => setCollegeDraft(e.target.value)}
                  onKeyDown={onKey}
                  placeholder="College"
                  aria-label="Edit your college"
                  className={fieldCls}
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="primary" icon={Check} onClick={saveProfile} aria-label="Save profile">
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" icon={X} onClick={() => setEditing(false)} aria-label="Cancel">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1">
                  <h1 className="t1 truncate">{profile.name}</h1>
                  <button
                    onClick={startEdit}
                    aria-label="Edit your name"
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-fg-dim transition-colors hover:bg-electric-500/10 hover:text-electric-300"
                  >
                    <Pencil size={15} strokeWidth={2.2} />
                  </button>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {profile.college && <Pill>{profile.college}</Pill>}
                  {profile.isDemo && <Pill tone="electric">Demo account</Pill>}
                </div>
              </>
            )}
            <div className="mt-5 max-w-md">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="caption">
                  {level.isMax ? 'Maximum level reached' : `${formatNumber(level.toNext)} XP to ${level.next.name}`}
                </span>
                <span className="eyebrow tnum">{levelPct}%</span>
              </div>
              <ProgressBar value={levelPct} variant="xp" />
              <p className="caption mt-2">
                {impact.journeyPct}% of your legal journey done, across {impact.modulesTotal} modules.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 sm:flex-col sm:text-center">
            <div className="tile tile-violet h-20 w-20 rounded-[28px]">
              <span className="num-xl leading-none text-violet2-300">{levelNumber(level.level)}</span>
            </div>
            <div>
              <div className="eyebrow">Level</div>
              <div className="t3">{level.name}</div>
              <div className="caption tnum">{formatNumber(level.xp)} XP</div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-x-12 gap-y-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* ---------------------------------------------- left */}
        <div className="space-y-12">
          <motion.section {...rise(0.05)}>
            <SectionHeading eyebrow="Your impact" title="What you have done" sub="Counted from your own activity on this device." />
            <StatStrip
              items={[
                { label: 'Lessons', value: impact.lessonsCompleted },
                {
                  label: 'Lifetime accuracy',
                  value: impact.quizAnswered ? impact.quizAccuracy : '—',
                  suffix: impact.quizAnswered ? '%' : undefined,
                  tone: !impact.quizAnswered ? undefined : impact.quizAccuracy >= 80 ? 'good' : impact.quizAccuracy < 40 ? 'warn' : undefined,
                },
                { label: 'Modules', value: impact.modulesDone, suffix: `/${impact.modulesTotal}` },
                { label: 'Badges', value: badgesEarned, tone: 'xp' },
              ]}
            />
            <p className="caption mt-4">
              {impact.quizzesTaken} quiz{impact.quizzesTaken === 1 ? '' : 'zes'} submitted, {impact.quizCorrect} of {impact.quizAnswered} answers right, {badgesEarned} of {BADGES.length} badges.
            </p>
          </motion.section>

          <motion.section {...rise(0.1)}>
            <SectionHeading eyebrow="Progression" title="The eight levels" />
            <ol className="relative">
              <span aria-hidden="true" className="absolute bottom-8 left-[21px] top-8 w-0.5 rounded-full bg-electric-500/15" />
              {LEVELS.map((l) => {
                const isCurrent = l.level === level.level
                const done = l.level < level.level
                const need = Math.max(0, l.min - level.xp)
                return (
                  <li key={l.level} className={`relative flex items-center gap-4 rounded-2xl py-2 ${isCurrent ? 'inset' : ''}`}>
                    <span className={`tile h-11 w-11 rounded-xl ${done ? 'tile-good' : isCurrent ? 'tile-violet' : 'tile-muted'}`}>
                      {done ? <Check size={18} strokeWidth={3} /> : <span className="num">{levelNumber(l.level)}</span>}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="t3 truncate">{l.name}</div>
                      <div className="caption tnum">{formatNumber(l.min)} XP</div>
                    </div>
                    {isCurrent ? (
                      <Pill tone="electric" className="mr-3 shrink-0">You are here</Pill>
                    ) : done ? (
                      <Pill tone="good" className="shrink-0">Done</Pill>
                    ) : (
                      <span className="caption tnum flex shrink-0 items-center gap-1">
                        <Lock size={12} />+{formatNumber(need)}
                      </span>
                    )}
                  </li>
                )
              })}
            </ol>
          </motion.section>
        </div>

        {/* --------------------------------------------- right */}
        <div className="space-y-12">
          <motion.section {...rise(0.08)}>
            <SectionHeading eyebrow="Consistency" title="Your streak" sub="One lesson a day is enough." />
            <div className="sheet p-5 sm:p-6">
              <div className="flex items-center gap-4">
                <IconBadge icon={Flame} tone="warn" size="lg" />
                <div>
                  <div className={`num-lg ${impact.streak >= 3 ? 'text-warn' : ''}`}>
                    {impact.streak} <span className="caption">day{impact.streak === 1 ? '' : 's'}</span>
                  </div>
                  <div className="caption">
                    Longest {streak.longest} day{streak.longest === 1 ? '' : 's'} · {week.filter((d) => d.done).length} of {week.length} this week
                  </div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-7 gap-1.5">
                {week.map((d) => (
                  <div key={d.date} title={d.date} className="flex min-w-0 flex-col items-center gap-1.5">
                    <span
                      className={`grid aspect-square w-full max-w-[40px] min-w-0 place-items-center rounded-full ${
                        d.done ? 'tile tile-warn' : d.future ? 'bg-white/[0.05]' : 'bg-white/[0.12]'
                      }`}
                    >
                      {d.done ? <Flame size={16} strokeWidth={2.2} /> : <span className="num text-fg-dim">{d.day}</span>}
                    </span>
                    <span className="eyebrow">{d.label}</span>
                  </div>
                ))}
              </div>
              <p className="caption mt-4">A day counts once you finish any lesson, scenario, quiz or daily challenge.</p>
            </div>
          </motion.section>

          <motion.section {...rise(0.12)}>
            <SectionHeading eyebrow="XP ledger" title="Recent activity" />
            {recentLedger.length ? (
              <ul className="sheet divide-y divide-white/[0.06] px-5">
                {recentLedger.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 py-3">
                    <IconBadge icon={Zap} tone="xp" size="sm" />
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
            )}
          </motion.section>

          <motion.section {...rise(0.16)}>
            <SectionHeading eyebrow="Quiz history" title="How you scored" />
            {recentQuizzes.length ? (
              <ul className="sheet divide-y divide-white/[0.06] px-5">
                {recentQuizzes.map((q, i) => {
                  const m = getModuleById(q.moduleId)
                  const pct = q.total ? Math.round((q.score / q.total) * 100) : 0
                  return (
                    <li key={`${q.moduleId}-${q.at}-${i}`} className="flex items-center gap-3 py-3">
                      <span className={`tile tile-${toneFor(q.moduleId)} h-10 w-10 rounded-xl`}>
                        <Sigil id={q.moduleId} size={18} />
                      </span>
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
              <EmptyState icon={Target} title="No quizzes taken yet" body="Finish a module quiz and your scores build here." />
            )}
          </motion.section>

          <motion.section {...rise(0.2)}>
            <SectionHeading eyebrow="Module mastery" title="Across all 8 modules" />
            <ul className="sheet space-y-4 p-5">
              {MODULES.map((m) => {
                const s = stats[m.id] || {}
                const pct = s.pct || 0
                return (
                  <li key={m.id} className="flex items-center gap-3">
                    <span className={`tile tile-${toneFor(m.id)} h-10 w-10 rounded-xl`}>
                      <Sigil id={m.id} size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="t3 truncate">{m.name}</span>
                        {s.completed ? (
                          <Pill tone="good" className="shrink-0">Complete</Pill>
                        ) : (
                          <span className="num shrink-0 text-fg-dim">{pct}%</span>
                        )}
                      </div>
                      <div className="mt-1.5 flex items-center gap-3">
                        <div className="track h-1.5">
                          <div className={s.completed ? 'track-fill-good' : 'track-fill'} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="caption tnum shrink-0">
                          {s.lessonsRead || 0}/{s.lessonTotal || 0}
                        </span>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </motion.section>
        </div>
      </div>

      {/* ------------------------------------------ danger zone */}
      <section className="rounded-[28px] bg-danger/[0.04] p-6 ring-1 ring-inset ring-danger/15 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="eyebrow !text-danger">Account and data</div>
            <h2 className="t2 mt-2">Danger zone</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Pill tone={cloud ? 'electric' : 'default'}>
                {backend} · {cloud ? 'Supabase cloud row' : 'local only'}
              </Pill>
              <Pill>No payment data collected</Pill>
            </div>
            <p className="copy measure mt-3">
              {cloud
                ? 'Progress is written to one private cloud row and mirrored in this browser. If the cloud is unreachable the app falls back to local storage and says so.'
                : 'Your progress and account data are stored in this browser only, and clearing site data or switching device starts a fresh journey.'}
            </p>
            <p className="caption measure mt-2">
              Resetting clears XP, streaks, badges, quiz history and module progress but keeps your name. Signing out removes the account from this device.
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
            <IconBadge icon={AlertTriangle} tone="danger" size="md" />
            <h3 className="t2 mt-4">Reset all progress?</h3>
            <p className="copy mt-2">
              This clears {formatNumber(impact.xp)} XP, your {impact.streak}-day streak, {badgesEarned}{' '}
              {badgesEarned === 1 ? 'badge' : 'badges'}, every quiz score and all module progress. It cannot be undone.
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
      </section>

      <DisclaimerNote />
    </div>
  )
}
