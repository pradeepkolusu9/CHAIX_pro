/**
 * 60-Second Rights Challenge — the fastest demo in the app.
 *
 * intro -> play -> result. The clock is a RADIAL RING driven by framer-motion off
 * one continuous fraction `(deadline - now) / RUN_MS`, sampled on a 100ms ticker,
 * so the hand moves at constant velocity and the arc can never lurch once per
 * second. The deadline — not a decrement — is the source of truth, and the run is
 * ended exactly once.
 *
 * Motion discipline (docs/council/01 R7 + 05): NOTHING animates while the learner
 * is choosing. The clock is the single exception, because a countdown is
 * functional information, not decoration. The reveal is staged deliberately —
 * verdict -> why -> the module's segmented reward bar — over ~1.6s.
 *
 * `clearSixtySecond()` already pays the XP and is capped per day, so this page
 * never awards anything itself.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, BookOpen, Check, Play, Scale, SkipForward, Timer, Trophy, X, Zap } from 'lucide-react'
import {
  Button,
  Card,
  DisclaimerNote,
  IconBadge,
  LegalBasis,
  Pill,
  Sigil,
  formatNumber,
} from '../components/ui/index.jsx'
import { useStore, useActions } from '../lib/store.jsx'
import { useBurst, useReducedMotionPref, useTicker } from '../lib/hooks.js'
import { XP_RULES } from '../lib/gamification.js'
import { pickSixtySecond } from '../data/challenges.js'
import { getModuleById } from '../data/modules.js'
import { toneFor } from '../lib/moduleTone.js'

const EASE = [0.16, 1, 0.3, 1]
const LETTERS = ['A', 'B', 'C', 'D']
const RUN_MS = 60_000
const RING_R = 54
const RING_C = 2 * Math.PI * RING_R

/** Shared identity for "no stats for this module yet". See the useMemo note below. */
const EMPTY_STAT = Object.freeze({})
const two = (n) => String(Math.max(0, Math.min(60, n))).padStart(2, '0')

/* ---------------------------------------------------------------- the clock */
/**
 * A large depleting ring. `frac` is time ELAPSED, so the arc is driven by
 * `pLeft`: it unwinds as time runs out. Green -> orange under 20s -> red under 10s.
 * Ring strokes are >= 3:1 on white; the numerals use the darker text tokens.
 */
function RunClock({ frac, secondsLeft, running }) {
  const reduce = useReducedMotionPref()
  const p = Math.max(0, Math.min(1, frac))
  const hot = secondsLeft <= 10
  const warm = !hot && secondsLeft <= 20
  const tone = hot ? '#DC2626' : warm ? '#EA580C' : '#16A34A'
  const numTone = hot ? 'text-danger' : warm ? 'text-warn' : 'text-good'

  return (
    <div className="relative mx-auto h-28 w-28 sm:h-52 sm:w-52">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="64" cy="64" r={RING_R} fill="none" strokeWidth="9" className="stroke-white/[0.08]" />
        <motion.circle
          cx="64"
          cy="64"
          r={RING_R}
          fill="none"
          stroke={tone}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={RING_C}
          initial={false}
          animate={{ strokeDashoffset: RING_C * p }}
          transition={{ duration: reduce ? 0 : 0.12, ease: 'linear' }}
          style={{ filter: `drop-shadow(0 0 6px ${tone}55)` }}
        />
      </svg>

      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className={`tnum font-sans font-bold leading-none ${numTone}`} style={{ fontSize: 'clamp(2rem, 8vw, 3rem)' }}>
            {two(secondsLeft)}
          </div>
          <div className="eyebrow mt-2 !text-fg-dim">{running ? 'seconds' : 'time up'}</div>
        </div>
      </div>
    </div>
  )
}

/** 12 pips = 12 five-second slices; lit while that slice of the minute is still ahead. */
function TimePips({ secondsLeft }) {
  const lit = Math.ceil(secondsLeft / 5)
  return (
    <div className="mx-auto flex h-1.5 w-full max-w-[16rem] gap-1" aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => (
        <span
          key={i}
          className={`min-w-0 flex-1 rounded-full transition-colors duration-300 ${
            i < lit ? (secondsLeft <= 10 ? 'bg-danger' : secondsLeft <= 20 ? 'bg-warn' : 'bg-good') : 'bg-white/[0.1]'
          }`}
        />
      ))}
    </div>
  )
}

/** Result dial: a full ring for a clear, an empty track for a miss. */
function ScoreRing({ win, className = '' }) {
  const tone = win ? '#16A34A' : '#94A3B8'
  return (
    <div className={`relative mx-auto h-40 w-40 ${className}`}>
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="64" cy="64" r={RING_R} fill="none" strokeWidth="9" className="stroke-white/[0.08]" />
        <motion.circle
          cx="64"
          cy="64"
          r={RING_R}
          fill="none"
          stroke={tone}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={RING_C}
          initial={{ strokeDashoffset: RING_C }}
          animate={{ strokeDashoffset: win ? 0 : RING_C }}
          transition={{ duration: 0.8, ease: EASE }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className={`tnum font-sans font-bold leading-none ${win ? 'text-good' : 'text-fg-muted'}`} style={{ fontSize: '3rem' }}>
            {win ? 1 : 0}/1
          </div>
          <div className="eyebrow mt-2 !text-fg-dim">score</div>
        </div>
      </div>
    </div>
  )
}


/* ------------------------------------------------- the segmented reward bar */
/** Discrete reward units, built from real module data. Never invents a unit. */
function moduleUnits(mod, s = {}) {
  const out = []
  ;(mod?.lessons || []).forEach((l, i) =>
    out.push({
      key: `l-${l.id || i}`,
      state: (s.lessonsRead || 0) > i ? 'done' : 'todo',
      xp: XP_RULES.lessonRead,
    }),
  )
  ;(mod?.scenarios || []).forEach((sc, i) =>
    out.push({
      key: `s-${sc.id || i}`,
      state: (s.scenarioIds || []).includes(sc.id) ? 'done' : 'todo',
      xp: XP_RULES.scenario,
    }),
  )
  ;(mod?.quiz || []).forEach((q, i) =>
    out.push({ key: `q-${q.id || i}`, state: s.quizDone ? 'done' : 'todo', xp: XP_RULES.quizCorrect }),
  )
  out.push({ key: 'topic', state: s.completed ? 'done' : 'todo', xp: XP_RULES.topicComplete })
  return out
}

/**
 * The bar IS the readout: N filled cells out of M, one cell per thing that pays.
 * Gold is the only colour that means "earned".
 */
function RewardSegments({ units, className = '' }) {
  const earned = units.filter((u) => u.state === 'done').length
  const xp = units.reduce((a, u) => a + (u.state === 'done' ? u.xp : 0), 0)
  const nextIndex = units.findIndex((u) => u.state !== 'done')

  return (
    <div className={className}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="caption truncate">Reward units earned</span>
        <span className="caption tnum shrink-0">
          {earned}/{units.length} · {formatNumber(xp)} XP
        </span>
      </div>
      <div
        className="flex h-1.5 w-full gap-[3px]"
        role="img"
        aria-label={`${earned} of ${units.length} reward units earned in this module`}
      >
        {units.map((u, i) => (
          <motion.span
            key={u.key}
            initial={false}
            animate={{
              backgroundColor:
                u.state === 'done' ? '#F5B942' : i === nextIndex ? '#6A8BFF' : 'rgba(15,23,42,0.12)',
            }}
            transition={{ duration: 0.26, ease: EASE }}
            className="min-w-0 flex-1 rounded-full"
          />
        ))}
      </div>
      <p className="caption mt-2">
        One block per reward unit — lesson {XP_RULES.lessonRead} XP, scenario {XP_RULES.scenario} XP,
        quiz answer {XP_RULES.quizCorrect} XP, topic {XP_RULES.topicComplete} XP. The blue block is the
        next one you clear.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------- the options */
function OptionRow({ opt, index, state, isPicked, isCorrect, onPick }) {
  const locked = state !== 'idle'
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
      className={`pressable block min-h-[60px] w-full px-4 py-3.5 text-left ${locked ? 'cursor-default' : 'cursor-pointer'} ring-2 ring-inset ${ring}`}
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
          {locked && isCorrect && <Check size={16} strokeWidth={2.6} className="text-good" />}
          {wrong && <X size={16} strokeWidth={2.6} className="text-danger" />}
        </span>
      </span>
    </motion.button>
  )
}

/* ------------------------------------------------------------------- page */
export default function Speed() {
  const { sixtySecond, stats } = useStore()
  const { actions } = useActions()
  const { parts, fire } = useBurst(2400)
  const reduce = useReducedMotionPref()

  const [phase, setPhase] = useState('intro') // intro | play | result
  const [sc, setSc] = useState(null)
  const [startAt, setStartAt] = useState(0)
  const [deadline, setDeadline] = useState(0)
  const [picked, setPicked] = useState(null)
  const [closed, setClosed] = useState(null) // 'answered' | 'timeout' | 'skip'
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState(0) // reveal stage — 0 idle, 1 verdict, 2 why, 3 reward
  const firedRef = useRef(false)
  const sentRef = useRef(false)

  const running = phase === 'play' && !closed
  const now = useTicker(running, 100)

  /* the deadline, not a decrement, is the source of truth — it cannot drift */
  const sample = Math.max(now, startAt)
  const frac = useMemo(() => {
    if (phase !== 'play') return closed ? 0 : 1
    return Math.max(0, Math.min(1, (deadline - sample) / RUN_MS))
  }, [deadline, phase, closed, sample])
  const secondsLeft = Math.min(60, Math.max(0, Math.ceil(frac * 60)))

  /* the clock ends the run exactly once, and never over a real answer */
  useEffect(() => {
    if (phase !== 'play' || closed) return
    if (deadline - sample > 0) {
      firedRef.current = false
      return
    }
    if (firedRef.current) return
    firedRef.current = true
    setClosed('timeout')
    setPicked(null)
    setPhase('result')
  }, [phase, closed, deadline, sample])

  /* the reveal is staged on purpose — this is the moment the page is bought with */
  useEffect(() => {
    if (phase !== 'result') {
      setStep(0)
      return undefined
    }
    if (reduce) {
      setStep(3)
      return undefined
    }
    const timers = [
      setTimeout(() => setStep(1), 0),
      setTimeout(() => setStep(2), 480),
      setTimeout(() => setStep(3), 1120),
    ]
    return () => timers.forEach(clearTimeout)
  }, [phase, reduce])

  const startRun = useCallback((next) => {
    sentRef.current = false
    firedRef.current = false
    setSc(next)
    setPicked(null)
    setClosed(null)
    setBusy(false)
    setStep(0)
    const t = Date.now()
    setStartAt(t)
    setDeadline(t + RUN_MS)
    setPhase('play')
  }, [])

  const start = useCallback(() => startRun(pickSixtySecond(Math.random())), [startRun])

  const again = useCallback(() => {
    let next = pickSixtySecond(Math.random())
    let guard = 0
    while (next?.id === sc?.id && guard < 8) {
      next = pickSixtySecond(Math.random())
      guard += 1
    }
    startRun(next)
  }, [sc, startRun])

  const pick = useCallback(
    async (optId) => {
      if (phase !== 'play' || closed || sentRef.current) return
      sentRef.current = true
      const right = optId === sc.correct
      setPicked(optId)
      setClosed('answered')
      if (right) fire(44)
      setBusy(true)
      try {
        // clearSixtySecond already pays the XP (daily-capped). Never award twice.
        await actions.clearSixtySecond(right ? 1 : 0)
      } catch (err) {
        console.warn('[lawlink] 60-second run failed', err)
      } finally {
        setBusy(false)
        setPhase('result')
      }
    },
    [actions, closed, fire, phase, sc],
  )

  const skip = useCallback(() => {
    if (phase !== 'play' || closed) return
    setClosed('skip')
    setPicked(null)
    setPhase('result')
  }, [closed, phase])

  const mod = sc ? getModuleById(sc.moduleId) : null
  /* `stats[mod] || {}` allocated a NEW object literal on every render whenever the
     module had no entry, so `units` below re-computed 10x a second while the
     clock ticked. One shared frozen empty object fixes the identity. */
  const mStat = (sc && stats[sc.moduleId]) || EMPTY_STAT
  const units = useMemo(() => moduleUnits(mod, mStat), [mod, mStat])
  const isWin = closed === 'answered' && picked === sc?.correct
  const playState = closed === 'answered' ? 'answered' : closed ? 'ended' : 'idle'
  /* -------------------------------------------------------------- intro */
  if (phase === 'intro') {
    const RULES = [
      { icon: BookOpen, tone: 'electric', text: 'A real situation appears' },
      { icon: Timer, tone: 'warn', text: '60 seconds on the clock' },
      { icon: Scale, tone: 'good', text: 'Pick the move a citizen should make' },
    ]

    return (
      <div className="mx-auto max-w-xl space-y-5 pb-4">
        <div className="sheet-lg sheet-focal p-6 text-center sm:p-10">
          <IconBadge icon={Zap} tone="xp" size="lg" className="mx-auto" />
          <div className="eyebrow mt-5">60-second challenge</div>
          <h1 className="t1 mt-2">Sixty seconds, one call.</h1>
          <p className="lead mx-auto mt-3 max-w-md">
            One real situation. One minute. Pick the right move, then read the law behind it.
          </p>

          <ul className="mx-auto mt-7 max-w-sm space-y-3 text-left">
            {RULES.map((r) => (
              <li key={r.text} className="flex items-center gap-3">
                <IconBadge icon={r.icon} tone={r.tone} size="sm" />
                <span className="text-body font-semibold text-fg-muted">{r.text}</span>
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            <Pill tone="xp">+{XP_RULES.sixtySecond} XP per clear</Pill>
            <Pill icon={Trophy}>Best {sixtySecond.best}/1</Pill>
            <Pill>{sixtySecond.cleared} cleared</Pill>
          </div>

          {/* the ONE primary button on this screen */}
          <Button variant="primary" size="lg" className="mt-7 w-full" icon={Play} onClick={start}>
            Start the run
          </Button>
          <p className="caption mt-3">Up to 3 clears a day pay XP.</p>
        </div>

        <DisclaimerNote compact />
      </div>
    )
  }

  const verdictCopy = isWin
    ? secondsLeft > 0
      ? `Fast and correct, ${secondsLeft} second${secondsLeft === 1 ? '' : 's'} to spare.`
      : 'Correct, but only just made it.'
    : closed === 'timeout'
      ? 'The clock beat you. Read the move you needed, then run it again.'
      : closed === 'skip'
        ? 'Skipped. The explanation is the part that matters.'
        : 'Different call this time. The law has one right answer here.'

  const question = (
    <Card className="sheet-lg p-5 sm:p-8">
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
      <p className="lead measure mt-3">{sc.situation}</p>

      <div className="mt-6 space-y-3">
        {sc.options.map((opt, i) => (
          <OptionRow
            key={opt.id}
            opt={opt}
            index={i}
            state={playState}
            isPicked={picked === opt.id}
            isCorrect={opt.id === sc.correct}
            onPick={pick}
          />
        ))}
      </div>
    </Card>
  )

  return (
    <div className="relative mx-auto max-w-2xl space-y-6 pb-4">
      {/* particles */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-72 overflow-hidden"
      >
        {parts.map((p) => (
          <motion.span
            key={p.id}
            initial={{ x: '50%', y: '50%', opacity: 1, scale: 1 }}
            animate={{
              x: `calc(50% + ${p.x * 8}px)`,
              y: `calc(50% + ${p.y * 8}px)`,
              opacity: 0,
              scale: 0.4,
              rotate: p.rot,
            }}
            transition={{ duration: 2.2, delay: p.delay, ease: 'easeOut' }}
            className="absolute rounded-[2px]"
            style={{ width: p.size, height: p.size * 1.6, background: p.color }}
          />
        ))}
      </div>

      {phase === 'play' && (
        <>
          <div className="flex items-center justify-between gap-3">
            <Pill icon={Trophy}>Best {sixtySecond.best}/1</Pill>
            <Button variant="ghost" size="sm" icon={SkipForward} onClick={skip}>
              Skip
            </Button>
          </div>
          <div className="sticky top-[76px] z-20 -mx-4 space-y-3 bg-pure/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
            <RunClock frac={frac} secondsLeft={secondsLeft} running={running} />
            <TimePips secondsLeft={secondsLeft} />
          </div>
          {question}
        </>
      )}

      {phase === 'result' && (
        <>
          <AnimatePresence>
            {step >= 1 && (
              <motion.section
                key="verdict"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="sheet-lg sheet-focal p-6 text-center sm:p-10"
                aria-label="Run result"
              >
                <ScoreRing win={isWin} />
                <h1 className="t1 mt-5">{isWin ? 'Right call' : closed === 'timeout' ? 'Time is up' : 'Not this time'}</h1>
                <p className="copy mx-auto mt-2 max-w-sm">{verdictCopy}</p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <Pill tone={isWin ? 'xp' : 'default'}>+{isWin ? XP_RULES.sixtySecond : 0} XP</Pill>
                  <Pill icon={Trophy}>Best {sixtySecond.best}/1</Pill>
                </div>
                {!isWin && (
                  <p className="caption mt-2">The reward needs the right move. Up to 3 clears a day pay XP.</p>
                )}

                <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+76px)] z-10 -mx-2 mt-6 flex flex-col gap-2 rounded-2xl bg-pure/90 p-2 backdrop-blur sm:static sm:mx-0 sm:flex-row sm:justify-center sm:bg-transparent sm:p-0 sm:backdrop-blur-none lg:bottom-4">
                  {/* the ONE primary button on this screen */}
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto"
                    onClick={again}
                    iconRight={ArrowRight}
                    loading={busy}
                  >
                    Run it again
                  </Button>
                  <Button as={Link} to="/dashboard" variant="ghost" size="lg" className="w-full sm:w-auto">
                    Back to dashboard
                  </Button>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {question}

          <AnimatePresence>
            {step >= 2 && (
              <motion.section
                key="why"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="sheet p-5 sm:p-6"
              >
                <div className="eyebrow mb-2 text-xp-300">Why</div>
                <p className="text-body leading-relaxed text-fg measure">{sc.why}</p>
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
            {step >= 3 && (
              <motion.section
                key="reward"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="space-y-4"
              >
                <div>
                  <div className="eyebrow mb-2">{mod?.name} progress</div>
                  <RewardSegments units={units} />
                </div>
                <Link
                  to={`/lesson/${sc.moduleId}`}
                  className="flex min-h-[44px] items-center justify-center gap-1.5 text-caption font-semibold text-fg-dim transition-colors hover:text-fg"
                >
                  <BookOpen size={13} strokeWidth={2.2} />
                  Read the full lesson: {mod?.name}
                </Link>
                <DisclaimerNote compact />
              </motion.section>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}
