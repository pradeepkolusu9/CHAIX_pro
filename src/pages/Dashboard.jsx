import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Flame,
  Zap,
  Trophy,
  Timer,
  Play,
  ArrowRight,
  Lock,
  Bot,
  Check,
  Siren,
} from 'lucide-react'
import {
  CardHead,
  ProgressBar,
  StatStrip,
  LevelSeal,
  Pill,
  Button,
  Figure,
  formatNumber,
} from '../components/ui/index.jsx'
import { useStore } from '../lib/store.jsx'
import { MODULES } from '../data/modules.js'
import { levelNumber, XP_RULES } from '../lib/gamification.js'
import { dailyChallenge, dailyTitle } from '../data/challenges.js'
import { buildBoard } from '../data/leaderboard.js'
import { todayKey } from '../lib/dates.js'

const greet = () => {
  const h = new Date().getHours()
  if (h < 5) return 'Still up'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

/** One rail row. Hairline-separated, never boxed. */
function RailRow({ icon: Icon, label, sub, right, to }) {
  const nav = useNavigate()
  const body = (
    <div className="flex items-center gap-4 py-3.5">
      <span className="flex shrink-0 items-center gap-2.5">
        <Icon size={15} className="text-fg-dim" strokeWidth={2.2} />
        <span className="t3">{label}</span>
      </span>
      <span className="min-w-0 flex-1 truncate copy">{sub}</span>
      {right}
    </div>
  )
  if (!to) return body
  return (
    <button
      onClick={() => nav(to)}
      className="block w-full text-left transition-opacity hover:opacity-80"
    >
      {body}
    </button>
  )
}

/** 8-pip quest track. Shape encodes state, not colour alone. */
function QuestTrack({ stats, unlocked }) {
  const idx = MODULES.findIndex((m) => stats[m.id] && stats[m.id].pct > 0 && stats[m.id].pct < 100)
  const current = idx === -1 ? MODULES.findIndex((m) => unlocked[m.id] !== false) : idx
  const nextLocked = MODULES.find((m) => unlocked[m.id] === false)
  const done = current === -1 ? MODULES.length : current

  return (
    <div>
      <div className="grid grid-cols-8 gap-1.5" role="img" aria-label={`Mission ${done + 1} of ${MODULES.length}`}>
        {MODULES.map((m, i) => {
          const s = stats[m.id] || {}
          const state = s.completed ? 'done' : i === current ? 'current' : 'locked'
          return (
            <span
              key={m.id}
              title={m.name}
              data-s={state}
              className={`h-1.5 rounded-full ${
                state === 'done'
                  ? 'bg-good/70'
                  : state === 'current'
                    ? 'bg-electric-400'
                    : 'bg-white/[0.08]'
              }`}
            />
          )
        })}
      </div>
      <p className="caption mt-2">
        Mission {String(Math.min(done + 1, MODULES.length)).padStart(2, '0')} of {String(MODULES.length).padStart(2, '0')}
        {nextLocked && ` · ${nextLocked.name} unlocks next`}
      </p>
    </div>
  )
}

export default function Dashboard() {
  const { profile, impact, level, streak, stats, unlocked, daily, quizHistory } = useStore()
  const nav = useNavigate()

  /** The current mission: the partially-done module, else the next open one. */
  const mission = useMemo(() => {
    const partial = MODULES.find((m) => stats[m.id] && stats[m.id].pct > 0 && stats[m.id].pct < 100)
    if (partial) return partial
    return MODULES.find((m) => unlocked[m.id] !== false) || MODULES[0]
  }, [stats, unlocked])

  /** The next scenario in that mission — the one thing we want the user to play. */
  const scenario = useMemo(() => {
    const s = stats[mission.id] || {}
    return mission.scenarios.find((x) => !s.scenarioIds?.includes(x.id)) || mission.scenarios[0]
  }, [mission, stats])

  const missionStat = stats[mission.id] || {}
  const board = buildBoard('weekly', { xp: level.xp, college: profile?.college, name: profile?.name })
  const me = board.you
  const ahead = board.rows.filter((r) => !r.isYou && r.rank < (me?.rank || 99))
  const gap = ahead.length ? me.xp - ahead[ahead.length - 1].xp : 0
  const dc = dailyChallenge()
  const dailyDone = daily?.lastDone === todayKey()
  const bestQuiz = quizHistory.reduce(
    (a, q) => (q.total ? Math.max(a, Math.round((q.score / q.total) * 100)) : a),
    0,
  )

  return (
    <div className="mx-auto max-w-[1180px] space-y-8 pb-4">
      {/* ---------------------------------------------------- masthead */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div className="min-w-0">
          <h1 className="t1">
            {greet()}, {profile?.name?.split(' ')[0] || 'Learner'}.
          </h1>
          <p className="copy mt-1.5">
            {impact.scenariosDone < 40
              ? `${40 - impact.scenariosDone} scenarios left in the journey.`
              : 'Journey complete — go for a perfect score.'}
          </p>
        </div>
        <LevelSeal
          number={levelNumber(level.level)}
          name={level.name}
          sub={`${formatNumber(level.xp)} XP`}
        />
      </motion.div>

      {/* --------------------------------------- hero: the scene, not a scoreboard */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="sheet-lg sheet-focal p-6 sm:p-7">
          <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
            {/* left — the scene. This is the focal point of the whole app. */}
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="eyebrow text-electric-300">
                  {mission.name} · Scenario {Math.min((missionStat.scenariosDone || 0) + 1, mission.scenarios.length)} of{' '}
                  {mission.scenarios.length}
                </span>
                <Pill tone="xp">+{XP_RULES.scenario} XP</Pill>
              </div>

              <h2 className="case-title">{scenario.title}</h2>

              <p className="lead measure mt-3">{scenario.situation}</p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Pill>{mission.difficulty}</Pill>
                <Pill>~{mission.minutes} min</Pill>
                <Pill>
                  {missionStat.pct || 0}% of {mission.name}
                </Pill>
              </div>

              {/* The ONE primary button on this screen. */}
              <Button
                variant="primary"
                size="lg"
                className="mt-6"
                onClick={() => nav(`/lesson/${mission.id}?tab=scenario`)}
                icon={Play}
                iconRight={ArrowRight}
              >
                {missionStat.pct > 0 ? 'Resume scenario' : 'Start scenario'}
              </Button>
            </div>

            {/* right — borderless reference column, not a card in a card.
                Deliberately `num-lg`, not `num-xl`: the hero's job is to make the
                user press Resume, and a 56px gold figure out-scaled the only
                primary button on the screen. The dashboard's one `num-xl` budget
                is spent on nothing here on purpose. */}
            <div className="lg:border-l lg:border-white/[0.06] lg:pl-8">
              <div className="eyebrow mb-2">Total XP</div>
              <div className="flex items-baseline gap-2">
                <Figure value={level.xp} size="lg" tone="xp" />
                <span className="caption">
                  {level.isMax ? 'max' : `${formatNumber(level.toNext)} to L${levelNumber(level.level + 1)}`}
                </span>
              </div>
              {/* The bar measures progress to the NEXT LEVEL, so the percentage
                  must be of that same span. `level.pct` is in-level progress
                  (350/500), which put "70%" next to a total that was really
                  92.5% of the way to Level 5 — the flagship screen answering
                  "how far to the next unlock" incorrectly. */}
              <ProgressBar
                value={level.isMax ? 100 : level.into}
                max={level.isMax ? 1 : level.span || 1}
                variant="xp"
                className="mt-3"
              />
              <div className="mt-1.5 flex justify-between">
                <span className="eyebrow">
                  {formatNumber(level.into)}
                  {level.isMax ? '' : ` / ${formatNumber(level.span)} to next`}
                </span>
                <span className="caption">
                  {level.isMax
                    ? 'Maximum level'
                    : `Level ${levelNumber(level.level + 1)} at ${formatNumber(level.next?.min || 0)}`}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Pill tone="warn" icon={Flame}>
                  {streak?.current || 0} day streak
                </Pill>
                <Pill>{streak?.longest || 0} day best</Pill>
              </div>

              <div className="mt-5">
                <QuestTrack stats={stats} unlocked={unlocked} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ------------------------------------------------- unboxed stat strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <StatStrip
          items={[
            { label: 'Lessons', value: impact.lessonsCompleted },
            { label: 'Quiz accuracy', value: impact.quizAccuracy, suffix: '%', tone: impact.quizAccuracy >= 80 ? 'good' : undefined },
            { label: 'Modules', value: impact.modulesDone, suffix: `/${impact.modulesTotal}` },
            { label: 'Day streak', value: streak?.current || 0, tone: (streak?.current || 0) >= 7 ? 'good' : undefined },
            { label: 'Badges', value: impact.badges, tone: 'xp' },
          ]}
        />
      </motion.div>

      {/* ------------------------------------------------------------- rail */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <CardHead eyebrow="What next" title="Three ways to play today" />
        <div className="divide-y divide-white/[0.05]">
          <RailRow
            icon={Zap}
            label="Daily challenge"
            sub={dailyDone ? 'Cleared today — play another for practice' : dailyTitle(dc)}
            to="/daily"
            right={
              <span className="flex shrink-0 items-center gap-3">
                <Pill tone="xp">+{XP_RULES.dailyChallenge} XP</Pill>
                <ArrowRight size={14} className="text-fg-faint" />
              </span>
            }
          />
          <RailRow
            icon={Trophy}
            label="Your rank"
            sub={
              me
                ? `#${me.rank} of ${board.total}${ahead.length ? ` · ${formatNumber(Math.abs(gap))} XP behind ${ahead[ahead.length - 1].name}` : ' · leading the board'}`
                : '—'
            }
            to="/leaderboard"
            right={<ArrowRight size={14} className="shrink-0 text-fg-faint" />}
          />
          <RailRow
            icon={Timer}
            label="60-second run"
            sub={bestQuiz ? `Best quiz ${bestQuiz}% · 8 questions, 60 seconds` : '8 questions · 60 seconds'}
            to="/speed"
            right={<ArrowRight size={14} className="shrink-0 text-fg-faint" />}
          />
        </div>
      </motion.div>

      {/* ------------------------------------------- next mission, flat list */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <CardHead
          eyebrow="Legal journey"
          title="Unlock the next mission"
          action={
            <Link to="/journey" className="text-caption font-semibold text-electric-300 hover:underline">
              Open the map →
            </Link>
          }
        />
        <ul className="divide-y divide-white/[0.05]">
          {MODULES.map((m) => {
            const s = stats[m.id] || {}
            const isOpen = unlocked[m.id] !== false
            const isNext = m.id === mission.id
            return (
              <li key={m.id}>
                <Link
                  to={isOpen ? `/lesson/${m.id}` : '/journey'}
                  className="flex items-center gap-3 py-3 transition-opacity hover:opacity-75"
                >
                  {s.completed ? (
                    <Check size={15} className="shrink-0 text-good" strokeWidth={3} />
                  ) : isOpen ? (
                    <Play size={15} className={`shrink-0 ${isNext ? 'text-electric-300' : 'text-fg-dim'}`} strokeWidth={2.4} />
                  ) : (
                    <Lock size={14} className="shrink-0 text-fg-faint" />
                  )}
                  <span className={`t3 min-w-0 flex-1 truncate ${isOpen ? '' : 'text-fg-dim'}`}>{m.name}</span>
                  {isNext && <Pill tone="electric">Next</Pill>}
                  <span className="num shrink-0 text-fg-dim">{s.pct || 0}%</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </motion.div>

      {/* ------------------------------------------------- quick help, one row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1"
      >
        <span className="flex items-center gap-2">
          <Siren size={14} className="text-danger" strokeWidth={2.3} />
          <Link to="/emergency" className="text-caption font-semibold text-fg-muted hover:text-fg">
            In danger? call <span className="text-danger">112</span>
          </Link>
        </span>
        <span className="flex items-center gap-2">
          <Bot size={14} className="text-fg-dim" strokeWidth={2.2} />
          <Link to="/ai" className="text-caption font-semibold text-fg-muted hover:text-fg">
            Not sure it applies? Ask LawLink AI
          </Link>
        </span>
      </motion.div>
    </div>
  )
}
