import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Flame, Zap, Trophy, Timer, Play, ArrowRight, Lock, Check, Siren, Bot, Search, LifeBuoy } from 'lucide-react'
import { Pill, Button, IconBadge, Sigil, formatNumber } from '../components/ui/index.jsx'
import { useStore } from '../lib/store.jsx'
import { MODULES } from '../data/modules.js'
import { levelNumber, XP_RULES } from '../lib/gamification.js'
import { dailyChallenge, dailyTitle } from '../data/challenges.js'
import { buildBoard, weeklyXp } from '../data/leaderboard.js'
import { todayKey } from '../lib/dates.js'
import { toneFor } from '../lib/moduleTone.js'

const EASE = [0.16, 1, 0.3, 1]
const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: EASE, delay },
})

const greet = () => {
  const h = new Date().getHours()
  if (h < 5) return 'Still up'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

/** SVG progress ring. Static track + arc; children render in the centre. */
function Ring({ pct, size = 96, stroke = 9, color = '#3d63f5', children }) {
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
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(100, pct)) / 100)}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}

/** Large clickable "what next" card. */
function ActionTile({ to, icon, tone, title, sub, chip }) {
  return (
    <Link to={to} className="pressable group flex flex-col gap-4 p-5" style={{ borderRadius: 24 }}>
      <div className="flex items-start justify-between gap-3">
        <IconBadge icon={icon} tone={tone} size="lg" />
        {chip}
      </div>
      <div className="min-w-0">
        <div className="t2">{title}</div>
        <p className="copy mt-1 line-clamp-2">{sub}</p>
      </div>
      <span className="mt-auto flex items-center gap-1.5 text-caption font-semibold text-electric-300">
        Go <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}

export default function Dashboard() {
  const { profile, level, streak, stats, unlocked, daily, week, nextModuleId, ledger, sixtySecond } = useStore()
  const nav = useNavigate()

  /** The current mission: the first open, unfinished module. Null-safe fallback only when all are done. */
  const allDone = !nextModuleId
  const mission = useMemo(
    () => MODULES.find((m) => m.id === nextModuleId) || MODULES[0],
    [nextModuleId],
  )

  const scenario = useMemo(() => {
    const s = stats[mission.id] || {}
    return mission.scenarios.find((x) => !s.scenarioIds?.includes(x.id)) || mission.scenarios[0]
  }, [mission, stats])

  const missionStat = stats[mission.id] || {}
  const missionPct = missionStat.pct || 0
  const board = buildBoard('weekly', { xp: weeklyXp(ledger).xp, college: profile?.college, name: profile?.name })
  const me = board.you
  const ahead = board.rows.filter((r) => !r.isYou && r.rank < (me?.rank || 99))
  const gap = ahead.length ? me.xp - ahead[ahead.length - 1].xp : 0
  const dc = dailyChallenge()
  const dailyDone = daily?.lastDone === todayKey()
  const levelPct = level.isMax ? 100 : Math.round(((level.into || 0) / (level.span || 1)) * 100)
  const streakNow = streak?.current || 0
  const daysDone = (week || []).filter((d) => d.done).length

  return (
    <div className="mx-auto max-w-[1180px] space-y-14 pb-6">
      {/* greeting */}
      <motion.div {...rise(0)}>
        <h1 className="t1">
          {greet()}, {profile?.name?.split(' ')[0] || 'Learner'}.
        </h1>
        <p className="copy mt-1.5">
          {streakNow > 0 ? `${streakNow}-day streak going. Keep it warm.` : 'One scenario today starts your streak.'}
        </p>
      </motion.div>

      {/* hero 8/4 */}
      <motion.div {...rise(0.05)} className="grid gap-6 lg:grid-cols-12">
        <div className="sheet-lg sheet-focal p-6 sm:p-8 lg:col-span-8">
          <div className="flex flex-col-reverse gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="eyebrow mb-3">
                {allDone
                  ? 'Journey complete'
                  : `Continue · ${mission.name} · Scenario ${Math.min((missionStat.scenariosDone || 0) + 1, mission.scenarios.length)} of ${mission.scenarios.length}`}
              </div>
              <h2 className="case-title">{allDone ? 'You finished the journey' : scenario.title}</h2>
              <p className="lead measure mt-3 line-clamp-3">
                {allDone ? 'Every module is complete. Replay any of them or climb the leaderboard.' : scenario.situation}
              </p>
              {!allDone && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Pill tone="xp">+{XP_RULES.scenario} XP</Pill>
                  <Pill>{mission.difficulty}</Pill>
                  <Pill>~{mission.minutes} min</Pill>
                </div>
              )}
              {/* The ONE primary button on this screen. */}
              <Button
                variant="primary"
                size="lg"
                className="mt-7"
                onClick={() => nav(allDone ? '/journey' : `/lesson/${mission.id}?tab=scenario`)}
                icon={allDone ? Trophy : Play}
                iconRight={ArrowRight}
              >
                {allDone ? 'Open the journey map' : missionPct > 0 ? 'Resume scenario' : 'Start scenario'}
              </Button>
            </div>
            <Ring pct={allDone ? 100 : missionPct} size={104}>
              <div className="text-center">
                <div className="num-lg leading-none">{allDone ? 100 : missionPct}%</div>
                <div className="caption mt-0.5">{allDone ? 'journey' : mission.name.length > 12 ? 'module' : mission.name}</div>
              </div>
            </Ring>
          </div>
        </div>

        {/* level card */}
        <div className="sheet-lg flex flex-col justify-between gap-6 p-6 lg:col-span-4">
          <div className="flex items-center gap-4">
            <div className="tile tile-violet h-16 w-16 rounded-2xl">
              <span className="num-lg text-violet2-300">{levelNumber(level.level)}</span>
            </div>
            <div className="min-w-0">
              <div className="eyebrow">Your level</div>
              <div className="t2 leading-tight">{level.name}</div>
            </div>
          </div>
          <div>
            <div className="flex items-end justify-between">
              <span className="num-lg text-xp-300">
                {formatNumber(level.xp)} <span className="caption">XP</span>
              </span>
              <span className="caption tnum">
                {level.isMax ? 'Max level' : `${formatNumber(level.toNext)} to L${levelNumber(level.level + 1)}`}
              </span>
            </div>
            <div className="track mt-3" role="progressbar" aria-valuenow={levelPct} aria-valuemin={0} aria-valuemax={100}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${levelPct}%` }}
                transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
                className="track-fill-xp"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Pill tone="warn" icon={Flame}>
              {streakNow} day streak
            </Pill>
            <Pill>{streak?.longest || 0} day best</Pill>
          </div>
        </div>
      </motion.div>

      {/* week strip + what next */}
      <motion.section {...rise(0.1)} className="space-y-6">
        <div className="sheet flex flex-wrap items-center justify-between gap-x-8 gap-y-4 px-5 py-4 sm:px-6">
          <div>
            <div className="eyebrow">This week</div>
            <div className="caption tnum mt-1">
              {daysDone} of {(week || []).length || 7} days
            </div>
          </div>
          <ul className="flex w-full min-w-0 justify-between gap-1 sm:w-auto sm:max-w-md sm:flex-1 sm:justify-end sm:gap-4">
            {(week || []).map((d) => (
              <li key={d.date} className="flex min-w-0 flex-1 flex-col items-center gap-1.5 sm:flex-none" title={d.date}>
                <span
                  className={`grid aspect-square w-full max-w-[36px] min-w-0 place-items-center rounded-full ${
                    d.done ? 'tile tile-warn' : d.future ? 'bg-white/[0.05]' : 'bg-white/[0.12]'
                  }`}
                >
                  {d.done && <Flame size={16} strokeWidth={2.2} />}
                </span>
                <span className="text-micro font-semibold text-fg-dim">{d.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <ActionTile
            to="/daily"
            icon={Zap}
            tone="xp"
            title="Daily challenge"
            sub={dailyDone ? 'Cleared today. Play another for practice.' : dailyTitle(dc)}
            chip={<Pill tone="xp">+{XP_RULES.dailyChallenge} XP</Pill>}
          />
          <ActionTile
            to="/speed"
            icon={Timer}
            tone="electric"
            title="60-second run"
            sub={sixtySecond?.cleared ? `${sixtySecond.cleared} cleared so far. Beat the 60-second clock.` : 'Beat the 60-second clock.'}
            chip={<Pill tone="electric">Fast</Pill>}
          />
          <ActionTile
            to="/leaderboard"
            icon={Trophy}
            tone="violet"
            title="Your rank"
            sub={
              me
                ? `#${me.rank} of ${board.total}${ahead.length ? `, ${formatNumber(Math.abs(gap))} XP behind ${ahead[ahead.length - 1].name}` : ', leading the board'}`
                : 'See the board.'
            }
            chip={me ? <Pill>#{me.rank}</Pill> : null}
          />
        </div>
      </motion.section>

      {/* journey rail */}
      <motion.section {...rise(0.15)}>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <div className="eyebrow mb-2">Legal journey</div>
            <h2 className="t1">Eight modules, one at a time</h2>
          </div>
          <Link to="/journey" className="shrink-0 text-caption font-semibold text-electric-300 hover:underline">
            Open the map
          </Link>
        </div>
        <ol className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-8 lg:overflow-visible lg:px-0">
          {MODULES.map((m, i) => {
            const s = stats[m.id] || {}
            const open = unlocked[m.id] !== false
            const isNow = !allDone && m.id === mission.id
            return (
              <li key={m.id} className="w-[92px] shrink-0 lg:w-auto">
                <Link
                  to={open ? `/lesson/${m.id}` : '/journey'}
                  className={`flex flex-col items-center gap-2.5 rounded-2xl px-2 py-3 text-center transition-colors hover:bg-electric-500/5 ${
                    isNow ? 'bg-electric-500/[0.07]' : ''
                  }`}
                  aria-label={`${m.name}: ${s.completed ? 'complete' : open ? `${s.pct || 0}%` : 'locked'}`}
                >
                  <span className="relative">
                    <span className={`tile ${open ? `tile-${toneFor(m.id)}` : 'tile-muted'} h-14 w-14 rounded-2xl`}>
                      {open ? <Sigil id={m.id} size={26} /> : <Lock size={20} strokeWidth={2.2} />}
                    </span>
                    {s.completed && (
                      <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-good text-pure ring-2 ring-surface-0">
                        <Check size={12} strokeWidth={3.4} />
                      </span>
                    )}
                  </span>
                  <span className="t3 line-clamp-2 text-caption leading-tight">{m.name}</span>
                  <span className={`caption tnum ${open ? '' : 'text-fg-faint'}`}>
                    {String(i + 1).padStart(2, '0')} · {open ? `${s.pct || 0}%` : 'locked'}
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>
      </motion.section>

      {/* quick help band */}
      <motion.div {...rise(0.2)} className="inset flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3.5">
        <span className="eyebrow">Quick help</span>
        {[
          { to: '/emergency', icon: Siren, tone: 'danger', label: 'Emergency 112' },
          { to: '/emergency#legal-aid', icon: LifeBuoy, tone: 'good', label: 'Legal aid' },
          { to: '/search', icon: Search, tone: 'electric', label: 'Search' },
          { to: '/ai', icon: Bot, tone: 'violet', label: 'Ask AI' },
        ].map((q) => (
          <Link key={q.label} to={q.to} className="flex min-h-[44px] items-center gap-2 text-caption font-semibold text-fg-muted hover:text-fg">
            <IconBadge icon={q.icon} tone={q.tone} size="xs" />
            {q.label}
          </Link>
        ))}
      </motion.div>
    </div>
  )
}
