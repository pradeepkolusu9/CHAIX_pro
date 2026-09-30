/**
 * Lesson — the scenario player. The emotional centre of LawLink (HEAVEN pass).
 *
 * Shape: module header (tile + breadcrumbs) -> segmented tabs with counts ->
 * a reading column and a sticky rail (a slim sticky bar on mobile).
 * Behaviour is unchanged: XP awarding, announcer + focus on reveal, the
 * reward/reveal refs, per-module state reset, locked / not-found states.
 */
import { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
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
  PartyPopper,
  Star,
  Sparkles,
  Scale,
  ShieldCheck,
  ListOrdered,
  Phone,
  MessageSquareText,
  Mail,
  BellRing,
  ChevronRight,
  LifeBuoy,
  Landmark,
  Zap,
} from 'lucide-react'
import {
  Card,
  ProgressBar,
  Pill,
  LegalBasis,
  VerifiedTag,
  DisclaimerNote,
  EmptyState,
  Button,
  Sigil,
  IconBadge,
  formatNumber,
} from '../components/ui/index.jsx'
import { toneFor } from '../lib/moduleTone.js'
import { useStore, useActions } from '../lib/store.jsx'
import { useReducedMotionPref } from '../lib/hooks.js'
import { useAnnounce } from '../lib/announce.jsx'
import { getModuleById, nextModule } from '../data/modules.js'
import { XP_RULES } from '../lib/gamification.js'

const EASE = { out: [0.16, 1, 0.3, 1] }
const WIPE = [0.22, 1, 0.36, 1]

/* The reveal beat sheet. Offsets are seconds from the click. */
const BEAT = { verdict: 0.12, why: 0.36, ledger: 0.6, law: 0.8, xp: 1.0, door: 1.25 }

/* ============================================================ shared bits */
/** Module identity tile: the sigil inside a module-coloured tile. */
function ModuleTile({ mod, className = 'h-14 w-14 rounded-2xl', size = 'md' }) {
  return (
    <div className={`tile tile-${toneFor(mod.id)} ${className}`}>
      <Sigil id={mod.sigil} size={size} />
    </div>
  )
}

/** A checklist rendered as a tinted inset. */
function Checklist({ title, items, icon: Icon = Check, tone = 'good' }) {
  const c = tone === 'xp' ? 'text-xp-300' : 'text-good'
  return (
    <div className="inset p-4 sm:p-5">
      {title && <p className="eyebrow mb-3">{title}</p>}
      <ul className="space-y-2.5">
        {items.map((k, i) => (
          <li key={i} className="flex items-start gap-3">
            <Icon size={16} className={`mt-[3px] shrink-0 ${c}`} strokeWidth={2.8} />
            <span className="text-[15.5px] font-medium leading-snug text-fg">{k}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Prose block: 64ch column, 17px lead paragraph, 16px body. */
function Prose({ paras }) {
  return (
    <div className="max-w-[64ch] space-y-4">
      {paras.map((p, i) => (
        <p
          key={i}
          className={
            i === 0
              ? 'font-body text-[17px] leading-[1.7] text-fg'
              : 'font-body text-[16px] leading-[1.75] text-fg-muted'
          }
        >
          {p}
        </p>
      ))}
    </div>
  )
}

/**
 * One answer row, used by scenarios and the quiz.
 * state: idle (pressable) | correct | wrong | dim (static results).
 */
function OptionRow({ letter, text, state = 'idle', onClick }) {
  const resolved = state === 'correct' || state === 'wrong'
  const tile =
    state === 'correct'
      ? 'bg-good text-pure'
      : state === 'wrong'
        ? 'bg-danger text-pure'
        : 'bg-surface-3 text-electric-300 group-hover:bg-electric-500 group-hover:text-pure'
  const cls = `group flex w-full items-center gap-4 px-4 py-4 text-left sm:px-5 ${
    state === 'correct'
      ? 'rounded-[18px] bg-good/[0.08] ring-2 ring-inset ring-good/40'
      : state === 'wrong'
        ? 'rounded-[18px] bg-danger/[0.07] ring-2 ring-inset ring-danger/35'
        : state === 'dim'
          ? 'rounded-[18px] bg-white/[0.025] opacity-50'
          : 'pressable cursor-pointer'
  }`
  const body = (
    <>
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl font-sans text-[15px] font-extrabold uppercase transition-colors ${tile}`}
      >
        {letter}
      </span>
      <span className="min-w-0 flex-1 text-[16px] font-medium leading-snug text-fg">{text}</span>
      {resolved ? (
        state === 'correct' ? (
          <Check size={20} className="shrink-0 text-good" strokeWidth={3} aria-label="Correct answer" />
        ) : (
          <X size={20} className="shrink-0 text-danger" strokeWidth={3} aria-label="Your answer, not correct" />
        )
      ) : (
        state === 'idle' && (
          <ChevronRight
            size={18}
            className="shrink-0 text-fg-faint transition-all group-hover:translate-x-0.5 group-hover:text-electric-300"
          />
        )
      )}
    </>
  )
  return state === 'idle' ? (
    <button type="button" onClick={onClick} className={cls}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  )
}

/** Verdict banner: tinted, with an icon tile. */
function Verdict({ right, label, sub }) {
  return (
    <div
      className={`flex items-center gap-4 rounded-2xl px-4 py-4 sm:px-5 ${
        right ? 'bg-good/[0.09] ring-1 ring-inset ring-good/25' : 'bg-danger/[0.07] ring-1 ring-inset ring-danger/25'
      }`}
    >
      <IconBadge icon={right ? Check : X} tone={right ? 'good' : 'danger'} size="lg" />
      <div className="min-w-0">
        <p className={`font-sans text-[22px] font-extrabold leading-tight ${right ? 'text-good' : 'text-danger'}`}>
          {label}
        </p>
        {sub && <p className="mt-0.5 text-[14px] leading-snug text-fg-muted">{sub}</p>}
      </div>
    </div>
  )
}

/* Which kind of message does this scenario show? null = not a message.
   Opt-in: `sc.channel` ('sms'|'whatsapp'|'email'|'call'|'notification'). Until the data
   carries it, fall back to a strict heuristic: the text must OPEN with the message
   ("You get an SMS…", "A message arrives…"), never merely mention one. */
const CHANNELS = {
  sms: { name: 'SMS', icon: MessageSquareText },
  whatsapp: { name: 'WhatsApp', icon: MessageSquareText },
  email: { name: 'Email', icon: Mail },
  call: { name: 'Incoming call', icon: Phone },
  notification: { name: 'Notification', icon: BellRing },
}
const OPENER =
  /^(?:at [\d:.]+\s?[ap]m,? )?(?:you (?:get|got|receive|received) an? (sms|text message|text|message|email|e-mail|whatsapp message|whatsapp|call)\b|an? (sms|text message|whatsapp message|message|email|e-mail) (?:arrives|comes in|pops up)\b)/i
function channelOf(sc) {
  let key = CHANNELS[sc.channel] ? sc.channel : null
  if (!key) {
    const m = sc.situation?.trim().match(OPENER)
    const w = (m?.[1] || m?.[2] || '').toLowerCase()
    if (w) {
      key = /whatsapp/.test(w) ? 'whatsapp' : /mail/.test(w) ? 'email' : w === 'call' ? 'call' : /sms|text/.test(w) ? 'sms' : 'notification'
      if (key === 'notification' && /whatsapp/i.test(sc.situation.slice(0, 160))) key = 'whatsapp'
    }
  }
  return key ? { key, ...CHANNELS[key] } : null
}
/** Sender as named in the text: from "Name", else "from your <relation>'s number". */
function senderOf(text, ch) {
  const q = text.match(/from\s+["\u201c]([^"\u201d]{1,40})["\u201d]/i)
  if (q) return q[1]
  const rel = text.match(/from (your [a-z ]{2,30}?)(?:'s|\u2019s) (?:number|account|email)/i)
  if (rel) return rel[1].charAt(0).toUpperCase() + rel[1].slice(1)
  return ch.key === 'call' ? 'Unknown caller' : 'Unknown sender'
}

/** The situation as a phone screen: the scam message, as it would look. */
function PhoneMock({ ch, text, stamp }) {
  const Icon = ch.icon
  const time = stamp?.match(/\d{1,2}[:.]\d{2}\s?(?:am|pm)?/i)?.[0] || 'Now'
  return (
    <div className="mx-auto w-full max-w-[380px] rounded-[32px] bg-ink-900 p-2 shadow-[0_24px_50px_-24px_rgba(15,27,61,0.6)]">
      <div className="rounded-[26px] bg-surface-3 px-4 pb-5 pt-3">
        <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-ink-900/15" aria-hidden="true" />
        <div className="mb-3 flex items-center gap-2.5">
          <IconBadge icon={Icon} tone="electric" size="xs" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold leading-tight text-fg">
              {senderOf(text, ch)}
            </p>
            <p className="text-micro text-fg-dim">{ch.name}</p>
          </div>
          <span className="tnum text-micro font-semibold text-fg-dim">{time}</span>
        </div>
        <div className="rounded-2xl rounded-tl-md bg-pure px-4 py-3 shadow-[0_1px_2px_rgba(20,34,79,0.1)]">
          <p className="font-body text-[15.5px] leading-[1.6] text-fg">{text}</p>
        </div>
      </div>
    </div>
  )
}

/* ================================================================ overview */
function Overview({ mod }) {
  return (
    <div className="space-y-12">
      <section>
        <p className="eyebrow mb-2">The big picture</p>
        <h2 className="t1 mb-5">{mod.intro.heading}</h2>
        <Prose paras={mod.intro.body} />
        <div className="mt-7 max-w-[64ch]">
          <Checklist title="Key takeaways" items={mod.intro.keyPoints} />
        </div>
      </section>

      <LegalBasis basis={mod.legalBasis} source={mod.source} lastVerified={mod.lastVerified} />

      <section className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <IconBadge icon={Landmark} tone="electric" size="md" />
          <p className="eyebrow mb-1.5 mt-4">Who to contact</p>
          <p className="t3">{mod.authority.name}</p>
          <p className="copy mt-1">{mod.authority.role}</p>
          <a
            href={mod.authority.link}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-4 inline-flex items-center gap-1.5 text-body font-semibold text-electric-300 hover:underline"
          >
            Open official site
            <ExternalLink size={13} />
          </a>
        </Card>

        <Card className="p-5">
          <IconBadge icon={LifeBuoy} tone="danger" size="md" />
          <p className="eyebrow mb-1.5 mt-4">If it is urgent</p>
          {mod.emergency?.length ? (
            <ul className="divide-y divide-white/[0.07]">
              {mod.emergency.map((e) => (
                <li key={e.label} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-body font-semibold">{e.label}</span>
                    <span className="block truncate text-caption">{e.note}</span>
                  </span>
                  <a
                    href={`tel:${e.number}`}
                    className="num shrink-0 rounded-lg bg-danger/10 px-2.5 py-2 text-danger ring-1 ring-inset ring-danger/25 hover:bg-danger/20"
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
      </section>

      {mod.resources?.length > 0 && (
        <section>
          <p className="eyebrow mb-3">Trusted resources</p>
          <ul className="divide-y divide-white/[0.07]">
            {mod.resources.map((r) => (
              <li key={r.href + r.label}>
                <a
                  href={r.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group flex items-center gap-3 py-3"
                >
                  <IconBadge icon={ExternalLink} tone="muted" size="xs" />
                  <span className="min-w-0 flex-1 truncate text-body font-semibold group-hover:text-electric-300">
                    {r.label}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

/* ================================================================= lessons */
function Lessons({ mod, stats }) {
  const { actions } = useActions()
  const say = useAnnounce()
  // Marking read unmounts the focused button: hand focus to the lesson itself.
  const markRead = (l) => {
    actions.readLesson(mod.id, l.id)
    say(`Lesson marked as read. +${XP_RULES.lessonRead} XP.`)
    requestAnimationFrame(() => document.getElementById(`lesson-${l.id}`)?.focus({ preventScroll: true }))
  }
  const rec = stats || {}
  const left = mod.lessons.filter((l) => !rec.lessonIds?.includes(l.id)).length

  return (
    <div>
      <p className="eyebrow mb-2">Short reads</p>
      <h2 className="t1">Two minutes of context</h2>
      <p className="copy mt-1.5">
        {left
          ? `${left} of ${mod.lessons.length} still unread · each one is worth ${XP_RULES.lessonRead} XP.`
          : `All ${mod.lessons.length} lessons read. Re-read any of them below.`}
      </p>

      <div className="mt-8 space-y-14">
        {mod.lessons.map((l, n) => {
          const read = rec.lessonIds?.includes(l.id)
          return (
            <article key={l.id} id={`lesson-${l.id}`} tabIndex={-1} className="scroll-mt-28 focus:outline-none">
              <div className="mb-4 flex items-start gap-3.5">
                <span className="tile tile-electric num h-10 w-10 rounded-xl">{n + 1}</span>
                <div className="min-w-0 flex-1 pt-1">
                  <h3 className="t2">{l.title}</h3>
                </div>
                {read && (
                  <Pill tone="good" icon={Check} className="mt-1.5">
                    Read
                  </Pill>
                )}
              </div>
              <Prose paras={l.body} />
              <div className="mt-6 max-w-[64ch]">
                <div className="flex items-start gap-3 rounded-2xl bg-xp-400/[0.10] px-4 py-4 ring-1 ring-inset ring-xp-500/25">
                  <IconBadge icon={Lightbulb} tone="xp" size="sm" />
                  <div className="min-w-0">
                    <p className="eyebrow !text-xp-300">Key takeaway</p>
                    <p className="mt-1 text-[16px] font-semibold leading-snug text-fg">{l.takeaway}</p>
                  </div>
                </div>
              </div>
              {!read && (
                <Button
                  variant="ghost"
                  className="mt-5"
                  onClick={() => markRead(l)}
                  iconRight={ArrowRight}
                >
                  Mark as read · +{XP_RULES.lessonRead} XP
                </Button>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}

/* ============================================================== scenarios */
function Scenarios(props) {
  if (!props.mod.scenarios?.length) {
    return <p className="copy">This module has no scenarios yet.</p>
  }
  return <ScenarioPlayer {...props} />
}

function ScenarioPlayer({ mod, stats, i, jump, setTab, picked, setPicked, xpHere, setXpHere, onBanked, revealRef, rewardRef }) {
  const { actions } = useActions()
  const reduce = useReducedMotionPref()
  const [busy, setBusy] = useState(false)
  const say = useAnnounce()
  // Was it already cleared BEFORE this pick? `done` flips true the moment the store pays.
  const doneAtPick = useRef(false)

  const sc = mod.scenarios[i]
  const done = Boolean(stats.scenarioIds?.includes(sc.id))
  const revealed = picked !== null
  const right = picked === sc.correct
  const last = i === mod.scenarios.length - 1
  const ch = channelOf(sc)

  /* The verdict is invisible to a screen reader, and answering unmounts the
     focused option button. Announce the outcome and move focus to the reveal. */
  useEffect(() => {
    if (!revealed || !picked) return
    say(
      `${right ? 'Correct.' : 'Not correct.'} ${
        doneAtPick.current ? 'No XP, you already cleared this one.' : `+${XP_RULES.scenario} XP.`
      } ${sc.why}`,
    )
    const id = requestAnimationFrame(() => revealRef.current?.focus({ preventScroll: true }))
    return () => cancelAnimationFrame(id)
    // `done` is deliberately not a dep: it flips when the store pays, which must not re-announce.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, picked])

  const answer = async (optId) => {
    if (revealed || busy) return
    doneAtPick.current = done
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

  const next = () => (last ? setTab('quiz') : jump(i + 1))

  const dur = (n) => (reduce ? 0.001 : n)

  /* Pull the reward to the bottom edge so the verdict stays in frame and the
     user scrolls with the story. Skipped under reduced motion. */
  useEffect(() => {
    if (!revealed || reduce) return
    // wait out the reveal's height animation (~300ms) so we aim at its final position
    const id = setTimeout(
      () => rewardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }),
      350,
    )
    return () => clearTimeout(id)
  }, [revealed, reduce, rewardRef])

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={sc.id}
        initial={{ opacity: 0, x: reduce ? 0 : 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: reduce ? 0 : -24 }}
        transition={{ duration: dur(0.26), ease: EASE.out }}
      >
        <div className="sheet-lg relative overflow-hidden p-5 sm:p-8">
          {/* ============ THE SCENE — frozen while the user is choosing ==== */}
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="eyebrow">
              Scenario {i + 1} of {mod.scenarios.length}
            </span>
            <Pill tone="xp" icon={Zap}>
              +{XP_RULES.scenario} XP
            </Pill>
          </div>

          {sc.stamp && (
            <p className="mb-2 font-mono text-micro uppercase tracking-[0.18em] text-fg-dim">{sc.stamp}</p>
          )}

          <h2 className="case-title max-w-[26ch] sm:max-w-none">{sc.title}</h2>

          <div className="mt-6">
            {ch ? (
              <PhoneMock ch={ch} text={sc.situation} stamp={sc.stamp} />
            ) : (
              <div className="max-w-[64ch] border-l-[3px] border-electric-400/60 pl-5">
                <p className="font-body text-[17px] leading-[1.7] text-fg">{sc.situation}</p>
              </div>
            )}
          </div>

          {sc.hint && !revealed && (
            <p className="mt-5 flex max-w-[64ch] items-start gap-2.5 rounded-xl bg-xp-400/[0.08] px-3.5 py-3">
              <Lightbulb size={15} className="mt-0.5 shrink-0 text-xp-300" strokeWidth={2.3} />
              <span className="text-[14px] leading-snug text-fg-muted">{sc.hint}</span>
            </p>
          )}

          <p className="eyebrow mb-3 mt-9">{revealed ? 'Your answer' : 'What would you do?'}</p>

          <div className="space-y-3">
            {(revealed ? sc.options.filter((o) => o.id === sc.correct || o.id === picked) : sc.options).map((o) => (
              <OptionRow
                key={o.id}
                letter={o.id.toUpperCase()}
                text={o.text}
                onClick={() => answer(o.id)}
                state={
                  !revealed ? 'idle' : o.id === sc.correct ? 'correct' : o.id === picked ? 'wrong' : 'dim'
                }
              />
            ))}
          </div>

          {!revealed && done && (
            <p className="caption mt-4">
              You already cleared this one — replay it any time, the XP is not awarded twice.
            </p>
          )}

          {/* ============ THE REVEAL ======================================== */}
          <AnimatePresence>
            {revealed && (
              <motion.div
                key="reveal"
                ref={revealRef}
                tabIndex={-1}
                className="mt-8 overflow-hidden focus:outline-none"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: dur(0.3), ease: EASE.out }}
              >
                <div className="space-y-6">
                  {/* beat 1 — the verdict */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: dur(BEAT.verdict), duration: dur(0.28), ease: EASE.out }}
                  >
                    <Verdict
                      right={right}
                      label={right ? 'Correct' : 'Not quite'}
                      sub={right ? 'That is exactly what the law backs.' : 'Here is what actually protects you.'}
                    />
                  </motion.div>

                  {/* beat 2 — why */}
                  <motion.div
                    initial={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
                    animate={{ opacity: 1, clipPath: 'inset(0 0 0% 0)' }}
                    transition={{ delay: dur(BEAT.why), duration: dur(0.42), ease: WIPE }}
                  >
                    <p className="eyebrow mb-2">Why</p>
                    <p className="max-w-[64ch] font-body text-[17px] leading-[1.7] text-fg">{sc.why}</p>
                  </motion.div>

                  {/* beat 3 — rights, then steps */}
                  <motion.div
                    initial={{ opacity: 0, y: reduce ? 0 : 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: dur(BEAT.ledger), duration: dur(0.3), ease: EASE.out }}
                    className="grid gap-4"
                  >
                    <div className="rounded-2xl bg-good/[0.07] p-4 ring-1 ring-inset ring-good/20 sm:p-5">
                      <div className="mb-3 flex items-center gap-2.5">
                        <IconBadge icon={ShieldCheck} tone="good" size="xs" />
                        <p className="eyebrow !text-good">Your rights</p>
                      </div>
                      <ul className="space-y-2.5">
                        {sc.rights.map((r, k) => (
                          <li key={k} className="flex items-start gap-2.5 text-[15px] leading-snug text-fg">
                            <Check size={15} className="mt-[3px] shrink-0 text-good" strokeWidth={3} />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="inset p-4 sm:p-5">
                      <div className="mb-3 flex items-center gap-2.5">
                        <IconBadge icon={ListOrdered} tone="electric" size="xs" />
                        <p className="eyebrow">What should you do</p>
                      </div>
                      <ol className="space-y-3">
                        {sc.doThis.map((d) => (
                          <li key={d.step} className="flex items-start gap-3 text-[15px] leading-snug text-fg">
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-electric-500 font-sans text-micro font-extrabold text-pure">
                              {d.step}
                            </span>
                            <span className="pt-0.5">{d.text}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </motion.div>

                  {/* beat 4 — sourced, and the one load-bearing disclaimer */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: dur(BEAT.law), duration: dur(0.24) }}
                  >
                    <div className="rounded-2xl bg-white/[0.035] p-4 sm:p-5">
                      <div className="mb-3 flex items-center gap-2.5">
                        <IconBadge icon={Scale} tone="muted" size="xs" />
                        <p className="eyebrow !text-fg-muted">Legal basis</p>
                      </div>
                      <LegalBasis
                        basis={{ law: sc.law, note: null }}
                        source={sc.source}
                        lastVerified={sc.lastVerified}
                        className="!rounded-none !bg-transparent !p-0 !shadow-none"
                      />
                    </div>
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
                transition={{ delay: dur(BEAT.xp), duration: dur(0.28), ease: EASE.out }}
                className="mt-8 flex scroll-mb-28 flex-wrap items-center justify-between gap-x-4 gap-y-4 border-t border-white/[0.08] pt-6"
              >
                <div className="flex items-center gap-3">
                  <motion.span
                    initial={{ scale: reduce ? 1 : 0.6 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: dur(BEAT.xp + 0.1), type: 'spring', stiffness: 420, damping: 16 }}
                    className={xpHere ? 'chip-xp !px-4 !py-2 !text-[17px] font-extrabold' : 'chip'}
                  >
                    {xpHere ? <Sparkles size={16} strokeWidth={2.4} /> : null}
                    {xpHere ? `+${xpHere} XP` : 'No XP this time'}
                  </motion.span>
                  <span className="text-caption text-fg-dim">
                    {xpHere ? 'banked for working through it' : 'you already cleared this scenario'}
                  </span>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: dur(BEAT.door), duration: dur(0.24), ease: EASE.out }}
                  className="flex flex-wrap items-center gap-2"
                >
                  <Button variant="ghost" onClick={retry} icon={RotateCcw}>
                    Try again
                  </Button>
                  <Button variant="primary" onClick={next} iconRight={ArrowRight}>
                    {last ? 'Finish scenarios' : 'Next scenario'}
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ==================================================================== quiz */
function ScoreRing({ pct, correct, total, reduce }) {
  const r = 70
  const c = 2 * Math.PI * r
  return (
    <div className="relative mx-auto h-[190px] w-[190px]">
      <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="90" cy="90" r={r} fill="none" strokeWidth="14" className="stroke-electric-500/15" />
        <motion.circle
          cx="90"
          cy="90"
          r={r}
          fill="none"
          strokeWidth="14"
          strokeLinecap="round"
          className={pct >= 80 ? 'stroke-xp-500' : 'stroke-electric-500'}
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct / 100) }}
          transition={{ duration: reduce ? 0.001 : 1.1, delay: 0.15, ease: EASE.out }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <p className="flex items-baseline gap-1.5">
          <span className="num-xl">{correct}</span>
          <span className="num-lg text-fg-dim">/ {total}</span>
        </p>
      </div>
    </div>
  )
}

function Quiz(props) {
  if (!props.mod.quiz?.length) return <p className="copy">This module has no quiz yet.</p>
  return <QuizRun {...props} />
}

function QuizRun({ mod, stats }) {
  const { actions } = useActions()
  const say = useAnnounce()
  const verdictRef = useRef(null)
  const [result, setResult] = useState(null) // what completeQuiz reported for this attempt
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

  /* Answering swaps the focused button for a div, dropping focus to <body>:
     announce the verdict and keep focus inside the question. */
  useEffect(() => {
    if (picked === null || !q) return undefined
    const ok = picked === q.correct
    say(`${ok ? 'Correct.' : 'Incorrect.'} ${q.why}`)
    const id = requestAnimationFrame(() => verdictRef.current?.focus({ preventScroll: true }))
    return () => cancelAnimationFrame(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked])

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
      setResult((await actions.completeQuiz(mod.id, score, total)) || null)
      setDone(true)
    } finally {
      setBusy(false)
    }
  }

  const restart = () => {
    setI(0)
    setPicked(null)
    setAnswers([])
    setResult(null)
    setDone(false)
  }

  if (done) {
    // Straight from the store: 0 on retakes, topic bonus included when newly completed.
    const gained = result?.xpGained ?? 0
    const isBest = Boolean(result?.wasDone) && correct > (result?.prevBest ?? 0)
    const stars = pct >= 90 ? 3 : pct >= 60 ? 2 : pct > 0 ? 1 : 0
    return (
      <motion.div
        initial={{ opacity: 0, y: reduce ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0.001 : 0.4, ease: EASE.out }}
        className="sheet-lg sheet-focal px-5 py-9 text-center sm:px-10 sm:py-12"
      >
        <p className="eyebrow mb-5">Quiz complete</p>
        <ScoreRing pct={pct} correct={correct} total={total} reduce={reduce} />
        <div className="mt-5 flex justify-center gap-1.5" aria-label={`${stars} of 3 stars`}>
          {[0, 1, 2].map((s) => (
            <motion.span
              key={s}
              initial={{ scale: reduce ? 1 : 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: reduce ? 0 : 0.7 + s * 0.15, type: 'spring', stiffness: 380, damping: 14 }}
            >
              <Star
                size={30}
                strokeWidth={2}
                className={s < stars ? 'fill-xp-400 text-xp-500' : 'text-fg-faint'}
              />
            </motion.span>
          ))}
        </div>
        <h2 className="t1 mt-5">
          {pct >= 90
            ? 'Outstanding — you know this module.'
            : pct >= 80
              ? 'Strong. Module complete.'
              : pct >= 50
                ? 'Solid start. Read the lessons once more.'
                : 'Worth another pass — this one matters.'}
        </h2>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Pill tone="xp" icon={Sparkles}>
            {gained > 0 ? `+${gained} XP earned` : 'No XP on a retake'}
          </Pill>
          {isBest && (
            <Pill tone="good" icon={Trophy}>
              New personal best
            </Pill>
          )}
          {result?.newlyCompleted && (
            <Pill tone="good" icon={Check}>
              Module completed
            </Pill>
          )}
        </div>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button variant="ghost" onClick={restart} icon={RotateCcw}>
            Retake quiz
          </Button>
          <Button variant="primary" as={Link} to="/journey" iconRight={ArrowRight}>
            Back to the journey
          </Button>
        </div>
      </motion.div>
    )
  }

  const answered = picked !== null
  const isRight = picked === q.correct

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <span className="eyebrow">
          Question {i + 1} of {total}
        </span>
        <span className="caption tnum">{correct} correct so far</span>
      </div>
      <div className="flex gap-1.5" role="img" aria-label={`Question ${i + 1} of ${total}`}>
        {mod.quiz.map((_, k) => (
          <span
            key={k}
            className={`h-2 flex-1 rounded-full transition-colors ${
              k < answers.length
                ? answers[k]
                  ? 'bg-good'
                  : 'bg-danger/70'
                : k === i
                  ? 'bg-electric-500'
                  : 'bg-electric-500/15'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: reduce ? 0 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: reduce ? 0 : -20 }}
          transition={{ duration: reduce ? 0.001 : 0.25, ease: EASE.out }}
        >
          <div className="sheet-lg p-5 sm:p-8">
            <h2 className="t1 max-w-[30ch] !text-[26px] leading-tight sm:!text-[30px]">{q.question}</h2>

            <div className="mt-7 space-y-3">
              {q.options.map((o, oi) => (
                <OptionRow
                  key={oi}
                  letter={String.fromCharCode(65 + oi)}
                  text={o}
                  onClick={() => choose(oi)}
                  state={
                    !answered ? 'idle' : oi === q.correct ? 'correct' : oi === picked ? 'wrong' : 'dim'
                  }
                />
              ))}
            </div>

            {answered && (
              <motion.div
                className="mt-6 space-y-4"
                initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduce ? 0.001 : 0.3, ease: EASE.out }}
              >
                <div ref={verdictRef} tabIndex={-1} className="focus:outline-none">
                  <Verdict
                    right={isRight}
                    label={isRight && !stats.quizDone ? `Correct · +${XP_RULES.quizCorrect} XP` : isRight ? 'Correct' : 'Incorrect'}
                  />
                </div>
                <div className="inset p-4 sm:p-5">
                  <p className="eyebrow mb-1.5">Why</p>
                  <p className="max-w-[64ch] font-body text-[16px] leading-[1.7] text-fg">{q.why}</p>
                  <p className="caption mt-3">
                    <span className="font-semibold text-fg-muted">Basis:</span> {q.law}
                  </p>
                </div>
                <div className="flex justify-end pt-1">
                  <Button
                    variant="primary"
                    onClick={nextQ}
                    loading={busy}
                    iconRight={i + 1 < total ? ArrowRight : PartyPopper}
                  >
                    {i + 1 < total ? 'Next question' : 'See my score'}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/* ===================================================================== rail */
/** Scenario steps as numbered buttons. Full 36px hit area. */
function Steps({ mod, stats, i, jump }) {
  return (
    <div className="flex flex-wrap gap-2">
      {mod.scenarios.map((s, k) => {
        const cleared = stats.scenarioIds?.includes(s.id)
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => jump(k)}
            aria-label={`Go to scenario ${k + 1} of ${mod.scenarios.length}`}
            aria-current={k === i ? 'true' : undefined}
            className={`grid h-9 w-9 cursor-pointer place-items-center rounded-xl font-sans text-caption font-bold tnum transition-all ${
              k === i
                ? 'bg-electric-500 text-pure shadow-glow'
                : cleared
                  ? 'bg-good/15 text-good hover:bg-good/25'
                  : 'bg-surface-3 text-fg-dim hover:bg-surface-4'
            }`}
          >
            {cleared && k !== i ? <Check size={15} strokeWidth={3} /> : k + 1}
          </button>
        )
      })}
    </div>
  )
}

function Rail({ mod, stats, level, i, jump, picked, banked }) {
  const sc = mod.scenarios[i]
  const pickedOpt = picked && sc?.options ? sc.options.find((o) => o.id === picked) : null
  const pct = mod.scenarios.length ? Math.round((stats.scenariosDone / mod.scenarios.length) * 100) : 0

  return (
    <aside
      aria-label="Module and scenario progress"
      className="sheet hidden space-y-5 p-5 xl:sticky xl:top-24 xl:block"
    >
      <div className="flex items-center gap-3">
        <ModuleTile mod={mod} className="h-11 w-11 rounded-xl" size="sm" />
        <div className="min-w-0">
          <p className="t3 truncate">{mod.name}</p>
          <p className="caption truncate">
            {mod.difficulty} · ~{mod.minutes} min
          </p>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <p className="eyebrow">Module progress</p>
          <span className="eyebrow tnum">{pct}%</span>
        </div>
        <ProgressBar value={pct} variant="good" size="md" />
        <p className="caption tnum mt-2">
          {stats.scenariosDone} of {mod.scenarios.length} scenarios cleared
          {stats.lessonIds ? ` · ${stats.lessonIds.length}/${mod.lessons.length} lessons` : ''}
        </p>
      </div>

      <div className="inset p-4">
        <p className="eyebrow mb-2.5">Scenarios</p>
        <Steps mod={mod} stats={stats} i={i} jump={jump} />
        <p className="eyebrow mb-1.5 mt-4">Your pick</p>
        {pickedOpt ? (
          <p className="flex gap-2 text-caption leading-snug text-fg-muted">
            <span className="num shrink-0 text-fg">{pickedOpt.id.toUpperCase()}</span>
            <span className="line-clamp-2">{pickedOpt.text}</span>
          </p>
        ) : (
          <p className="caption">Not answered yet.</p>
        )}
      </div>

      <div>
        <p className="eyebrow mb-1.5">XP banked</p>
        <p className="flex items-baseline gap-2">
          <span className="num-lg text-xp-300">+{formatNumber(banked)}</span>
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

      <Link
        to="/ai"
        className="group flex items-center justify-between gap-2 rounded-xl bg-electric-500/[0.07] px-3.5 py-3 text-body font-semibold text-electric-300 hover:bg-electric-500/[0.12]"
      >
        <span className="min-w-0">
          Was this you right now?
          <span className="caption block font-normal">Describe it to LawLink AI.</span>
        </span>
        <ArrowRight size={15} className="shrink-0 transition-transform group-hover:translate-x-0.5" />
      </Link>
      <VerifiedTag date={mod.lastVerified} />
    </aside>
  )
}

/** Mobile: a slim sticky bar in place of the rail. */
function MobileBar({ mod, stats, i, jump, banked }) {
  const pct = mod.scenarios.length ? Math.round((stats.scenariosDone / mod.scenarios.length) * 100) : 0
  // top = TopBar height (~4.3rem: py-3 + controls) + 0.5rem, so it never slides under the header
  return (
    <div className="sheet sticky top-[calc(4.3rem+0.5rem)] z-20 mb-6 px-3.5 py-2.5 xl:hidden">
      <div className="flex items-center gap-3">
        <ModuleTile mod={mod} className="h-8 w-8 rounded-[10px]" size="xs" />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <span className="caption tnum truncate font-semibold text-fg-muted">
              {stats.scenariosDone}/{mod.scenarios.length} cleared
            </span>
            <span className="caption tnum shrink-0 font-bold text-xp-300">+{formatNumber(banked)} XP</span>
          </div>
          <ProgressBar value={pct} variant="good" size="sm" />
        </div>
      </div>
      <div className="mt-2 flex gap-1.5 overflow-x-auto no-scrollbar">
        <Steps mod={mod} stats={stats} i={i} jump={jump} />
      </div>
    </div>
  )
}

/* =================================================================== page */
const TABS = (mod) => [
  { key: 'intro', label: 'Overview', icon: BookOpen },
  { key: 'lessons', label: 'Lessons', icon: NotebookTabs, count: mod.lessons.length },
  { key: 'scenario', label: 'Scenarios', icon: ScrollText, count: mod.scenarios.length },
  { key: 'quiz', label: 'Quiz', icon: ListChecks, count: mod.quiz.length },
]

/** Segmented control with counts. */
function Segmented({ tabs, value, onChange }) {
  const onKeyDown = (e) => {
    const at = tabs.findIndex((t) => t.key === value)
    const to = { ArrowRight: at + 1, ArrowLeft: at - 1, Home: 0, End: tabs.length - 1 }[e.key]
    if (to === undefined) return
    e.preventDefault()
    const k = tabs[(to + tabs.length) % tabs.length].key
    onChange(k)
    requestAnimationFrame(() => document.getElementById(`tab-${k}`)?.focus())
  }
  return (
    <div
      role="tablist"
      aria-label="Module sections"
      onKeyDown={onKeyDown}
      className="no-scrollbar -mx-1 flex min-w-0 gap-1 overflow-x-auto rounded-2xl bg-surface-3 p-1"
    >
      {tabs.map((t) => {
        const active = t.key === value
        return (
          <button
            key={t.key}
            id={`tab-${t.key}`}
            role="tab"
            type="button"
            aria-selected={active}
            aria-controls={`panel-${t.key}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.key)}
            className={`relative flex min-h-[44px] flex-1 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 font-sans text-body font-semibold transition-colors ${
              active ? 'text-electric-300' : 'text-fg-dim hover:text-fg'
            }`}
          >
            {active && (
              <motion.span
                layoutId="lesson-seg"
                className="absolute inset-0 rounded-xl bg-pure shadow-[0_1px_2px_rgba(20,34,79,0.12),0_6px_14px_-8px_rgba(61,99,245,0.4)]"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              <t.icon size={15} strokeWidth={2.1} className="hidden sm:block" />
              {t.label}
              {t.count != null && (
                <span
                  className={`tnum rounded-full px-1.5 text-micro font-bold ${
                    active ? 'bg-electric-500/[0.12]' : 'bg-white/[0.07]'
                  }`}
                >
                  {t.count}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}

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
  const location = useLocation()
  const { stats, unlocked, level } = useStore()
  const mod = getModuleById(moduleId)
  const s = stats[moduleId]

  const rawTab = params.get('tab')
  const tab = ['intro', 'lessons', 'scenario', 'quiz'].includes(rawTab) ? rawTab : 'intro'
  const setTab = (t) => {
    setPicked(null)
    setXpHere(0)
    setParams(t === 'intro' ? {} : { tab: t }, { replace: true })
  }

  /* Scenario state lives here, not in the child, because the rail reads it. */
  const [i, setI] = useState(() => firstUndone(mod, s))
  const [picked, setPicked] = useState(null)
  const [banked, setBanked] = useState(0)
  const [xpHere, setXpHere] = useState(0)
  const rewardRef = useRef(null)
  const revealRef = useRef(null)

  /** The one way to leave a scenario — from a step or from "Next scenario". */
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
  const ic = Math.min(i, Math.max(0, mod.scenarios.length - 1)) // never index past a shorter module
  const lessonXp = mod.lessons.length * XP_RULES.lessonRead

  return (
    <div className="mx-auto w-full max-w-[1180px]">
      {/* ------------------------------------------------ module header */}
      <header>
        <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-caption text-fg-dim">
          {location.key === 'default' ? (
            <Link to="/learn" className="btn btn-quiet btn-sm -ml-3 shrink-0" aria-label="Back to Learn">
              <ArrowLeft size={14} />
              Back
            </Link>
          ) : (
            <button onClick={() => nav(-1)} className="btn btn-quiet btn-sm -ml-3 shrink-0" aria-label="Back">
              <ArrowLeft size={14} />
              Back
            </button>
          )}
          <Link to="/learn" className="hover:text-electric-300">
            Learn
          </Link>
          <ChevronRight size={13} className="shrink-0" />
          <span className="truncate font-semibold text-fg-muted">{mod.name}</span>
        </nav>

        <div className="flex items-center gap-4 sm:gap-5">
          <ModuleTile mod={mod} className="h-14 w-14 rounded-2xl sm:h-[72px] sm:w-[72px] sm:rounded-3xl" size="lg" />
          <div className="min-w-0">
            <p className="eyebrow mb-1">{mod.difficulty} · ~{mod.minutes} min</p>
            <h1 className="t1 leading-tight">{mod.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {s.completed && (
                <Pill tone="good" icon={Check}>
                  Complete
                </Pill>
              )}
              <Pill tone="xp" icon={Zap}>
                {formatNumber(s.xpTotal + lessonXp)} XP here
              </Pill>
            </div>
          </div>
        </div>

        <div className="mt-8 mb-8 xl:mb-10">
          <Segmented tabs={TABS(mod)} value={tab} onChange={setTab} />
        </div>
      </header>

      {tab === 'scenario' && mod.scenarios.length > 0 && (
        <MobileBar mod={mod} stats={s} i={ic} jump={jump} banked={banked} />
      )}

      {/* ------------------------------------- reading column + sticky rail */}
      <div className="flex flex-col gap-10 xl:grid xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start xl:gap-12">
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${mod.id}-${tab}`}
              role="tabpanel"
              id={`panel-${tab}`}
              aria-labelledby={`tab-${tab}`}
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
                  i={ic}
                  jump={jump}
                  setTab={setTab}
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

          {s.completed && next && (
            <Card className="mt-12 flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="flex min-w-0 items-center gap-3.5">
                <ModuleTile mod={next} className="h-11 w-11 rounded-xl" size="sm" />
                <div className="min-w-0">
                  <p className="t3">Module complete</p>
                  <p className="caption truncate">Next up: {next.name}</p>
                </div>
              </div>
              <Button variant="ghost" onClick={() => nav(`/lesson/${next.id}`)} iconRight={ArrowRight}>
                Start {next.name}
              </Button>
            </Card>
          )}
        </div>

        <Rail mod={mod} stats={s} level={level} i={ic} jump={jump} picked={picked} banked={banked} />
      </div>
    </div>
  )
}

