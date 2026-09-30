import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Info } from 'lucide-react'

import {
  Button,
  Card,
  Monogram,
  Panel,
  Pill,
  ProgressBar,
  SectionHeading,
  formatNumber,
  resolveHues,
} from '../components/ui/index.jsx'
import { useStore } from '../lib/store.jsx'
import { buildBoard, TABS } from '../data/leaderboard.js'
import { XP_RULES, levelNumber } from '../lib/gamification.js'
import { useReducedMotionPref } from '../lib/hooks.js'

const EASE = [0.16, 1, 0.3, 1]

/** Every XP source, straight from the gamification engine. */
const XP_SOURCES = [
  { key: 'lessonRead', label: 'Read a lesson card', note: 'Each short lesson card' },
  { key: 'scenario', label: 'Clear a scenario', note: 'Right or wrong, you learn' },
  { key: 'quizCorrect', label: 'Per correct quiz answer', note: 'Across every module quiz' },
  { key: 'dailyChallenge', label: 'Clear the daily challenge', note: 'One per day' },
  { key: 'sixtySecond', label: 'Clear the 60-second challenge', note: 'Fast rights revision' },
  { key: 'topicComplete', label: 'Complete a module', note: 'First pass at 80%+' },
  { key: 'streakMilestone', label: '7-day streak bonus', note: 'Paid every 7 days' },
]

/* --------------------------------------------------------------- podium */
const PODIUM = {
  1: { block: 'h-28 sm:h-36', tile: 'from-xp-200 to-xp-400', ring: 'ring-xp-500/50', glow: 'shadow-glow-xp', label: '1st' },
  2: { block: 'h-20 sm:h-24', tile: 'from-slate-100 to-slate-300', ring: 'ring-slate-400/50', glow: '', label: '2nd' },
  3: { block: 'h-14 sm:h-16', tile: 'from-amber-200 to-amber-500', ring: 'ring-amber-600/40', glow: '', label: '3rd' },
}

function PodiumStep({ row, reduce }) {
  const p = PODIUM[row.rank]
  const order = row.rank === 1 ? 'order-2' : row.rank === 2 ? 'order-1' : 'order-3'
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 22 },
        show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.34, ease: EASE } },
      }}
      className={`flex min-w-0 flex-col items-center ${order}`}
    >
      <Monogram name={row.name} userId={row.id} hue={row.hue} size={row.rank === 1 ? 'xl' : 'lg'} />
      <div className="mt-2 w-full min-w-0 text-center">
        <div className="t3 truncate">{row.isYou ? 'You' : row.name}</div>
        <div className="caption truncate">{row.college}</div>
      </div>
      <div
        className={`mt-3 flex w-full flex-col items-center justify-start rounded-t-3xl bg-gradient-to-b pt-3 ring-1 ring-inset ${p.tile} ${p.ring} ${p.glow} ${p.block} ${
          row.isYou ? 'outline outline-2 outline-offset-2 outline-electric-500' : ''
        }`}
      >
        <span className="num-lg text-ink-900">{p.label}</span>
        <span className="mt-1 text-caption font-bold tabular-nums text-ink-900">{formatNumber(row.xp)} XP</span>
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------- leaderboard row */
function LeaderboardRow({ row, standalone = false, reduce }) {
  const isYou = row.isYou
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.26, ease: EASE } },
      }}
      initial={standalone ? 'hidden' : undefined}
      animate={standalone ? 'show' : undefined}
      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 sm:px-4 ${
        isYou ? 'bg-electric-500/[0.12] shadow-[inset_0_0_0_1.5px_rgba(61,99,245,0.45)]' : ''
      }`}
    >
      <span className="num w-7 shrink-0 text-center text-fg-dim">{row.rank}</span>
      <Monogram name={row.name} userId={row.id} hue={row.hue} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="t3 truncate">{isYou ? 'You' : row.name}</span>
          {isYou && <span className="chip-electric shrink-0">YOU</span>}
        </div>
        <div className="caption truncate">{row.college}</div>
      </div>
      <div className="shrink-0 text-right">
        <span className={`num ${isYou ? 'text-xp-300' : ''}`}>{formatNumber(row.xp)}</span>{' '}
        <span className="eyebrow">XP</span>
      </div>
    </motion.div>
  )
}

/** Segmented control: three equal pills, active one raised. */
function Segmented({ tabs, value, onChange }) {
  return (
    <div role="tablist" aria-label="Leaderboard scope" className="inline-flex w-full rounded-2xl bg-electric-500/[0.08] p-1 sm:w-auto">
      {tabs.map((t) => {
        const on = t.key === value
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.key)}
            className={`min-h-[44px] flex-1 whitespace-nowrap rounded-xl px-4 font-sans text-body font-semibold transition-all duration-200 sm:flex-none sm:px-6 ${
              on ? 'bg-pure text-electric-300 shadow-sheet' : 'text-fg-dim hover:text-fg'
            }`}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

/* --------------------------------------------------------------------- page */
export default function Leaderboard() {
  const { profile, level } = useStore()
  const [tab, setTab] = useState('weekly')
  const reduce = useReducedMotionPref()

  const board = useMemo(
    () => buildBoard(tab, { xp: level.xp, college: profile?.college, name: profile?.name }),
    [tab, level.xp, profile?.college, profile?.name],
  )

  /* De-collide the avatar hues once, in render order. `board.top` is a prefix of
     `board.rows`, so one pass keeps a person the same colour on the podium and in
     the list. The hash itself is untouched, so they match everywhere else too. */
  const rows = useMemo(() => resolveHues(board.rows), [board])
  const top = rows.slice(0, 3)

  const you = useMemo(() => rows.find((r) => r.isYou) || null, [rows])
  const above = you && you.rank > 1 ? rows[you.rank - 2] : null
  const belowCount = you ? Math.max(0, board.total - you.rank) : 0
  // Rows physically above you. `you.rank - 1` — NOT `board.total - you.rank`,
  // which counts the rows below. Using the wrong one labelled the nine learners
  // behind you as "ahead of you".
  const aheadCount = you ? Math.max(0, you.rank - 1) : 0
  const gap = above ? Math.max(0, above.xp - you.xp) : 0

  const scope =
    tab === 'college' ? 'in your college' : tab === 'global' ? 'across India' : 'this week'
  const learners = belowCount === 1 ? 'learner' : 'learners'
  const tabHint = TABS.find((t) => t.key === tab)?.hint || ''

  const deltaPrimary = above
    ? `${formatNumber(gap)} XP behind ${above.name}`
    : `Nobody above you ${scope} — you are ranked 1st`
  const deltaSecondary = aheadCount
    ? `You are ahead of ${formatNumber(belowCount)} ${learners} ${scope} · ${formatNumber(aheadCount)} to catch.`
    : `Nobody above you ${scope} — you are ranked 1st.`

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.3, ease: EASE }}
      className="space-y-12"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="eyebrow mb-2">Leaderboard</div>
          <h1 className="t1">Who is on top</h1>
          <p className="copy mt-1">{tabHint} · {board.total} learners on this board</p>
        </div>
        <Segmented tabs={TABS} value={tab} onChange={setTab} />
      </div>

      {/* podium -------------------------------------------------------- */}
      <section aria-label="Top three">
        <motion.div
          key={tab}
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: reduce ? 0 : 0.08, delayChildren: 0.04 } },
          }}
          className="mx-auto grid max-w-[640px] grid-cols-3 items-end gap-2 sm:gap-4"
        >
          {top.map((row) => (
            <PodiumStep key={row.id} row={row} reduce={reduce} />
          ))}
        </motion.div>
      </section>

      {/* your position — the focal surface */}
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0 : 0.34, ease: EASE }}
      >
        <Panel className="sheet-focal p-5 sm:p-7">
          <div className="flex items-center gap-5 sm:gap-8">
            <div className="shrink-0 text-center">
              <div className="eyebrow mb-1">Your rank</div>
              <div className="relative h-[60px] w-[84px]">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={you?.rank ?? 0}
                    initial={reduce ? false : { y: -14, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={reduce ? undefined : { y: 14, opacity: 0 }}
                    transition={{ duration: reduce ? 0 : 0.24, ease: EASE }}
                    className="num-xl"
                  >
                    {you?.rank ?? '—'}
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="caption">of {board.total}</div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="num-lg text-xp-300">{formatNumber(level.xp)}</span>
                <span className="eyebrow">XP</span>
                <Pill tone="xp">Level {levelNumber(level.level)} · {level.name}</Pill>
              </div>
              <p className="t3 mt-2">{deltaPrimary}</p>
              <p className="copy mt-0.5">{deltaSecondary}</p>
              {level.next ? (
                <div className="mt-3">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="caption truncate">Next: {level.next.name}</span>
                    <span className="caption shrink-0 font-semibold tabular-nums text-xp-300">
                      {formatNumber(level.toNext)} XP to go
                    </span>
                  </div>
                  <ProgressBar value={level.into} max={level.span} size="sm" variant="xp" />
                </div>
              ) : (
                <p className="caption mt-3">Top level reached — Legal Master.</p>
              )}
            </div>
          </div>
        </Panel>
      </motion.section>

      {/* full list ------------------------------------------------------ */}
      <section>
        <SectionHeading
          eyebrow="Full ranking"
          title="Every learner"
          sub={you && you.rank > 10 ? 'Your row is pinned at the bottom so you can always find it.' : undefined}
        />
        <motion.div
          variants={{ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.04 } } }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.08 }}
          className="space-y-0.5"
        >
          {rows.map((row) => (
            <LeaderboardRow key={row.id} row={row} reduce={reduce} />
          ))}
        </motion.div>

        {you && you.rank > 10 && (
          <div className="sticky bottom-[76px] z-10 mt-3 sm:bottom-3">
            <div className="sheet overflow-hidden rounded-2xl p-1">
              <LeaderboardRow row={you} standalone reduce={reduce} />
            </div>
          </div>
        )}

        <p className="copy measure mt-6 flex items-start gap-2.5">
          <Info size={16} className="mt-1 shrink-0 text-fg-dim" strokeWidth={2.2} />
          <span>
            The other learners here are sample data, not real people. Your row is your real progress on this
            device. <span className="font-semibold text-fg-muted">My College</span> filters to your institution.
          </span>
        </p>
      </section>

      {/* xp rules ------------------------------------------------------ */}
      <Card className="p-5 sm:p-6">
        <div className="eyebrow mb-2">How to earn XP</div>
        <h3 className="t2">Every point in LawLink</h3>
        <p className="copy measure mt-1">XP lands the moment you finish something. Nothing is random.</p>

        <ul className="mt-4 divide-y divide-white/[0.07]">
          {XP_SOURCES.map((src) => (
            <li key={src.key} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <div className="t3 truncate text-fg-muted">{src.label}</div>
                <div className="caption truncate">{src.note}</div>
              </div>
              <span className="chip-xp shrink-0">+{formatNumber(XP_RULES[src.key])}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button as={Link} to="/journey" size="sm" iconRight={ArrowRight}>
            Earn XP now
          </Button>
          <Button as={Link} to="/achievements" variant="ghost" size="sm">
            See your badges
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}
