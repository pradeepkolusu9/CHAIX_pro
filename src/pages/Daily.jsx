/**
 * Daily Challenge — one scenario a day, refreshed at local midnight.
 *
 * Same answer interaction as Speed.jsx (idle -> answered -> done) with a single
 * scenario, and the same reveal discipline: nothing moves until the click, then
 * verdict -> why -> reward. `completeDaily()` is guarded so the daily bonus can
 * only ever fire once per calendar day; the store guards it too.
 */
import { useCallback, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Scale,
  Timer,
  X,
} from 'lucide-react'
import {
  Button,
  Card,
  DisclaimerNote,
  LegalBasis,
  LevelSeal,
  Pill,
  ProgressBar,
  Sigil,
  formatNumber,
} from '../components/ui/index.jsx'
import { useStore, useActions } from '../lib/store.jsx'
import { useTicker } from '../lib/hooks.js'
import { todayKey, msUntilMidnight, formatCountdown } from '../lib/dates.js'
import { XP_RULES, levelNumber } from '../lib/gamification.js'
import { dailyChallenge, dailyTitle, sixtySecondBank } from '../data/challenges.js'
import { getModuleById } from '../data/modules.js'

const EASE = [0.16, 1, 0.3, 1]
const LETTERS = ['A', 'B', 'C', 'D']

/* ------------------------------------------------------------- the streak */
/** A week is seven quiet one-line cells, not seven boxes. */
function DayCell({ d }) {
  const state = d.done ? 'done' : d.future ? 'future' : 'missed'
  const dot = {
    done: 'bg-warn',
    missed: 'bg-white/[0.18]',
    future: 'bg-white/[0.08]',
  }[state]
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5">
      <div className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
        <span className="num text-fg-dim">{d.day}</span>
      </div>
      <span className="eyebrow">{d.label}</span>
    </div>
  )
}

/* ------------------------------------------------------------ the options */
function OptionRow({ opt, index, locked, picked, correct, onPick }) {
  const isCorrect = correct
  const isPicked = picked === opt.id
  const dimmed = locked && !isCorrect && !isPicked
  const wrong = locked && isPicked && !isCorrect
  const ring = locked && isCorrect ? 'ring-good/30' : wrong ? 'ring-danger/30' : ''

  return (
    <motion.button
      type="button"
      disabled={locked}
      onClick={() => onPick(opt.id)}
      initial={false}
      animate={{ opacity: dimmed ? 0.42 : 1, x: wrong ? [0, -5, 5, -3, 0] : 0 }}
      transition={wrong ? { duration: 0.3, ease: 'easeInOut' } : { duration: 0.24, ease: EASE }}
      className={`pressable block w-full px-3.5 py-3 text-left ${locked ? 'cursor-default' : 'cursor-pointer'} ring-2 ring-inset ${ring}`}
    >
      <span className="flex w-full min-w-0 items-center gap-3">
        <span
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-micro font-extrabold ${
            locked && isCorrect
              ? 'bg-good/15 text-good'
              : wrong
                ? 'bg-danger/15 text-danger'
                : 'bg-white/[0.06] text-fg-muted'
          }`}
        >
          {LETTERS[index]}
        </span>
        <span className="min-w-0 flex-1 break-words text-body font-medium leading-snug text-fg">
          {opt.text}
        </span>
        <span className="ml-auto grid w-5 shrink-0 place-items-center">
          {locked && isCorrect && <Check size={16} strokeWidth={2.6} className="text-good" />}
          {wrong && <X size={16} strokeWidth={2.6} className="text-danger" />}
        </span>
      </span>
    </motion.button>
  )
}

/* ------------------------------------------------ the shared answer moment */
function ScenarioPlay({ sc, mode, onSubmit, onNext, onExit }) {
  const mod = getModuleById(sc.moduleId)
  const [picked, setPicked] = useState(null)
  const [state, setState] = useState('idle') // idle -> answered -> done
  const [hint, setHint] = useState(false)
  const [claimedBonus, setClaimedBonus] = useState(false)
  const sentRef = useRef(false)

  const locked = state !== 'idle'
  const isRight = picked === sc.correct

  const pick = async (optId) => {
    if (locked || sentRef.current) return
    sentRef.current = true
    const right = optId === sc.correct
    setPicked(optId)
    setState('answered')
    setClaimedBonus(mode === 'daily')
    setHint(false)
    try {
      await onSubmit(right)
    } catch (err) {
      console.warn('[lawlink] daily answer failed', err)
    } finally {
      setState('done')
    }
  }

  return (
    <Card className="sheet-focal p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="eyebrow">Situation</span>
        <span className="flex items-center gap-2">
          <Sigil id={mod?.id} size={16} className="text-fg-dim" />
          <span className="caption">{mod?.name}</span>
        </span>
      </div>

      <h2 className="case-title mt-3">{sc.title}</h2>
      <p className="lead measure mt-3">{sc.situation}</p>

      {sc.hint && !locked && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setHint((h) => !h)}
            className="chip transition-colors hover:bg-white/[0.09] hover:text-fg"
          >
            {hint ? 'Hide hint' : 'Show hint'}
          </button>
          <AnimatePresence>
            {hint && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2, ease: EASE }}
                className="mt-2.5 rounded-xl bg-white/[0.02] px-3 py-2.5 text-body leading-relaxed text-fg-muted ring-1 ring-inset ring-white/[0.06]"
              >
                {sc.hint}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="mt-5 space-y-2.5">
        {sc.options.map((opt, i) => (
          <OptionRow
            key={opt.id}
            opt={opt}
            index={i}
            locked={locked}
            picked={picked}
            correct={sc.correct}
            onPick={pick}
          />
        ))}
      </div>

      {/* ------------------------------ the reveal, only after the click ---- */}
      <AnimatePresence>
        {locked && (
          <motion.section
            key="verdict"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="mt-6 border-t border-white/[0.06] pt-5"
          >
            <div className="flex items-center gap-2.5">
              {isRight ? (
                <Check size={22} strokeWidth={3} className="shrink-0 text-good" />
              ) : (
                <X size={22} strokeWidth={3} className="shrink-0 text-danger" />
              )}
              <h3 className="t2">{isRight ? 'Right call' : 'Not this time'}</h3>
            </div>
            <p className="copy mt-2 measure">
              {isRight
                ? 'That is the move the law expects. Scenario cleared.'
                : 'The lesson still counts — this is the one to remember.'}
            </p>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="num-lg text-xp-300">+{XP_RULES.scenario} XP</span>
              {claimedBonus && <Pill tone="good">+{XP_RULES.dailyChallenge} XP daily bonus</Pill>}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state === 'answered' && (
          <motion.section
            key="why"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE, delay: 0.45 }}
            className="mt-5"
          >
            <div className="eyebrow mb-2 text-xp-300">Why this is the right move</div>
            <p className="text-body leading-relaxed text-fg measure">{sc.why}</p>

            {sc.rights?.length > 0 && (
              <div className="mt-4">
                <div className="eyebrow mb-2">Your rights here</div>
                <ul className="divide-y divide-white/[0.05]">
                  {sc.rights.map((r) => (
                    <li key={r} className="flex gap-2.5 py-2">
                      <Scale size={13} strokeWidth={2.2} className="mt-0.5 shrink-0 text-fg-faint" />
                      <span className="min-w-0 text-body leading-relaxed text-fg-muted">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {sc.doThis?.length > 0 && (
              <div className="mt-4">
                <div className="eyebrow mb-2">Do this</div>
                <ol className="divide-y divide-white/[0.05]">
                  {sc.doThis.map((d) => (
                    <li key={d.step} className="flex gap-2.5 py-2">
                      <span className="num mt-0.5 w-4 shrink-0 text-fg-dim">{d.step}</span>
                      <span className="min-w-0 text-body leading-relaxed text-fg-muted">{d.text}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <LegalBasis
              className="mt-4"
              basis={{ law: sc.law, note: sc.hint }}
              source={sc.source}
              lastVerified={sc.lastVerified}
            />
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state === 'done' && (
          <motion.div
            key="next"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.26, ease: EASE, delay: 0.2 }}
            className="mt-5 flex flex-col gap-2 sm:flex-row"
          >
            {/* the ONE primary button on this screen */}
            <Button variant="primary" className="w-full sm:w-auto" onClick={onNext} iconRight={ArrowRight}>
              Next scenario
            </Button>
            <Button variant="ghost" className="w-full sm:w-auto" onClick={onExit}>
              Back to dashboard
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

/* ------------------------------------------------------------------- page */
export default function Daily() {
  const { daily, streak, level, week, stats } = useStore()
  const { actions } = useActions()
  const nav = useNavigate()

  const [sc, setSc] = useState(() => dailyChallenge())
  const [round, setRound] = useState(0)
  const [practice, setPractice] = useState(false)
  const [answeredOnce, setAnsweredOnce] = useState(false)
  const dailySentRef = useRef(false)

  // one tick per second (interval cleared on unmount) keeps the clock live
  useTicker(true, 1000)
  const { h, m, s } = formatCountdown(msUntilMidnight())

  const completedToday = daily.lastDone === todayKey()
  const mode = practice || completedToday ? 'practice' : 'daily'
  const mod = getModuleById(sc.moduleId)

  /* a practice scenario the user has not already cleared, so the XP still lands */
  const pickPractice = useCallback(() => {
    const undone = sixtySecondBank.filter(
      (c) => !(stats[c.moduleId]?.scenarioIds || []).includes(c.id),
    )
    const bank = undone.length ? undone : sixtySecondBank
    return bank[Math.floor(Math.random() * bank.length)]
  }, [stats])

  const handleSubmit = useCallback(
    async (isRight) => {
      setAnsweredOnce(true)
      if (mode === 'daily') {
        if (dailySentRef.current) return
        dailySentRef.current = true
        await actions.completeDaily()
        return
      }
      await actions.completeScenario(sc.moduleId, sc.id, isRight)
    },
    [actions, mode, sc],
  )

  const nextScenario = useCallback(() => {
    setSc(pickPractice())
    setRound((r) => r + 1)
  }, [pickPractice])

  const startPractice = useCallback(() => {
    setPractice(true)
    setSc(pickPractice())
    setRound((r) => r + 1)
  }, [pickPractice])

  const showPlay = mode === 'daily' || practice || answeredOnce
  const levelToNext = level.isMax ? 'Top level reached' : `${formatNumber(level.toNext)} XP to next level`
  const clearedDays = useMemo(() => week.filter((d) => d.done).length, [week])

  return (
    <div className="mx-auto max-w-[900px] space-y-8 pb-4">
      {/* ---------------------------------------------------- masthead */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="eyebrow">Daily legal challenge</div>
          <h1 className="t1 mt-2">{dailyTitle(sc)}</h1>
          <p className="copy mt-1.5">
            One scenario a day, refreshed at midnight. {formatNumber(daily.totalDone || 0)} challenge
            {daily.totalDone === 1 ? '' : 's'} cleared so far.
          </p>
        </div>
        <LevelSeal
          number={levelNumber(level.level)}
          name={level.name}
          sub={`${formatNumber(level.xp)} XP`}
        />
      </div>

      {/* --------------------------------- the challenge: the focal surface */}
      {showPlay ? (
        <ScenarioPlay
          key={`${sc.id}-${round}`}
          sc={sc}
          mode={mode}
          onSubmit={handleSubmit}
          onNext={nextScenario}
          onExit={() => nav('/dashboard')}
        />
      ) : (
        <Card className="sheet-lg sheet-focal p-5 text-center sm:p-8">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-good/10">
            <CheckCircle2 size={28} strokeWidth={2.1} className="text-good" />
          </div>
          <h2 className="t2 mt-4">Today&apos;s challenge cleared</h2>
          <p className="copy mx-auto mt-2 max-w-md">
            You already banked today&apos;s bonus. A new situation unlocks at midnight — until then,
            run extra scenarios and keep the XP.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <span className="num-lg text-xp-300">+{XP_RULES.dailyChallenge} XP</span>
            <Pill tone="warn">{streak.current} day streak</Pill>
          </div>
          <Button variant="primary" size="lg" className="mt-6" onClick={startPractice}>
            Play another scenario for practice
          </Button>
        </Card>
      )}

      {/* ------------------------------------ live countdown, no box needed */}
      <div className="flex flex-wrap items-end justify-between gap-6 border-t border-white/[0.05] pt-5">
        <div>
          <div className="eyebrow mb-1.5">Challenge refreshes in</div>
          <div className="flex items-baseline gap-1.5">
            <span className="num-lg tnum">{h}</span>
            <span className="num-lg text-fg-faint">:</span>
            <span className="num-lg tnum">{m}</span>
            <span className="num-lg text-fg-faint">:</span>
            <span className="num-lg tnum">{s}</span>
          </div>
        </div>
        <div>
          <div className="eyebrow mb-1.5">Today&apos;s reward</div>
          <div className="num-lg text-xp-300">+{XP_RULES.dailyChallenge} XP</div>
        </div>
        <div>
          <div className="eyebrow mb-1.5">Completed today</div>
          <div className="num-lg">{completedToday ? 'Yes' : 'No'}</div>
        </div>
      </div>

      {/* ---------------------------------------------- streak, one-line cells */}
      <section>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="t2">Your streak</h2>
          <span className="caption tnum">
            {streak.current} day{streak.current === 1 ? '' : 's'} · best {streak.longest} · {clearedDays}{' '}
            of {week.length} this week
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {week.map((d) => (
            <DayCell key={d.date} d={d} />
          ))}
        </div>
        <p className="caption mt-3">
          A 7-day streak pays +{XP_RULES.streakMilestone} XP automatically. Any lesson, scenario, quiz
          or challenge counts as a day.
        </p>
      </section>

      {/* ---------------------------------------------------- why it matters */}
      <section className="border-t border-white/[0.05] pt-8">
        <h2 className="t2">Why this matters</h2>
        <p className="lead measure mt-3">
          Most rights in Indian law are lost to delay, not to ignorance — a payment that keeps moving, a
          complaint that was never filed, a message that got deleted. One scenario a day is enough to
          make the right reflex automatic before the stress arrives.
        </p>
        <DisclaimerNote className="mt-5" />
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            as={Link}
            to="/speed"
            variant="ghost"
            size="sm"
            icon={Timer}
            iconRight={ArrowRight}
            className="w-full sm:w-auto"
          >
            Try the 60-second version
          </Button>
          <Button
            as={Link}
            to={`/lesson/${mod?.id}`}
            variant="quiet"
            size="sm"
            iconRight={ArrowRight}
            className="w-full sm:w-auto"
          >
            Open {mod?.name}
          </Button>
        </div>
      </section>

      {/* --------------------------------------------------------- legal IQ */}
      <section className="border-t border-white/[0.05] pt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="t2">Your Legal IQ</h2>
          <span className="caption tnum">{levelToNext}</span>
        </div>
        <ProgressBar
          value={level.isMax ? 100 : level.pct}
          variant="xp"
          showLabel
          label={level.isMax ? 'Maximum level reached' : `Level ${levelNumber(level.level)} to Level ${levelNumber(level.level + 1)}`}
        />
      </section>
    </div>
  )
}
