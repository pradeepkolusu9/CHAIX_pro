import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'

import {
  Button,
  Card,
  EmptyState,
  LevelSeal,
  Pill,
  ProgressBar,
  SectionHeading,
  Sigil,
  StatStrip,
  formatNumber,
  sigilGlyph,
} from '../components/ui/index.jsx'
import { useStore } from '../lib/store.jsx'
import { LEVELS, ACCENT, XP_RULES, levelNumber } from '../lib/gamification.js'
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

/* ------------------------------------------------------------------ badges */
/**
 * One badge. The mark is the badge's own Sigil at 30px; the colour is never the
 * badge's to choose — it is earned (gold) or it is not (neutral + dimmed).
 * Nothing here is a link: a locked badge must not be clickable.
 */
function BadgeTile({ badge, reduce }) {
  const unlocked = badge.unlocked

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.28, ease: EASE } },
      }}
      className="flex items-start gap-3.5"
    >
      <div
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${
          unlocked ? 'bg-xp-400/[0.10]' : 'bg-white/[0.04]'
        }`}
      >
        <Sigil
          id={badge.sigil}
          size={30}
          className={unlocked ? 'text-xp-300' : 'text-fg-faint opacity-50 grayscale'}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={`t3 ${unlocked ? '' : 'text-fg-muted'}`}>{badge.name}</h3>
          {unlocked ? (
            <span className="chip-good shrink-0">Unlocked</span>
          ) : (
            <span className="chip shrink-0">Locked</span>
          )}
        </div>
        <p className="copy mt-1">{unlocked ? badge.desc : badge.hint}</p>
      </div>
    </motion.div>
  )
}

/* -------------------------------------------------------------------- page */
export default function Achievements() {
  const { badges, ownedBadges, streak, impact, stats, level, daily } = useStore()
  const reduce = useReducedMotionPref()

  const bestQuizPct = useMemo(() => {
    const all = Object.values(stats)
      .map((s) => (s.quizTotal ? Math.round((s.quizBest / s.quizTotal) * 100) : 0))
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
      className="space-y-6"
    >
      <SectionHeading
        eyebrow="Achievements"
        title="Badges"
        sub={`${ownedBadges.length} of ${badges.length} badges earned — every one unlocks from real activity on this device.`}
        action={
          <Pill tone={ownedBadges.length === badges.length ? 'good' : 'xp'}>
            {Math.round((ownedBadges.length / Math.max(1, badges.length)) * 100)}% collected
          </Pill>
        }
      />

      {/* summary — unboxed, on the canvas */}
      <div>
        <StatStrip
          items={[
            { label: 'Badges earned', value: ownedBadges.length, suffix: `/ ${badges.length}`, tone: 'good' },
            {
              label: 'Current streak',
              value: streak.current,
              suffix: streak.current === 1 ? ' day' : ' days',
              tone: 'xp',
            },
            { label: 'Modules completed', value: impact.modulesDone, suffix: `/ ${impact.modulesTotal}` },
          ]}
        />
        {streak.longest > streak.current && (
          <p className="caption mt-3">Best run so far: {streak.longest} days</p>
        )}
      </div>

      {/* almost unlocked — honest, never an invented percentage ------------ */}
      <Card className="p-4 sm:p-5">
        <div className="eyebrow mb-2">Almost unlocked</div>
        <h3 className="t3">Closest to yours</h3>

        {closest.length === 0 ? (
          <EmptyState
            icon={sigilGlyph('legal-legend')}
            title="Every badge is unlocked"
            body="The full set is yours. The level ladder below is the next thing to climb."
          />
        ) : (
          <ul className="mt-4 divide-y divide-white/[0.05]">
            {closest.map(({ badge, progress }) => (
              <li key={badge.id} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2.5">
                  <Sigil id={badge.sigil} size={16} className="shrink-0 text-fg-faint" />
                  <div className="min-w-0 flex-1">
                    <div className="t3 truncate">{badge.name}</div>
                    <div className="caption truncate">{badge.hint}</div>
                  </div>
                  {progress && (
                    <span className="num shrink-0 text-xp-300">{progress.readout}</span>
                  )}
                </div>

                {progress ? (
                  <>
                    <ProgressBar
                      className="mt-2.5"
                      value={progress.value}
                      max={progress.target}
                      size="sm"
                      variant="xp"
                    />
                    <p className="caption mt-1.5">{progress.label}</p>
                  </>
                ) : (
                  <p className="caption mt-1.5">{NO_METRIC}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* the collection — flat cells, no boxes ---------------------------- */}
      <section>
        <SectionHeading
          eyebrow="Collection"
          title="All badges"
          sub="Locked badges show exactly what unlocks them."
        />
        <motion.div
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: reduce ? 0 : 0.05, delayChildren: 0.05 } },
          }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.05 }}
          className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2"
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
          sub={`You are level ${levelNumber(level.level)} — ${level.name}.`}
        />
        <Card className="p-4 sm:p-5">
          <LevelSeal number={levelNumber(level.level)} name={level.name} sub={`${formatNumber(level.xp)} lifetime XP`} className="mb-3" />
          <ol className="divide-y divide-white/[0.05]">
            {LEVELS.map((l) => {
              const done = l.level < level.level
              const current = l.level === level.level
              const accent = ACCENT[l.accent] || ACCENT.electric
              const need = Math.max(0, l.min - level.xp)
              return (
                <li
                  key={l.level}
                  className={`flex items-center gap-3 py-2.5 ${
                    current ? `rounded-xl px-3 ${accent.ring} ring-1 ring-inset` : 'px-3'
                  } ${done ? '' : 'opacity-60'}`}
                >
                  <span className={`num w-8 shrink-0 text-left ${current ? 'text-fg' : 'text-fg-dim'}`}>
                    {levelNumber(l.level)}
                  </span>
                  <span className={`t3 min-w-0 flex-1 truncate ${current ? 'text-white' : 'text-fg-muted'}`}>
                    {l.name}
                  </span>
                  {done ? (
                    <Check size={15} className="shrink-0 text-good" strokeWidth={2.6} />
                  ) : current ? (
                    <span className="chip-electric shrink-0">You are here</span>
                  ) : (
                    <span className="num shrink-0 text-fg-dim">{formatNumber(need)} XP</span>
                  )}
                </li>
              )
            })}
          </ol>
        </Card>
      </section>

      {/* closing CTA --------------------------------------------------- */}
      <Card className="p-4 sm:p-5">
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
              {streak.current > 0 && (
                <span className="text-fg-dim"> Your {streak.current}-day streak is live.</span>
              )}
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
