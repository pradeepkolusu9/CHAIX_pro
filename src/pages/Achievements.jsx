import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Check, Lock } from 'lucide-react'

import {
  Button,
  Card,
  EmptyState,
  Panel,
  ProgressBar,
  SectionHeading,
  Sigil,
  formatNumber,
  sigilGlyph,
} from '../components/ui/index.jsx'
import { useStore } from '../lib/store.jsx'
import { LEVELS, XP_RULES, levelNumber } from '../lib/gamification.js'
import { todayKey } from '../lib/dates.js'
import { useReducedMotionPref } from '../lib/hooks.js'

const EASE = [0.16, 1, 0.3, 1]

/** Badges that are earned by finishing one specific module. */
const MODULE_BADGE = {
  'cyber-defender': 'cybercrime',
  'road-warrior': 'road',
  'smart-consumer': 'consumer',
  'rights-protector': 'safety',
  'campus-guardian': 'student',
  'workplace-rights': 'workplace',
}

const NO_METRIC = 'Keep going — this unlocks as you progress through the modules'

/**
 * Real, derived progress for a locked badge. Returns null when there is no
 * honest metric to measure — we never invent a percentage.
 */
function badgeProgress(badge, { impact, stats, streak, bestQuizPct }) {
  const mod = MODULE_BADGE[badge.id]
  if (mod && stats[mod]) {
    const pct = stats[mod].pct
    return { value: pct, target: 100, readout: `${pct}%`, label: `${badge.hint} — ${pct}% done` }
  }
  switch (badge.id) {
    case 'first-step':
      return {
        value: Math.min(impact.lessonsCompleted, 1),
        target: 1,
        readout: `${Math.min(impact.lessonsCompleted, 1)} of 1`,
        label: 'Lessons read — finish any lesson card',
      }
    case 'quick-learner':
      return {
        value: impact.quizAccuracy,
        target: 90,
        readout: `${impact.quizAccuracy}%`,
        label: `Quiz accuracy ${impact.quizAccuracy}% — 90% target`,
      }
    case 'streak-master':
      return {
        value: streak.longest,
        target: 7,
        readout: `${streak.longest} of 7 days`,
        label: `Longest streak — 7 days unlocks this`,
      }
    case 'legal-legend':
      return {
        value: impact.modulesDone,
        target: impact.modulesTotal,
        readout: `${impact.modulesDone} of ${impact.modulesTotal}`,
        label: `Modules completed — ${impact.modulesDone} of ${impact.modulesTotal}`,
      }
    case 'perfect-ten':
      return {
        value: bestQuizPct,
        target: 100,
        readout: `${bestQuizPct}%`,
        label: `Best quiz score ${bestQuizPct}% — 100% target`,
      }
    default:
      return null
  }
}

/* -------------------------------------------------------------------- ring */
function Ring({ value, max, size = 64, stroke = 7, children }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const frac = Math.max(0, Math.min(1, max ? value / max : 0))
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(61,99,245,0.12)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
          style={{ transition: 'stroke-dashoffset .7s cubic-bezier(.16,1,.3,1)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}

/* ------------------------------------------------------------------ badges */
/** Unlocked = rich gold tile with glow. Locked = frosted tile that says what unlocks it. */
function BadgeTile({ badge, reduce }) {
  const unlocked = badge.unlocked
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.28, ease: EASE } },
      }}
      className={`flex flex-col rounded-3xl p-4 sm:p-5 ${
        unlocked
          ? 'bg-gradient-to-br from-[#fff4cf] via-[#ffe7a0] to-[#ffd166] shadow-glow-xp ring-1 ring-inset ring-xp-500/40'
          : 'bg-pure/60 ring-1 ring-inset ring-white/[0.1] backdrop-blur'
      }`}
    >
      <div
        className={`grid h-14 w-14 place-items-center rounded-2xl ${
          unlocked ? 'bg-pure/70 shadow-sheet' : 'bg-electric-500/[0.08]'
        }`}
      >
        {unlocked ? (
          <Sigil id={badge.sigil} size={32} className="text-xp-300" />
        ) : (
          <Lock size={22} className="text-fg-dim" strokeWidth={2.2} />
        )}
      </div>
      <h3 className="t3 mt-3 text-ink-900">{badge.name}</h3>
      {unlocked ? (
        <>
          <p className="caption mt-1 text-ink-800">{badge.desc}</p>
          <span className="chip-good mt-3 self-start">
            <Check size={11} strokeWidth={3} /> Unlocked
          </span>
        </>
      ) : (
        <>
          <p className="caption mt-1 text-fg-muted">{badge.hint}</p>
          <span className="chip mt-3 self-start">Locked</span>
        </>
      )}
    </motion.div>
  )
}

/* -------------------------------------------------------------------- page */
export default function Achievements() {
  const { badges, ownedBadges, streak, impact, stats, level, daily } = useStore()
  const reduce = useReducedMotionPref()

  const bestQuizPct = useMemo(() => {
    const all = Object.values(stats).map((s) => (s.quizTotal ? Math.round((s.quizBest / s.quizTotal) * 100) : 0))
    return all.length ? Math.max(0, ...all) : 0
  }, [stats])

  const locked = useMemo(() => badges.filter((b) => !b.unlocked), [badges])

  /** The three locked badges closest to being earned (no real metric sorts last). */
  const closest = useMemo(
    () =>
      locked
        .map((b) => {
          const p = badgeProgress(b, { impact, stats, streak, bestQuizPct })
          return { badge: b, progress: p, frac: p ? p.value / p.target : -1 }
        })
        .sort((a, b) => b.frac - a.frac)
        .slice(0, 3),
    [locked, impact, stats, streak, bestQuizPct],
  )

  const modulesLeft = Math.max(0, impact.modulesTotal - impact.modulesDone)
  const master = LEVELS[LEVELS.length - 1]
  const xpToMaster = Math.max(0, master.min - level.xp)
  const dailyDone = daily?.lastDone === todayKey()

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.3, ease: EASE }}
      className="space-y-12"
    >
      {/* hero summary ------------------------------------------------- */}
      <Panel className="sheet-focal p-6 sm:p-8">
        <div className="eyebrow mb-2">Achievements</div>
        <h1 className="t1">Your badge collection</h1>
        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10">
          <Ring value={ownedBadges.length} max={badges.length} size={132} stroke={12}>
            <div className="text-center">
              <div className="num-lg">{ownedBadges.length}</div>
              <div className="caption">of {badges.length}</div>
            </div>
          </Ring>
          <div className="grid flex-1 grid-cols-2 gap-6">
            <div>
              <div className="eyebrow mb-1.5">Current streak</div>
              <div className="num-xl text-xp-300">{streak.current}</div>
              <div className="caption mt-1">
                {streak.current === 1 ? 'day' : 'days'}
                {streak.longest > streak.current ? ` · best ${streak.longest}` : ''}
              </div>
            </div>
            <div>
              <div className="eyebrow mb-1.5">Modules</div>
              <div className="num-xl">{impact.modulesDone}</div>
              <div className="caption mt-1">of {impact.modulesTotal} completed</div>
            </div>
          </div>
        </div>
        <p className="copy mt-5">Every badge unlocks from real activity on this device.</p>
      </Panel>

      {/* closest to unlocking ----------------------------------------- */}
      <section>
        <SectionHeading eyebrow="Almost there" title="Closest to unlocking" />
        {closest.length === 0 ? (
          <Card>
            <EmptyState
              icon={sigilGlyph('legal-legend')}
              title="Every badge is unlocked"
              body="The full set is yours. The level ladder below is the next thing to climb."
            />
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {closest.map(({ badge, progress }) => (
              <Card key={badge.id} className="flex flex-col items-start gap-4 p-5">
                <Ring value={progress ? progress.value : 0} max={progress ? progress.target : 1} size={84} stroke={9}>
                  <Sigil id={badge.sigil} size={26} className="text-xp-300" />
                </Ring>
                <div className="min-w-0">
                  <h3 className="t2">{badge.name}</h3>
                  <p className="copy mt-1">{badge.hint}</p>
                </div>
                <div className="mt-auto w-full">
                  {progress ? (
                    <>
                      <ProgressBar value={progress.value} max={progress.target} size="sm" variant="xp" />
                      <p className="caption mt-2">
                        <span className="font-semibold text-xp-300">{progress.readout}</span> · {progress.label}
                      </p>
                    </>
                  ) : (
                    <p className="caption">{NO_METRIC}</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* the collection ------------------------------------------------- */}
      <section>
        <SectionHeading eyebrow="Collection" title="All badges" sub="Locked badges show exactly what unlocks them." />
        <motion.div
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: reduce ? 0 : 0.05, delayChildren: 0.05 } },
          }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.05 }}
          className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4"
        >
          {badges.map((badge) => (
            <BadgeTile key={badge.id} badge={badge} reduce={reduce} />
          ))}
        </motion.div>
      </section>

      {/* level ladder -------------------------------------------------- */}
      <section>
        <SectionHeading
          eyebrow="Level ladder"
          title="Eight levels, one ladder"
          sub={`You are level ${levelNumber(level.level)} — ${level.name} · ${formatNumber(level.xp)} XP.`}
        />
        <ol className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 pt-2 sm:mx-0 sm:px-0">
          {LEVELS.map((l) => {
            const done = l.level < level.level
            const current = l.level === level.level
            const need = Math.max(0, l.min - level.xp)
            return (
              <li
                key={l.level}
                aria-current={current ? 'step' : undefined}
                className={`relative w-[136px] shrink-0 snap-start rounded-3xl p-4 ${
                  current
                    ? 'bg-gradient-to-b from-violet2-500/[0.16] to-violet2-500/[0.05] shadow-glow-violet ring-2 ring-violet2-500/60'
                    : done
                      ? 'bg-good/[0.08] ring-1 ring-inset ring-good/25'
                      : 'bg-pure/60 ring-1 ring-inset ring-white/[0.1]'
                }`}
              >
                <div
                  className={`grid h-9 w-9 place-items-center rounded-full font-sans text-body font-extrabold ${
                    current ? 'bg-violet2-500 text-pure' : done ? 'bg-good text-pure' : 'bg-electric-500/10 text-fg-muted'
                  }`}
                >
                  {done ? <Check size={16} strokeWidth={3} /> : levelNumber(l.level)}
                </div>
                <div className="t3 mt-3">{l.name}</div>
                <div className={`caption mt-1 ${current ? 'font-semibold text-violet2-300' : done ? 'text-good' : ''}`}>
                  {current ? 'You are here' : done ? 'Reached' : `${formatNumber(need)} XP to go`}
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      {/* closing CTA --------------------------------------------------- */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <span className="eyebrow">Next milestone</span>
            <h3 className="t2 mt-1.5">
              {level.isMax
                ? 'You are a Legal Master'
                : `${formatNumber(modulesLeft)} module${modulesLeft === 1 ? '' : 's'} and ${formatNumber(
                    xpToMaster,
                  )} XP from Legal Master`}
            </h3>
            <p className="copy measure mt-1.5">
              {level.isMax
                ? `All ${impact.modulesTotal} modules are done and the top level is reached. Keep the streak alive to hold the title.`
                : `Finish the remaining module${modulesLeft === 1 ? '' : 's'} to close the set, or bank XP now — every lesson card, scenario and quiz answer moves the ladder.`}
              {streak.current > 0 && <span className="text-fg-dim"> Your {streak.current}-day streak is live.</span>}
            </p>
            {!dailyDone && (
              <p className="caption mt-1.5">
                Today's challenge is still open — it is worth {formatNumber(XP_RULES.dailyChallenge)} XP.
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap gap-2.5">
            <Button as={Link} to="/journey" iconRight={ArrowRight}>
              Continue the journey
            </Button>
            <Button as={Link} to="/daily" variant="ghost">
              Take the daily challenge
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
