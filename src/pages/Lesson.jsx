/**
 * Lesson — the scenario player. The emotional centre of LawLink.
 *
 * Council: docs/council/01-visual-language.md §5 R1/R4/R6/R7,
 *          docs/council/02-composition.md R9/R10/R11 §5.4,
 *          docs/council/04-narrative-motion.md §3/§5/§6.
 *
 * Four decisions live here and nowhere else:
 *   1. The scenario title is `.case-title` — the ONE place a serif is allowed large.
 *   2. Two columns: a 68ch reading column + a borderless `.hud`. The first line
 *      of the scenario sits above y=200 because 300px of chrome moved into it.
 *   3. Answering COLLAPSES the screen. 4 options become 1 insight panel.
 *   4. Nothing moves while the user is choosing. The reveal is the payoff.
 */
import { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  X,
  Lightbulb,
  Lock,
  RotateCcw,
  ExternalLink,
  AlertCircle,
  NotebookTabs,
  ScrollText,
  ListChecks,
  Trophy,
  Target,
  PartyPopper,
} from 'lucide-react'
import {
  Card,
  CardHead,
  ProgressBar,
  Pill,
  Tabs,
  LegalBasis,
  VerifiedTag,
  DisclaimerNote,
  EmptyState,
  Button,
  Sigil,
  formatNumber,
} from '../components/ui/index.jsx'
import { useStore, useActions } from '../lib/store.jsx'
import { useReducedMotionPref } from '../lib/hooks.js'
import { useAnnounce } from '../lib/announce.jsx'
import { getModuleById, nextModule } from '../data/modules.js'
import { XP_RULES } from '../lib/gamification.js'

/* The motion language, in one place for this file (04 §8.1). */
const EASE = { out: [0.16, 1, 0.3, 1] }
const WIPE = [0.22, 1, 0.36, 1]

/* The reveal beat sheet (04 §6). Offsets are ms from the click. */
const BEAT = { verdict: 0.18, why: 0.42, ledger: 0.7, law: 0.9, xp: 1.15, door: 1.4 }

/* ================================================================ overview */
function Overview({ mod }) {
  return (
    <div className="space-y-8">
      <Card>
        <h2 className="t2">{mod.intro.heading}</h2>
        <div className="mt-3 space-y-3">
          {mod.intro.body.map((p, i) => (
            <p key={i} className="copy measure">
              {p}
            </p>
          ))}
        </div>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {mod.intro.keyPoints.map((k, i) => (
            <li key={i} className="flex items-start gap-2.5 rounded-xl bg-white/[0.03] px-3 py-2.5">
              <Check size={14} className="mt-0.5 shrink-0 text-good" strokeWidth={3} />
              <span className="text-body leading-snug">{k}</span>
            </li>
          ))}
        </ul>
      </Card>

      <LegalBasis basis={mod.legalBasis} source={mod.source} lastVerified={mod.lastVerified} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <p className="eyebrow mb-2">Who to contact</p>
          <p className="t3">{mod.authority.name}</p>
          <p className="copy mt-1">{mod.authority.role}</p>
          <a
            href={mod.authority.link}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-3 inline-flex items-center gap-1.5 text-body font-semibold text-electric-300 hover:underline"
          >
            Open official site
            <ExternalLink size={13} />
          </a>
        </Card>

        <Card className="p-4">
          <p className="eyebrow mb-2">If it is urgent</p>
          {mod.emergency?.length ? (
            <ul className="divide-y divide-white/[0.05]">
              {mod.emergency.map((e) => (
                <li key={e.label} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="block truncate text-body font-semibold">{e.label}</span>
                    <span className="block truncate text-caption">{e.note}</span>
                  </span>
                  <a
                    href={`tel:${e.number}`}
                    className="num shrink-0 rounded-lg bg-danger/12 px-2.5 py-1.5 text-danger ring-1 ring-inset ring-danger/25 hover:bg-danger/20"
                  >
                    {e.number}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="copy">
              For any immediate danger call <span className="font-bold text-danger">112</span>.
            </p>
          )}
        </Card>
      </div>

      {mod.resources?.length > 0 && (
        <div>
          <p className="eyebrow mb-3">Trusted resources</p>
          <ul className="divide-y divide-white/[0.05]">
            {mod.resources.map((r) => (
              <li key={r.href + r.label}>
                <a
                  href={r.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group flex items-center gap-2.5 py-2.5"
                >
                  <ExternalLink size={13} className="shrink-0 text-fg-faint group-hover:text-electric-300" />
                  <span className="min-w-0 flex-1 truncate text-body font-semibold">{r.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* ================================================================= lessons */
function Lessons({ mod, stats }) {
  const { actions } = useActions()
  const rec = stats || {}
  const left = mod.lessons.filter((l) => !rec.lessonIds?.includes(l.id)).length

  return (
    <div className="space-y-8">
      <CardHead
        eyebrow="Short reads"
        title="Two minutes of context"
        sub={
          left
            ? `${left} of ${mod.lessons.length} still unread · each one is worth ${XP_RULES.lessonRead} XP.`
            : `All ${mod.lessons.length} lessons read. Re-read any of them below.`
        }
      />
      {mod.lessons.map((l) => {
        const read = rec.lessonIds?.includes(l.id)
        return (
          <Card key={l.id}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <h3 className="t3">{l.title}</h3>
              {read && (
                <Pill tone="good" icon={Check}>
                  Read
                </Pill>
              )}
            </div>
            <div className="space-y-2.5">
              {l.body.map((p, j) => (
                <p key={j} className="copy measure">
                  {p}
                </p>
              ))}
            </div>
            <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-xp-400/[0.06] px-3 py-2.5">
              <Lightbulb size={13} className="mt-0.5 shrink-0 text-xp-300" strokeWidth={2.3} />
              <p className="text-body font-semibold leading-snug text-xp-200">{l.takeaway}</p>
            </div>
            {!read && (
              <Button
                variant="ghost"
                className="mt-4"
                onClick={() => actions.readLesson(mod.id, l.id)}
                iconRight={ArrowRight}
              >
                Mark as read · +{XP_RULES.lessonRead} XP
              </Button>
            )}
          </Card>
        )
      })}
    </div>
  )
}

/* ============================================================== scenarios */
function Scenarios({ mod, stats, i, jump, picked, setPicked, xpHere, setXpHere, onBanked, revealRef, rewardRef }) {
  const { actions } = useActions()
  const reduce = useReducedMotionPref()
  const [busy, setBusy] = useState(false)
  const say = useAnnounce()

  const sc = mod.scenarios[i]
  const done = Boolean(stats.scenarioIds?.includes(sc.id))
  const revealed = picked !== null
  const right = picked === sc.correct
  const last = i === mod.scenarios.length - 1

  /* The verdict is the entire point of the product and it is invisible to a
     screen reader. Answering also unmounts the focused option button, which
     dropped focus to <body> — so the next Tab restarted at the page top.
     Announce the outcome and move focus to the reveal. */
  useEffect(() => {
    if (!revealed || !picked) return
    say(
      `${right ? 'Correct.' : 'Not correct.'} ${
        done ? 'No XP, you already cleared this one.' : `+${XP_RULES.scenario} XP.`
      } ${sc.why}`,
    )
    const id = requestAnimationFrame(() => revealRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [revealed, picked, right, done, sc, say, revealRef])

  const answer = async (optId) => {
    if (revealed || busy) return
    setPicked(optId)
    if (done) return
    setBusy(true)
    setXpHere(XP_RULES.scenario)
    try {
      await actions.completeScenario(mod.id, sc.id, optId === sc.correct)
      onBanked(XP_RULES.scenario)
    } finally {
      setBusy(false)
    }
  }

  const retry = () => {
    setPicked(null)
    setXpHere(0)
  }

  const next = () => jump((i + 1) % mod.scenarios.length)

  /* Under reduced motion the choreography collapses: same order, no travel. */
  const dur = (n) => (reduce ? 0.001 : n)

  /* The reveal is taller than the fold, so the payoff would otherwise play out
     of sight — the judge clicks an option and sees nothing land. Pull the reward
     to the bottom edge (not the top) so the verdict stays in frame and the user
     scrolls *with* the story. Skipped under reduced motion: no travel, no jump. */
  useEffect(() => {
    if (!revealed || reduce) return
    const id = requestAnimationFrame(() =>
      rewardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }),
    )
    return () => cancelAnimationFrame(id)
  }, [revealed, reduce, rewardRef])

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={sc.id}
          initial={{ opacity: 0, x: reduce ? 0 : 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: reduce ? 0 : -24 }}
          transition={{ duration: dur(0.26), ease: EASE.out }}
        >
          <Card className="relative overflow-hidden">
            {/* ============ THE SCENE — frozen while the user is choosing ==== */}
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="eyebrow text-electric-300">Situation</span>
              <Pill tone="xp">+{XP_RULES.scenario} XP</Pill>
            </div>

            {/* The cold open. Without a time and a place there is no "now" to
                act in, so the problem reads as a fact rather than a threat. */}
            {sc.stamp && (
              <p className="mb-2 font-mono text-micro uppercase tracking-[0.18em] text-fg-dim">
                {sc.stamp}
              </p>
            )}

            <h2 className="case-title measure">{sc.title}</h2>

            <p className="lead measure mt-3">{sc.situation}</p>

            {sc.hint && !revealed && (
              <p className="mt-3 flex measure items-start gap-2">
                <Lightbulb size={13} className="mt-0.5 shrink-0 text-xp-300" strokeWidth={2.3} />
                <span className="caption">{sc.hint}</span>
              </p>
            )}

            <p className="eyebrow mt-5">What would you do?</p>

            <div className="mt-2.5 space-y-2">
              {(revealed
                ? sc.options.filter((o) => o.id === sc.correct || o.id === picked)
                : sc.options
              ).map((o) => {
                const isCorrect = o.id === sc.correct
                const isPicked = picked === o.id
                const resolved = revealed && (isCorrect || isPicked)
                const ring = revealed && isCorrect ? 'ring-2 ring-inset ring-good/30' : ''
                const ringBad =
                  revealed && isPicked && !isCorrect ? 'ring-2 ring-inset ring-danger/30' : ''
                const row = `flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-body ${
                  revealed ? 'bg-white/[0.025]' : ''
                } ${ring} ${ringBad}`

                const body = (
                  <>
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-micro font-extrabold uppercase ${
                        revealed && isCorrect
                          ? 'bg-good/15 text-good'
                          : revealed && isPicked
                            ? 'bg-danger/15 text-danger'
                            : 'bg-white/[0.06] text-fg-muted'
                      }`}
                    >
                      {o.id.toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">{o.text}</span>
                    {/* Colour is never the only signal: the letter always stays,
                        and the resolved rows carry a glyph too. */}
                    {resolved && (
                      <span className="shrink-0">
                        {isCorrect ? (
                          <Check size={16} className="text-good" strokeWidth={3} aria-label="Correct answer" />
                        ) : (
                          <X size={16} className="text-danger" strokeWidth={3} aria-label="Your answer, not correct" />
                        )}
                      </span>
                    )}
                  </>
                )

                /* A revealed row is a result, not a control — so it stops being
                   a button, which also stops `.pressable:hover` from eating the
                   semantic ring on hover. */
                return revealed ? (
                  <div key={o.id} className={row}>
                    {body}
                  </div>
                ) : (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => answer(o.id)}
                    className={`pressable cursor-pointer ${row}`}
                  >
                    {body}
                  </button>
                )
              })}
            </div>

            {!revealed && done && (
              <p className="caption mt-4">
                You already cleared this one — replay it any time, the XP is not awarded twice.
              </p>
            )}

            {/* ============ THE REVEAL — one panel, not four new boxes ======== */}
            <AnimatePresence>
              {revealed && (
                <motion.div
                  key="reveal"
                  ref={revealRef}
                  tabIndex={-1}
                  className="mt-5 overflow-hidden focus:outline-none"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: dur(0.3), ease: EASE.out }}
                >
                  <div className="rounded-2xl bg-white/[0.035] p-4">
                    {/* beat 1 — the verdict, immediately */}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: dur(BEAT.verdict), duration: dur(0.24), ease: EASE.out }}
                      className="flex items-center gap-2.5"
                    >
                      {right ? (
                        <Check size={17} className="shrink-0 text-good" strokeWidth={3} />
                      ) : (
                        <X size={17} className="shrink-0 text-danger" strokeWidth={3} />
                      )}
                      <span className={`t3 ${right ? 'text-good' : 'text-danger'}`}>
                        {right ? 'Correct' : 'Not quite'}
                      </span>
                    </motion.div>

                    {/* beat 2 — the law that decided it */}
                    <motion.div
                      initial={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
                      animate={{ opacity: 1, clipPath: 'inset(0 0 0% 0)' }}
                      transition={{ delay: dur(BEAT.why), duration: dur(0.42), ease: WIPE }}
                    >
                      <p className="eyebrow mt-4 mb-1.5">Why</p>
                      <p className="copy measure">{sc.why}</p>
                    </motion.div>

                    <div className="my-4 h-px bg-white/[0.07]" />

                    {/* beat 3 — the ledger. Hairline-divided, never two cards. */}
                    <motion.div
                      initial={{ opacity: 0, x: reduce ? 0 : 14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: dur(BEAT.ledger), duration: dur(0.24), ease: EASE.out }}
                      className="grid divide-y divide-white/[0.07] sm:grid-cols-2 sm:divide-x sm:divide-y-0"
                    >
                      <div className="sm:pr-4">
                        <p className="eyebrow mb-2">Your rights</p>
                        <ul className="space-y-1.5">
                          {sc.rights.map((r, k) => (
                            <li key={k} className="flex items-start gap-2 text-caption leading-snug text-fg-muted">
                              <Check size={12} className="mt-0.5 shrink-0 text-good" strokeWidth={3} />
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="sm:pl-4">
                        <p className="eyebrow mb-2">Do this</p>
                        <ol className="space-y-1.5">
                          {sc.doThis.map((d) => (
                            <li key={d.step} className="flex items-start gap-2 text-caption leading-snug text-fg-muted">
                              <span className="num shrink-0 text-fg-faint">{d.step}</span>
                              {d.text}
                            </li>
                          ))}
                        </ol>
                      </div>
                    </motion.div>

                    <div className="my-4 h-px bg-white/[0.07]" />

                    {/* beat 4 — sourced, dated, and the one load-bearing disclaimer */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: dur(BEAT.law), duration: dur(0.24) }}
                    >
                      <LegalBasis
                        basis={{ law: sc.law, note: null }}
                        source={sc.source}
                        lastVerified={sc.lastVerified}
                        className="!rounded-none !bg-transparent !p-0 !shadow-none"
                      />
                      <DisclaimerNote className="mt-3" compact />
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* beat 5 — the reward, then the door out, last. */}
            <AnimatePresence>
              {revealed && (
                <motion.div
                  key="reward"
                  ref={rewardRef}
                  initial={{ opacity: 0, y: reduce ? 0 : 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: dur(BEAT.xp), duration: dur(0.24), ease: EASE.out }}
                  className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-white/[0.07] pt-4"
                >
                  {/* R3: nothing here counts up. The figure is static text —
                      the only motion is the reward arriving at all. */}
                  <p className="text-body font-semibold text-xp-300">
                    {xpHere ? `+${xpHere} XP` : 'No XP this time'}
                    <span className="ml-1.5 font-body text-caption font-normal text-fg-dim">
                      {xpHere ? 'banked for working through it' : 'you already cleared this scenario'}
                    </span>
                  </p>
                  <motion.div
                    initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: dur(BEAT.door), duration: dur(0.24), ease: EASE.out }}
                    className="flex items-center gap-2"
                  >
                    <Button variant="ghost" size="sm" onClick={retry} icon={RotateCcw}>
                      Try again
                    </Button>
                    <Button variant="primary" onClick={next} iconRight={ArrowRight}>
                      {last ? 'Finish scenarios' : 'Next scenario'}
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </AnimatePresence>
    </>
  )
}

/* ==================================================================== quiz */
function Quiz({ mod, stats }) {
  const { actions } = useActions()
  const reduce = useReducedMotionPref()
  const total = mod.quiz.length
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState(null)
  const [answers, setAnswers] = useState([])
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const q = mod.quiz[i]
  const correct = answers.filter(Boolean).length
  const pct = total ? Math.round((correct / total) * 100) : 0

  const choose = (optIdx) => {
    if (picked !== null || busy) return
    setPicked(optIdx)
  }

  const nextQ = async () => {
    const nextAnswers = [...answers, picked === q.correct]
    setAnswers(nextAnswers)
    if (i + 1 < total) {
      setI(i + 1)
      setPicked(null)
      return
    }
    setBusy(true)
    try {
      const score = nextAnswers.filter(Boolean).length
      await actions.completeQuiz(mod.id, score, total)
      setDone(true)
    } finally {
      setBusy(false)
    }
  }

  const restart = () => {
    setI(0)
    setPicked(null)
    setAnswers([])
    setDone(false)
  }

  if (done) {
    const gained = correct * XP_RULES.quizCorrect
    const isBest = correct >= (stats.quizBest || 0)
    return (
      <div className="space-y-4">
        <Card className="p-6 text-center sm:p-7">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-xp-400/12">
            {pct >= 80 ? (
              <Trophy size={24} className="text-xp-300" strokeWidth={2.2} />
            ) : (
              <Target size={24} className="text-fg-muted" strokeWidth={2.2} />
            )}
          </div>
          {/* The one num-xl on this screen, and the only reason to take the quiz. */}
          <p className="flex items-baseline justify-center gap-1.5">
            <span className="num-xl">{correct}</span>
            <span className="num-lg text-fg-dim">/ {total}</span>
          </p>
          <p className="t3 mt-3">
            {pct >= 90
              ? 'Outstanding — you know this module.'
              : pct >= 80
                ? 'Strong. Module complete.'
                : pct >= 50
                  ? 'Solid start. Read the lessons once more.'
                  : 'Worth another pass — this one matters.'}
          </p>
          <div className="mx-auto mt-5 max-w-xs">
            <ProgressBar value={pct} variant="xp" size="lg" />
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Pill tone="xp">+{gained} XP earned</Pill>
            {isBest && stats.quizTaken > 1 && <Pill tone="good">New personal best</Pill>}
            {pct >= 80 && !stats.completed && <Pill tone="good">Module completed</Pill>}
          </div>
          <div className="mt-7 flex flex-col justify-center gap-2.5 sm:flex-row">
            <Button variant="ghost" onClick={restart} icon={RotateCcw}>
              Retake quiz
            </Button>
            <Button variant="primary" as={Link} to="/journey" iconRight={ArrowRight}>
              Back to the journey
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <span className="eyebrow">
          Question {i + 1} of {total}
        </span>
        <span className="caption tnum">{correct} correct so far</span>
      </div>
      <ProgressBar value={i + (picked !== null ? 1 : 0)} max={total} />

      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: reduce ? 0 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: reduce ? 0 : -20 }}
          transition={{ duration: reduce ? 0.001 : 0.25, ease: EASE.out }}
        >
          <Card>
            <h2 className="t2 measure">{q.question}</h2>

            <div className="mt-4 space-y-2">
              {q.options.map((o, oi) => {
                const isCorrect = oi === q.correct
                const isPicked = picked === oi
                const answered = picked !== null
                const resolved = answered && (isCorrect || isPicked)
                const row = `flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-body ${
                  answered ? 'bg-white/[0.025]' : ''
                } ${answered && !resolved ? 'opacity-40' : ''} ${
                  answered && isCorrect ? 'ring-2 ring-inset ring-good/30' : ''
                } ${
                  answered && isPicked && !isCorrect ? 'ring-2 ring-inset ring-danger/30' : ''
                }`

                const body = (
                  <>
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-micro font-extrabold uppercase ${
                        answered && isCorrect
                          ? 'bg-good/15 text-good'
                          : answered && isPicked
                            ? 'bg-danger/15 text-danger'
                            : 'bg-white/[0.06] text-fg-muted'
                      }`}
                    >
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <span className="min-w-0 flex-1">{o}</span>
                    {resolved && (
                      <span className="shrink-0">
                        {isCorrect ? (
                          <Check size={16} className="text-good" strokeWidth={3} aria-label="Correct answer" />
                        ) : (
                          <X size={16} className="text-danger" strokeWidth={3} aria-label="Your answer, not correct" />
                        )}
                      </span>
                    )}
                  </>
                )

                return answered ? (
                  <div key={oi} className={row}>
                    {body}
                  </div>
                ) : (
                  <button
                    key={oi}
                    type="button"
                    onClick={() => choose(oi)}
                    className={`pressable cursor-pointer ${row}`}
                  >
                    {body}
                  </button>
                )
              })}
            </div>

            {picked !== null && (
              <motion.div
                className="mt-5 overflow-hidden"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                transition={{ duration: reduce ? 0.001 : 0.3, ease: EASE.out }}
              >
                <div className="rounded-2xl bg-white/[0.035] p-4">
                  <div className="flex items-center gap-2.5">
                    {picked === q.correct ? (
                      <Check size={17} className="shrink-0 text-good" strokeWidth={3} />
                    ) : (
                      <X size={17} className="shrink-0 text-danger" strokeWidth={3} />
                    )}
                    <span className={`t3 ${picked === q.correct ? 'text-good' : 'text-danger'}`}>
                      {picked === q.correct ? `Correct · +${XP_RULES.quizCorrect} XP` : 'Incorrect'}
                    </span>
                  </div>
                  <div className="my-3.5 h-px bg-white/[0.07]" />
                  <p className="eyebrow mb-1.5">Why</p>
                  <p className="copy measure">{q.why}</p>
                  <p className="caption mt-2.5">
                    <span className="font-semibold text-fg-muted">Basis:</span> {q.law}
                  </p>
                </div>
              </motion.div>
            )}

            {picked !== null && (
              <div className="mt-5 flex justify-end">
                <Button
                  variant="primary"
                  onClick={nextQ}
                  loading={busy}
                  iconRight={i + 1 < total ? ArrowRight : PartyPopper}
                >
                  {i + 1 < total ? 'Next question' : 'See my score'}
                </Button>
              </div>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/* ===================================================================== HUD */
/**
 * The right column. Hairlines only — never a `.sheet`, never a border box.
 * It carries the four things a scenario player needs beside a decision:
 * where you are, what you picked, what it banked, and the way out to /ai.
 */
function Hud({ mod, stats, level, i, jump, picked, banked }) {
  const sc = mod.scenarios[i]
  const pickedOpt = picked ? sc.options.find((o) => o.id === picked) : null
  const pct = Math.round((stats.scenariosDone / mod.scenarios.length) * 100)

  return (
    <aside className="hud" aria-label="Module and scenario progress">
      {/* where you are */}
      <div className="flex items-start gap-2.5">
        <Sigil id={mod.sigil} size="sm" className="mt-0.5 shrink-0 text-electric-300" />
        <div className="min-w-0">
          <p className="t3 truncate">{mod.name}</p>
          <p className="caption truncate">
            {mod.difficulty} · ~{mod.minutes} min · {formatNumber(stats.xpTotal)} XP
          </p>
          <VerifiedTag date={mod.lastVerified} className="mt-1.5" />
        </div>
      </div>

      {/* the pips — these replace the old "SCENARIO 4 OF 5" progress card */}
      <div>
        <p className="eyebrow mb-2">Scenarios</p>
        {/* The pip is a 6px bar, but the BUTTON is a full 24px-tall hit area
            (WCAG 2.5.8 floor is 24px; the brief's comfort target is 44px). A
            6px button that silently swaps you to a different legal scenario
            mid-question is a misfire, not a control. Negative margins keep the
            visual 6px while the target is 24px. */}
        <div className="-my-2 flex gap-1.5">
          {mod.scenarios.map((s, k) => (
            <button
              key={s.id}
              type="button"
              onClick={() => jump(k)}
              aria-label={`Go to scenario ${k + 1} of ${mod.scenarios.length}`}
              aria-current={k === i ? 'true' : undefined}
              className="group flex h-6 flex-1 cursor-pointer items-center"
            >
              <span
                className={`h-1.5 w-full rounded-full transition-colors ${
                  k === i
                    ? 'bg-electric-400'
                    : stats.scenarioIds?.includes(s.id)
                      ? 'bg-good/55'
                      : 'bg-white/10 group-hover:bg-white/25'
                }`}
              />
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-2">
          <span className="caption tnum">
            {stats.scenariosDone} of {mod.scenarios.length} cleared
          </span>
          <span className="eyebrow tnum">{pct}%</span>
        </div>
        <ProgressBar value={pct} size="sm" className="mt-2" />
      </div>

      {/* what you picked */}
      <div>
        <p className="eyebrow mb-1.5">Your pick</p>
        {pickedOpt ? (
          <p className="flex gap-2 text-caption leading-snug text-fg-muted">
            <span className="num shrink-0 text-fg">{pickedOpt.id.toUpperCase()}</span>
            <span className="line-clamp-2">{pickedOpt.text}</span>
          </p>
        ) : (
          <p className="caption">Not answered yet.</p>
        )}
      </div>

      {/* what it banked */}
      <div>
        <p className="eyebrow mb-1.5">XP banked</p>
        <p className="flex items-baseline gap-2">
          <span className="num text-xp-300">+{formatNumber(banked)}</span>
          <span className="caption">this session</span>
        </p>
        <p className="caption tnum mt-1">
          {formatNumber(level.xp)} XP total ·{' '}
          {level.isMax
            ? 'highest level reached'
            : `${formatNumber(level.toNext)} to L${String(level.level + 1).padStart(2, '0')}`}
        </p>
        <ProgressBar value={level.pct} variant="xp" size="sm" className="mt-2" />
      </div>

      {/* the way out */}
      <div>
        <Link
          to="/ai"
          className="group flex items-center justify-between gap-2 text-body font-semibold text-fg-muted hover:text-white"
        >
          <span>Was this you right now?</span>
          <ArrowRight
            size={15}
            className="shrink-0 text-fg-faint transition-colors group-hover:text-electric-300"
          />
        </Link>
        <p className="caption mt-1">Describe it to LawLink AI in your own words.</p>
      </div>
    </aside>
  )
}

/* =================================================================== page */
const TABS = (mod) => [
  { key: 'intro', label: 'Overview', icon: BookOpen },
  { key: 'lessons', label: `Lessons (${mod.lessons.length})`, icon: NotebookTabs },
  { key: 'scenario', label: `Scenarios (${mod.scenarios.length})`, icon: ScrollText },
  { key: 'quiz', label: `Quiz (${mod.quiz.length})`, icon: ListChecks },
]

/** Index of the first scenario the user has not cleared, else 0. */
function firstUndone(mod, stats) {
  if (!mod || !stats) return 0
  const k = mod.scenarios.findIndex((s) => !stats.scenarioIds?.includes(s.id))
  return k === -1 ? 0 : k
}

export default function Lesson() {
  const { moduleId } = useParams()
  const [params, setParams] = useSearchParams()
  const nav = useNavigate()
  const { stats, unlocked, level } = useStore()
  const mod = getModuleById(moduleId)
  const s = stats[moduleId]

  const tab = params.get('tab') || 'intro'
  const setTab = (t) => setParams(t === 'intro' ? {} : { tab: t }, { replace: true })

  /* Scenario state lives here, not in the child, because the HUD reads it. */
  const [i, setI] = useState(() => firstUndone(mod, s))
  const [picked, setPicked] = useState(null)
  const [banked, setBanked] = useState(0)
  const [xpHere, setXpHere] = useState(0)
  const rewardRef = useRef(null)
  const revealRef = useRef(null)

  /** The one way to leave a scenario — from a pip or from "Next scenario". */
  const jump = (k) => {
    setI(k)
    setPicked(null)
    setXpHere(0)
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    setI(firstUndone(getModuleById(moduleId), stats[moduleId]))
    setPicked(null)
    setBanked(0)
    setXpHere(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId])

  if (!mod || !s) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Module not found"
        body="That topic does not exist. Head back to the Learn page to pick one."
        action={
          <Button variant="primary" onClick={() => nav('/learn')}>
            Back to Learn
          </Button>
        }
      />
    )
  }

  if (unlocked[mod.id] === false) {
    return (
      <div className="mx-auto max-w-lg">
        <EmptyState
          icon={Lock}
          title="This mission is locked"
          body="Finish the previous module on the Legal Journey map to unlock this one."
          action={
            <Button variant="primary" onClick={() => nav('/journey')} iconRight={ArrowRight}>
              Open the journey map
            </Button>
          }
        />
      </div>
    )
  }

  const next = nextModule(mod.id)

  return (
    <div className="mx-auto w-full max-w-[1180px]">
      {/* ONE thin band: the way back, the module, and the tabs. Everything
          else about the module now lives in the HUD. */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={() => nav(-1)} className="btn btn-quiet btn-sm -ml-3 shrink-0">
            <ArrowLeft size={14} />
            Back
          </button>
          <span className="hidden min-w-0 items-center gap-2 sm:flex">
            <Sigil id={mod.sigil} size="xs" className="shrink-0 text-electric-300" />
            <span className="t3 truncate">{mod.name}</span>
            {s.completed && (
              <Pill tone="good" icon={Check}>
                Complete
              </Pill>
            )}
          </span>
        </div>
        <Tabs tabs={TABS(mod)} value={tab} onChange={setTab} />
      </div>

      {/* the reading column + the borderless HUD. 300px of chrome, gone. */}
      <div className="mt-3 flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,68ch)_320px] lg:items-start lg:gap-10 lg:mt-4">
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: EASE.out }}
            >
              {tab === 'intro' && <Overview mod={mod} />}
              {tab === 'lessons' && <Lessons mod={mod} stats={s} />}
              {tab === 'scenario' && (
                <Scenarios
                  mod={mod}
                  stats={s}
                  i={i}
                  jump={jump}
                  picked={picked}
                  setPicked={setPicked}
                  xpHere={xpHere}
                  setXpHere={setXpHere}
                  onBanked={(n) => setBanked((v) => v + n)}
                  revealRef={revealRef}
                  rewardRef={rewardRef}
                />
              )}
              {tab === 'quiz' && <Quiz mod={mod} stats={s} />}
            </motion.div>
          </AnimatePresence>

          {/* module complete — one sheet, one ghost action (the screen's only
              primary belongs to the scenario/quiz it is following) */}
          {s.completed && next && (
            <Card className="mt-8 flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <Sigil id={next.sigil} size="sm" className="shrink-0 text-fg-muted" />
                <div className="min-w-0">
                  <p className="t3">Module complete</p>
                  <p className="caption truncate">Next up: {next.name}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => nav(`/lesson/${next.id}`)}
                icon={ArrowRight}
              >
                Start {next.name}
              </Button>
            </Card>
          )}
        </div>

        <Hud
          mod={mod}
          stats={s}
          level={level}
          i={i}
          jump={jump}
          picked={picked}
          banked={banked}
        />
      </div>
    </div>
  )
}
