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
  Flame,
  MessageSquareWarning,
  Scale,
  Timer,
  X,
} from 'lucide-react'
import {
  Button,
  Card,
  DisclaimerNote,
  IconBadge,
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
import { toneFor } from '../lib/moduleTone.js'

const EASE = [0.16, 1, 0.3, 1]
const LETTERS = ['A', 'B', 'C', 'D']

/* ------------------------------------------------------------- the streak */
/** Seven day dots: flame when cleared, today ringed in blue. */
function DayCell({ d, today }) {
  const dot = d.done
    ? 'bg-warn text-pure'
    : today
      ? 'bg-electric-500/10 text-electric-300 ring-2 ring-inset ring-electric-500'
      : d.future
        ? 'bg-white/[0.05] text-fg-faint'
        : 'bg-white/[0.09] text-fg-dim'
  const status = d.done ? 'cleared' : today ? 'today' : d.future ? 'upcoming' : 'missed'
  return (
    <div className="flex min-w-0 flex-col items-center gap-2">
      <span className={`eyebrow ${today ? '' : '!text-fg-dim'}`}>{d.label}</span>
      <span
        className={`grid h-10 w-10 place-items-center rounded-full text-caption font-bold tnum sm:h-11 sm:w-11 ${dot}`}
        role="img"
        aria-label={`${d.label} ${d.day}: ${status}`}
      >
        {d.done ? <Flame size={17} strokeWidth={2.4} /> : d.day}
      </span>
    </div>
  )
}

/** One HH / MM / SS tile. */
function ClockTile({ v, unit }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="inset grid h-16 w-[4.25rem] place-items-center sm:h-[4.5rem] sm:w-20">
        <span className="num-lg tnum text-fg" style={{ fontSize: '2rem' }}>
          {v}
        </span>
      </div>
      <span className="eyebrow !text-fg-dim">{unit}</span>
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
      className={`pressable block min-h-[56px] w-full px-4 py-3.5 text-left ${locked ? 'cursor-default' : 'cursor-pointer'} ring-2 ring-inset ${ring}`}
    >
      <span className="flex w-full min-w-0 items-center gap-3">
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-caption font-extrabold ${
            locked && isCorrect
              ? 'bg-good/15 text-good'
              : wrong
                ? 'bg-danger/15 text-danger'
                : 'bg-electric-500/10 text-electric-300'
          }`}
        >
          {LETTERS[index]}
        </span>
        <span className="min-w-0 flex-1 break-words text-[16px] font-medium leading-snug text-fg">
          {opt.text}
        </span>
        <span className="ml-auto grid w-5 shrink-0 place-items-center">
          {locked && isCorrect && <Check size={18} strokeWidth={2.6} className="text-good" />}
          {wrong && <X size={18} strokeWidth={2.6} className="text-danger" />}
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
    <Card className="sheet-lg sheet-focal p-5 sm:p-8">
      <div className="flex items-center gap-3">
        <span className={`tile tile-${toneFor(mod?.id)} h-10 w-10 rounded-xl`}>
          <Sigil id={mod?.id} size={20} />
        </span>
        <div className="min-w-0">
          <div className="eyebrow">Situation</div>
          <div className="caption truncate">{mod?.name}</div>
        </div>
      </div>

      <h2 className="case-title mt-5">{sc.title}</h2>
      {mod?.id === 'cybercrime' ? (
        <div className="mt-4 max-w-[34rem]">
          <div className="mb-1.5 flex items-center gap-1.5 pl-1 text-micro font-semibold text-fg-dim">
            <MessageSquareWarning size={13} strokeWidth={2.2} /> Unknown sender · just now
          </div>
          <p className="rounded-[20px] rounded-tl-md bg-white/[0.07] px-4 py-3 text-[16px] leading-relaxed text-fg">
            {sc.situation}
          </p>
        </div>
      ) : (
        <p className="lead measure mt-3">{sc.situation}</p>
      )}

      {sc.hint && !locked && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setHint((h) => !h)}
            className="chip min-h-[32px] transition-colors hover:bg-white/[0.09] hover:text-fg"
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
                className="inset mt-2.5 px-3.5 py-3 text-body leading-relaxed text-fg-muted"
              >
                {sc.hint}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="mt-6 space-y-3">
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
            className="mt-7 border-t border-white/[0.07] pt-6"
          >
            <div className="flex items-center gap-2.5">
              <IconBadge icon={isRight ? Check : X} tone={isRight ? 'good' : 'danger'} size="sm" />
              <h3 className="t2">{isRight ? 'Right call' : 'Not this time'}</h3>
            </div>
            <p className="copy mt-2 measure">
              {isRight
                ? 'That is the move the law expects. Scenario cleared.'
                : 'The lesson still counts. This is the one to remember.'}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Pill tone="xp">+{XP_RULES.scenario} XP</Pill>
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
            className="sticky bottom-[calc(env(safe-area-inset-bottom)+76px)] z-10 -mx-2 mt-5 flex flex-col gap-2 rounded-2xl bg-pure/90 p-2 backdrop-blur sm:static sm:mx-0 sm:flex-row sm:bg-transparent sm:p-0 sm:backdrop-blur-none lg:bottom-4"
          >
            {/* the ONE primary button on this screen */}
            <Button variant="primary" size="lg" className="w-full sm:w-auto" onClick={onNext} iconRight={ArrowRight}>
              Next scenario
            </Button>
            <Button variant="ghost" size="lg" className="w-full sm:w-auto" onClick={onExit}>
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

  const tk = todayKey()
  const completedToday = daily.lastDone === tk
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
    <div className="mx-auto max-w-[760px] space-y-12 pb-4">
      {/* ---------------------------------------------------- masthead */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="eyebrow">Today&apos;s challenge</div>
          <h1 className="t1 mt-2">{dailyTitle(sc)}</h1>
          <p className="copy mt-1.5">
            One scenario a day. {formatNumber(daily.totalDone || 0)} cleared so far.
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
        <Card className="sheet-lg sheet-focal p-6 text-center sm:p-10">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="mx-auto w-fit"
          >
            <IconBadge icon={CheckCircle2} tone="good" size="lg" />
          </motion.div>
          <h2 className="t1 mt-5">Cleared for today</h2>
          <p className="copy mx-auto mt-2 max-w-sm">
            Bonus banked. A new situation unlocks at midnight. Run extra scenarios until then.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Pill tone="xp">+{XP_RULES.dailyChallenge} XP</Pill>
            <Pill tone="warn" icon={Flame}>
              {streak.current} day streak
            </Pill>
          </div>
          <Button variant="primary" size="lg" className="mt-7 w-full sm:w-auto" onClick={startPractice}>
            Play another for practice
          </Button>
        </Card>
      )}

      {/* ------------------------------------------- countdown to midnight */}
      <section aria-label="Time until the next challenge" className="text-center">
        <div className="eyebrow mb-4">Next challenge in</div>
        <div className="flex items-start justify-center gap-2 sm:gap-3">
          <ClockTile v={h} unit="hours" />
          <span className="num-lg mt-4 text-fg-faint">:</span>
          <ClockTile v={m} unit="min" />
          <span className="num-lg mt-4 text-fg-faint">:</span>
          <ClockTile v={s} unit="sec" />
        </div>
      </section>

      {/* ------------------------------------------------------- streak */}
      <section>
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="t2">Your streak</h2>
          <span className="caption tnum">
            {streak.current} day{streak.current === 1 ? '' : 's'} · best {streak.longest} · {clearedDays}/
            {week.length} this week
          </span>
        </div>
        <div className="sheet grid grid-cols-7 gap-1 p-4 sm:p-6">
          {week.map((d) => (
            <DayCell key={d.date} d={d} today={d.date === tk} />
          ))}
        </div>
        <p className="caption mt-3">
          Seven days in a row pays +{XP_RULES.streakMilestone} XP. Any lesson, scenario, quiz or challenge
          counts.
        </p>
      </section>

      {/* ---------------------------------------------------- next steps */}
      <section>
        <p className="lead measure">
          Most rights are lost to delay, not ignorance. One scenario a day makes the right reflex automatic.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
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
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="t2">Your Legal IQ</h2>
          <span className="caption tnum">{levelToNext}</span>
        </div>
        <ProgressBar
          value={level.isMax ? 100 : level.pct}
          variant="xp"
          showLabel
          label={
            level.isMax
              ? 'Maximum level reached'
              : `Level ${levelNumber(level.level)} to Level ${levelNumber(level.level + 1)}`
          }
        />
      </section>
      <DisclaimerNote compact />
    </div>
  )
}
