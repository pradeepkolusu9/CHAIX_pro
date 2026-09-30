import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

import {
  Button,
  Card,
  Monogram,
  Panel,
  Pill,
  ProgressBar,
  SectionHeading,
  StatStrip,
  Tabs,
  formatNumber,
  resolveHues,
} from '../components/ui/index.jsx'
import { useStore } from '../lib/store.jsx'
import { podiumClass, buildBoard, TABS } from '../data/leaderboard.js'
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

/* --------------------------------------------------------------- podium card */
function PodiumCard({ row, reduce }) {
  const isYou = row.isYou
  const height =
    row.rank === 1 ? 'sm:pb-9' : row.rank === 2 ? 'sm:mt-8 sm:pb-7' : 'sm:mt-16 sm:pb-5'
  const order = row.rank === 1 ? 'sm:order-2' : row.rank === 2 ? 'sm:order-1' : 'sm:order-3'

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 22 },
        show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.34, ease: EASE } },
      }}
      className={`sheet relative flex flex-col items-center gap-2.5 p-4 text-center ${height} ${order} ${
        // first place carries the one permitted gradient on this screen
        row.rank === 1 ? 'sheet-focal' : ''
      } ${isYou ? 'ring-1 ring-inset ring-electric-500/40' : ''}`}
    >
      {row.rank === 1 && (
        <span className="chip-xp absolute -top-2.5 left-1/2 -translate-x-1/2">Leader</span>
      )}

      <div
        className={`grid h-9 w-9 place-items-center rounded-full bg-gradient-to-b text-sm font-extrabold tabular-nums ${podiumClass(
          row.rank,
        )}`}
      >
        {row.rank}
      </div>

      <Monogram name={row.name} userId={row.id} hue={row.hue} size="lg" />

      <div className="min-w-0 max-w-full">
        <div className="flex items-center justify-center gap-1.5">
          <span className="t3 truncate">{isYou ? 'You' : row.name}</span>
          {isYou && <span className="chip-electric shrink-0">YOU</span>}
        </div>
        <div className="caption mt-0.5 truncate">{row.college}</div>
      </div>

      <div className="mt-auto flex items-baseline gap-1 pt-1">
        <span className="num-lg text-xp-300">{formatNumber(row.xp)}</span>
        <span className="eyebrow">XP</span>
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
      className={`flex items-center gap-3 px-3 py-3 sm:px-4 ${
        isYou ? 'border-l-[3px] border-l-electric-400 bg-electric-500/[0.12]' : 'border-l-[3px] border-l-transparent'
      }`}
    >
      <span className={`num w-7 shrink-0 text-center ${row.rank === 1 ? 'text-fg' : 'text-fg-dim'}`}>
        {row.rank}
      </span>

      <Monogram name={row.name} userId={row.id} hue={row.hue} size="sm" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={`t3 truncate ${isYou ? 'text-white' : ''}`}>
            {isYou ? 'You' : row.name}
          </span>
          {isYou && <span className="chip-electric shrink-0">YOU</span>}
        </div>
        <div className="caption truncate">{row.college}</div>
      </div>

      <div className="shrink-0 text-right">
        <div className={`num ${isYou ? 'text-xp-300' : ''}`}>{formatNumber(row.xp)}</div>
        <div className="eyebrow">XP</div>
      </div>
    </motion.div>
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
      className="space-y-6"
    >
      <SectionHeading
        eyebrow="This week"
        title="Leaderboard"
        sub="The other learners are seeded demo learners. Your row is your real progress on this device."
        action={<Pill tone="xp">{formatNumber(level.xp)} XP · Level {levelNumber(level.level)}</Pill>}
      />

      {/* tabs ---------------------------------------------------------- */}
      <div className="space-y-1.5">
        <Tabs tabs={TABS} value={tab} onChange={setTab} />
        <p className="caption px-1">{tabHint} · {board.total} learners on this board</p>
      </div>

      {/* your position — the focal surface */}
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0 : 0.34, ease: EASE }}
      >
        <Panel className="p-4 sm:p-5">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="shrink-0 text-center">
              <div className="eyebrow mb-1">Your position</div>
              <div className="relative h-[38px] w-[84px] sm:h-[42px] sm:w-[104px]">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={you?.rank ?? 0}
                    initial={reduce ? false : { y: -14, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={reduce ? undefined : { y: 14, opacity: 0 }}
                    transition={{ duration: reduce ? 0 : 0.24, ease: EASE }}
                    className="num-lg"
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
                <span className="chip-xp">Level {levelNumber(level.level)} · {level.name}</span>
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
                <p className="caption mt-3">
                  Top level reached — Legal Master. Nothing above you on the ladder.
                </p>
              )}
            </div>
          </div>
        </Panel>
      </motion.section>

      {/* the supporting figures — unboxed, on the canvas */}
      <StatStrip
        items={[
          { label: 'Total XP', value: formatNumber(level.xp), tone: 'xp' },
          { label: 'Level', value: levelNumber(level.level), suffix: ` · ${level.name}` },
          // Was labelled "Ahead of you" while carrying `belowCount` — the learners
          // BEHIND you. It contradicted the hero line 300px above it, which
          // correctly reads "You are ahead of 9 learners".
          { label: 'Behind you', value: formatNumber(belowCount) },
          {
            label: level.isMax ? 'To next level' : 'XP to next level',
            value: formatNumber(level.toNext),
          },
        ]}
      />

      {/* podium -------------------------------------------------------- */}
      <section>
        <SectionHeading eyebrow="Top of the board" title="Podium" sub="Ranked by XP on this board." />
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: reduce ? 0 : 0.08, delayChildren: 0.04 } },
          }}
          className="flex flex-col gap-3 sm:grid sm:grid-cols-3 sm:items-end"
        >
          {top.map((row) => (
            <PodiumCard key={row.id} row={row} reduce={reduce} />
          ))}
        </motion.div>
      </section>

      {/* full list — flat, no container ---------------------------------- */}
      <section>
        <SectionHeading
          eyebrow="Full ranking"
          title="Every learner"
          sub={you && you.rank > 10 ? 'Your row is pinned at the bottom so you can always find it.' : undefined}
        />
        <motion.div
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: reduce ? 0 : 0.04 } },
          }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.08 }}
          className="divide-y divide-white/[0.05]"
        >
          {rows.map((row) => (
            <LeaderboardRow key={row.id} row={row} reduce={reduce} />
          ))}
        </motion.div>

        {you && you.rank > 10 && (
          <div className="sticky bottom-[76px] z-10 mt-2 sm:bottom-3">
            <div className="sheet overflow-hidden rounded-2xl">
              <div className="flex items-center justify-between gap-2 px-3 pt-2.5 sm:px-4">
                <span className="eyebrow text-electric-300">Your position</span>
                <span className="caption">Pinned — you are outside the top 10</span>
              </div>
              <LeaderboardRow row={you} standalone reduce={reduce} />
            </div>
          </div>
        )}
      </section>

      {/* honest note --------------------------------------------------- */}
      <p className="copy measure">
        Seeded learners are demo data. Your row is your real progress on this device. The{' '}
        <span className="font-semibold text-fg-muted">My College</span> tab filters to your own
        institution, and <span className="font-semibold text-fg-muted">All India</span> shows every
        learner on LawLink.
      </p>

      {/* xp rules ------------------------------------------------------ */}
      <Card className="p-4 sm:p-5">
        <div className="eyebrow mb-2">How to earn XP</div>
        <h3 className="t3">Every point in LawLink</h3>
        <p className="copy measure mt-1">
          XP is awarded automatically the moment you finish something. Nothing here is random.
        </p>

        <ul className="mt-4 divide-y divide-white/[0.05]">
          {XP_SOURCES.map((src) => (
            <li key={src.key} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <div className="t3 truncate text-fg-muted">{src.label}</div>
                <div className="caption truncate">{src.note}</div>
              </div>
              <div className="num shrink-0 text-xp-300">+{formatNumber(XP_RULES[src.key])}</div>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button as={Link} to="/journey" size="sm" iconRight={ArrowRight}>
            Earn XP now
          </Button>
          <Button as={Link} to="/achievements" variant="ghost" size="sm">
            See your badges
          </Button>
          <span className="caption">Level names come from the same XP table</span>
          <span className="caption">Your rank updates the moment you earn XP</span>
        </div>
      </Card>
    </motion.div>
  )
}
