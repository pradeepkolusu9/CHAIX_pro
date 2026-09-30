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
import { ArrowRight, BookOpen, Check, Play, SkipForward, X } from 'lucide-react'
import {
  Button,
  Card,
  DisclaimerNote,
  LegalBasis,
  Sigil,
  formatNumber,
} from '../components/ui/index.jsx'
import { useStore, useActions } from '../lib/store.jsx'
import { useBurst, useReducedMotionPref, useTicker } from '../lib/hooks.js'
import { XP_RULES } from '../lib/gamification.js'
import { pickSixtySecond } from '../data/challenges.js'
import { getModuleById } from '../data/modules.js'

const EASE = [0.16, 1, 0.3, 1]
const LETTERS = ['A', 'B', 'C', 'D']
const RUN_MS = 60_000
const RING_R = 54
const RING_C = 2 * Math.PI * RING_R
const HAND = 32
const two = (n) => String(Math.max(0, Math.min(60, n))).padStart(2, '0')

/* ---------------------------------------------------------------- the clock */
/**
 * A clock, not a donut. 60 discrete second-ticks, a constant-velocity hand and a
 * continuous arc — so the eye reads time passing rather than a loading spinner.
 * Green while there is room, amber under 20s, red under 10s.
 */
function RunClock({ frac, secondsLeft, running }) {
  const reduce = useReducedMotionPref()
  const p = Math.max(0, Math.min(1, frac))
  const hot = secondsLeft <= 10
  const warm = !hot && secondsLeft <= 20
  const tone = hot ? '#EF4444' : warm ? '#F97316' : '#22C55E'
  const numTone = hot ? 'text-danger' : warm ? 'text-warn' : 'text-good'
  const lit = Math.ceil(p * 60)

  /* `frac` is time ELAPSED, so it was driving a countdown ring: at 45s left the
     ring showed a half-empty arc, reading as "50% done" — the inverse of the
     truth on the one screen where a misread costs the player. A clock runs the
     other way, so the ring, the ticks and the hand are all driven by `pLeft`
     (time remaining) and the hand sweeps clockwise from 12, like a real dial. */
  const pLeft = 1 - p
  const deg = pLeft * 360

  return (
    <div className="relative mx-auto h-40 w-40 sm:h-48 sm:w-48">
      <svg viewBox="0 0 128 128" className="h-full w-full" aria-hidden="true">
        <circle cx="64" cy="64" r={RING_R} fill="none" strokeWidth="8" className="stroke-white/[0.07]" />

        {/* 60 ticks = 60 seconds. Lit ticks are time still in hand. */}
        {Array.from({ length: 60 }, (_, i) => {
          const a = ((i / 60) * 360 - 90) * (Math.PI / 180)
          const on = i < lit
          return (
            <line
              key={i}
              x1={64 + Math.cos(a) * RING_R}
              y1={64 + Math.sin(a) * RING_R}
              x2={64 + Math.cos(a) * (i % 5 === 0 ? 50 : 54)}
              y2={64 + Math.sin(a) * (i % 5 === 0 ? 50 : 54)}
              stroke={on ? tone : 'rgba(255,255,255,0.10)'}
              strokeWidth={i % 5 === 0 ? 2 : 1}
              strokeLinecap="round"
            />
          )
        })}

        {/* the remaining arc — continuous, never driven by a rounded second */}
        <motion.circle
          cx="64"
          cy="64"
          r={RING_R}
          fill="none"
          stroke={tone}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={RING_C}
          initial={false}
          /* Unwinds as time runs OUT, not as it is spent. */
          animate={{ strokeDashoffset: RING_C * p }}
          transition={{ duration: reduce ? 0 : 0.12, ease: 'linear' }}
          style={{ filter: `drop-shadow(0 0 5px ${tone}55)` }}
        />

        {/* the sweep hand — constant velocity is the whole trick */}
        <g
          style={{
            transform: `rotate(${deg}deg)`,
            transformOrigin: '64px 64px',
            transformBox: 'view-box',
          }}
        >
          <line x1="64" y1="64" x2="64" y2={64 - HAND} stroke={tone} strokeWidth="2.5" strokeLinecap="round" />
        </g>
        <circle cx="64" cy="64" r="3" fill={tone} />
      </svg>

      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className={`num-lg ${numTone}`}>00:{two(secondsLeft)}</div>
          <div className="eyebrow mt-1.5">{running ? 'seconds left' : 'time up'}</div>
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
                u.state === 'done' ? '#F5B942' : i === nextIndex ? '#6A8BFF' : 'rgba(255,255,255,0.09)',
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

/* ------------------------------------------------------------------- page */
export default function Speed() {
  const { sixtySecond, stats } = useStore()
  const { actions } = useActions()
  const { parts, fire } = useBurst(2400)
  const reduce = useReducedMotionPref()

  const [phase, setPhase] = useState('intro') // intro | play | result
  const [sc, setSc] = useState(null)
  const [round, setRound] = useState(0)
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
    setRound((r) => r + 1)
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
  const mStat = sc ? stats[sc.moduleId] || {} : {}
  const units = useMemo(() => moduleUnits(mod, mStat), [mod, mStat])
  const isWin = closed === 'answered' && picked === sc?.correct
  const playState = closed === 'answered' ? 'answered' : closed ? 'ended' : 'idle'

  /* -------------------------------------------------------------- intro */
  if (phase === 'intro') {
    const RULES = ['A real situation appears', '60 seconds on the clock', 'Pick the move a citizen should make']

    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="sheet-lg sheet-focal p-5 sm:p-7">
          <div className="eyebrow">60-second rights challenge</div>
          <h1 className="t1 mt-3">Sixty seconds, one call.</h1>
          <p className="lead measure mt-3">
            One real situation drawn from the eight modules. One minute on the clock. Pick the move a
            citizen should actually make — then read the law that settles it.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <ol className="divide-y divide-white/[0.05]">
              {RULES.map((rule, i) => (
                <li key={rule} className="flex items-center gap-3 py-2.5">
                  <span className="eyebrow w-4 shrink-0">0{i + 1}</span>
                  <span className="text-body font-semibold text-fg-muted">{rule}</span>
                </li>
              ))}
            </ol>
            <div className="sm:text-right">
              <div className="eyebrow">Clear it and bank</div>
              <div className="num-lg mt-1 text-xp-300">+{XP_RULES.sixtySecond} XP</div>
            </div>
          </div>

          {/* the ONE primary button on this screen */}
          <Button variant="primary" size="lg" className="mt-6 w-full" icon={Play} onClick={start}>
            Start the 60-second run
          </Button>

          <p className="caption mt-4">
            {sixtySecond.cleared > 0
              ? `${sixtySecond.cleared} run${sixtySecond.cleared === 1 ? '' : 's'} cleared · best score ${sixtySecond.best}/1 · up to 3 clears a day pay XP.`
              : `No runs yet. One right move banks ${XP_RULES.sixtySecond} XP, up to three times a day.`}
          </p>
        </div>

        <DisclaimerNote />
      </div>
    )
  }

  /* --------------------------------------------------------------- banner */
  const banner =
    phase === 'play' ? (
      <div className="mb-6 flex justify-center">
        <RunClock frac={frac} secondsLeft={secondsLeft} running={running} />
      </div>
    ) : null

  const verdictCopy = isWin
    ? secondsLeft > 0
      ? `Fast and correct — ${secondsLeft} second${secondsLeft === 1 ? '' : 's'} to spare.`
      : 'Correct, but only just made it.'
    : closed === 'timeout'
      ? 'The clock beat you. Read the move you needed, then run it again.'
      : closed === 'skip'
        ? 'Skipped. The explanation is the part that actually matters.'
        : 'Different call this time. The law has one right answer here.'

  const resultFooter = (
    <div className="mt-4 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        {/* the ONE primary button on this screen */}
        <Button
          variant="primary"
          className="w-full sm:w-auto"
          onClick={again}
          iconRight={ArrowRight}
          loading={busy}
        >
          Run it again
        </Button>
        <Button as={Link} to="/dashboard" variant="ghost" className="w-full sm:w-auto">
          Back to dashboard
        </Button>
      </div>
      <Link
        to={`/lesson/${sc.moduleId}`}
        className="flex items-center justify-center gap-1.5 text-caption font-semibold text-fg-dim transition-colors hover:text-fg"
      >
        <BookOpen size={13} strokeWidth={2.2} />
        Skip to the full lesson — {mod?.name}
      </Link>
    </div>
  )

  return (
    <div className="relative mx-auto max-w-2xl space-y-4">
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

      <Card className="sheet-focal p-4 sm:p-6">
        {banner}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="eyebrow">Situation</span>
          <span className="flex items-center gap-2">
            <Sigil id={mod?.id} size={16} className="text-fg-dim" />
            <span className="caption">{mod?.name}</span>
          </span>
        </div>

        <h2 className="case-title mt-3">{sc.title}</h2>
        <p className="lead measure mt-3">{sc.situation}</p>

        <div className="mt-5 space-y-2.5">
          {sc.options.map((opt, i) => (
            <OptionRow
              key={opt.id}
              opt={opt}
              index={i}
              state={playState}
              // `isPicked` is the prop OptionRow destructures. Passing `picked`
              // left the user's own wrong answer with no red ring, no X and no
              // shake — indistinguishable from an option they never chose.
              isPicked={picked === opt.id}
              isCorrect={opt.id === sc.correct}
              onPick={pick}
            />
          ))}
        </div>

        {/* ---------------- the reveal: verdict -> why -> reward, ~1.6s ------- */}
        <AnimatePresence>
          {step >= 1 && (
            <motion.section
              key="verdict"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: EASE }}
              className="mt-6 border-t border-white/[0.06] pt-5"
            >
              <div className="flex items-center gap-2.5">
                {isWin ? (
                  <Check size={22} strokeWidth={3} className="shrink-0 text-good" />
                ) : (
                  <X size={22} strokeWidth={3} className="shrink-0 text-danger" />
                )}
                <h3 className="t2">{isWin ? 'Right call' : 'Not this time'}</h3>
              </div>
              <p className="copy mt-2 measure">{verdictCopy}</p>
              <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className={`num-lg ${isWin ? 'text-xp-300' : 'text-fg-dim'}`}>
                  +{isWin ? XP_RULES.sixtySecond : 0} XP
                </span>
                <span className="caption">
                  {isWin
                    ? 'Banked by this run. Up to 3 clears a day pay XP.'
                    : 'No clear bonus — the reward needs the right move.'}
                </span>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {step >= 2 && (
            <motion.section
              key="why"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="mt-5"
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
              className="mt-5"
            >
              <div className="eyebrow mb-2">{mod?.name} progress</div>
              <RewardSegments units={units} />
              {resultFooter}
              <DisclaimerNote className="mt-5" compact />
            </motion.section>
          )}
        </AnimatePresence>
      </Card>

      {phase === 'play' ? (
        <div className="flex items-center justify-between gap-3">
          <span className="caption">
            {secondsLeft >= 45 ? 'Read fast — trust the law' : 'Clock is running — decide now'}
          </span>
          <Button variant="quiet" size="sm" icon={SkipForward} onClick={skip}>
            Skip
          </Button>
        </div>
      ) : step < 3 ? (
        <p className="text-center text-caption text-fg-dim">
          Skipping or running out of time ends the run with no clear.
        </p>
      ) : null}
    </div>
  )
}
