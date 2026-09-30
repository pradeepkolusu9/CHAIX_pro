/**
 * LawLink AI — the awareness assistant (/ai).
 *
 * The matching engine lives in ../data/aiKnowledge.js and is finished:
 *   matchIntent(message)  -> { intent, score }   (intent is null on no match)
 *   buildReply(intent, q) -> the structured reply object
 *   suggestedFollowUps(intent) -> string[]        (takes the INTENT, not a reply)
 *
 * This file is only the interface. Every reply renders as ONE sheet divided by
 * hairlines — area, what this means, your rights, what you can do, resource,
 * source, disclaimer — instead of a stack of nested boxes, so the answer reads
 * as a case file and never as a generic chat bubble.
 *
 * v2 notes (docs/council):
 *   - The seven category chips are the ONE place a Sigil may sit in a chip:
 *     they are the app's own topic switcher, and their keys ARE the module ids.
 *   - `.display` appears once, on the start state, and it is words.
 *   - The "not a lawyer" line is a trust feature, so it is prominent — but it
 *     is `<DisclaimerNote />`, neutral, never orange.
 *   - No infinite loop lives on this page (not even the typing dots).
 */
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  ExternalLink,
  PhoneCall,
  RotateCcw,
  Send,
  ShieldCheck,
  Siren,
  Sparkles,
} from 'lucide-react'
import {
  Button,
  DisclaimerNote,
  IconBadge,
  Pill,
  Sigil,
  VerifiedTag,
} from '../components/ui/index.jsx'
import { useStore } from '../lib/store.jsx'
import { useAnnounce } from '../lib/announce.jsx'
import { getModuleById } from '../data/modules.js'
import { DISCLAIMER, RESOURCES, VERIFIED_ON } from '../data/resources.js'
import {
  GREETING,
  QUICK_CATEGORIES,
  buildReply,
  matchIntent,
  suggestedFollowUps,
} from '../data/aiKnowledge.js'
import { useReducedMotionPref } from '../lib/hooks.js'

const ease = [0.16, 1, 0.3, 1]

/* ------------------------------------------------------------------ content */

/**
 * The seven areas. `key` is already the module id, so the sigil is derivable —
 * no data change needed, and the chip can never show an emoji again.
 */
const AREAS = QUICK_CATEGORIES.map((c) => ({ ...c, sigil: c.key }))

/** Real situations, every one of them verified against an intent keyword list. */
const POPULAR = [
  'My online order was never delivered',
  'Someone is using my photos on a fake profile',
  'Can a college app ask for my Aadhaar?',
  'My salary is two months late',
  'I was stopped for drink driving',
]

/** "Surprise me" never invents a question — it only picks a real, matchable one. */
const SURPRISE_POOL = [...POPULAR, ...AREAS.map((c) => c.q)]

/** Official, callable helplines worth one tap. */
const CALLABLE_IDS = ['r-112', 'r-cybercrime', 'r-consumer', 'r-181', 'r-1091']
const CALLABLE = CALLABLE_IDS.map((id) => RESOURCES.find((r) => r.id === id && r.number)).filter(Boolean)

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

/* ----------------------------------------------------------------- fragments */

/**
 * The topic switcher. A 16px Sigil in the leading slot is the ONE legal
 * exception to "no glyph in a chip" — these seven chips are how the user
 * chooses which part of the law to talk about.
 */
function AreaChip({ area, onAsk }) {
  return (
    <button
      type="button"
      onClick={() => onAsk(area.q)}
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md bg-white/[0.05] px-2 py-1 font-sans text-micro font-semibold text-fg-muted transition-colors duration-200 hover:bg-white/[0.08] hover:text-fg focus-visible:ring-2 focus-visible:ring-electric-400 focus-visible:outline-none"
    >
      <Sigil id={area.sigil} size={16} className="text-fg-dim" />
      {area.label}
    </button>
  )
}

/** One band of the answer sheet: eyebrow, a hairline, then the content. */
function Band({ label, action, children }) {
  return (
    <section className="px-5 py-4">
      <div className="mb-2.5 flex items-center gap-3">
        <span className="eyebrow shrink-0">{label}</span>
        <span className="h-px flex-1 bg-white/[0.05]" aria-hidden="true" />
        {action}
      </div>
      {children}
    </section>
  )
}

/** The resource the answer points at. A real number becomes a tappable call. */
function ResourceBlock({ resource, urgent }) {
  if (!resource) {
    return (
      <p className="copy">
        There is no single number for this one. Use the official portal linked under Source.
      </p>
    )
  }

  if (resource.number) {
    return (
      <a
        href={`tel:${resource.number}`}
        className={`pressable flex items-center gap-3 px-4 py-3.5 ring-2 ring-inset ${
          urgent ? 'bg-danger/[0.07] ring-danger/25' : 'bg-electric-500/[0.07] ring-electric-500/25'
        }`}
      >
        <span className="min-w-0 flex-1">
          <span className={`num-lg block ${urgent ? 'text-danger' : 'text-electric-300'}`}>
            {resource.number}
          </span>
          <span className="caption mt-0.5 block">{resource.label}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <span className="eyebrow">Tap to call</span>
          <PhoneCall size={17} className={urgent ? 'text-danger' : 'text-electric-300'} strokeWidth={2.2} />
        </span>
      </a>
    )
  }

  return (
    <a
      href={resource.href}
      target="_blank"
      rel="noreferrer noopener"
      className="pressable flex items-center gap-3 px-4 py-3.5"
    >
      <span className="min-w-0 flex-1">
        <span className="t3 block">{resource.label}</span>
        <span className="caption mt-0.5 block">Open the official site</span>
      </span>
      <ExternalLink size={16} className="shrink-0 text-fg-dim" strokeWidth={2.2} />
    </a>
  )
}

/** Three dots. They settle and stop — a page may not own a third loop. */
function TypingDots() {
  const reduce = useReducedMotionPref()
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2, ease }}
    >
      <div className="pressable flex w-full items-center gap-3 px-3.5 py-3">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-fg-dim"
              initial={{ opacity: 0.25 }}
              animate={reduce ? { opacity: 0.7 } : { opacity: [0.25, 1, 0.9], y: [0, -3, 0] }}
              transition={{ duration: 0.5, delay: i * 0.12, ease: 'easeOut' }}
            />
          ))}
        </div>
        <span className="caption">Checking the knowledge base…</span>
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------- answer card */

function ReplyCard({ message, onAsk }) {
  const { reply, intent } = message

  /* ---- no verified match: confident and deliberate, never broken ---- */
  if (!reply) {
    return (
      <div className="sheet overflow-hidden">
        <div className="px-5 pt-5">
          <div className="eyebrow mb-2">No verified match yet</div>
          <h3 className="t2">I will not guess at a law or a helpline</h3>
          <p className="copy measure mt-2">
            I answer only from a checked knowledge base, so an unverified section or number never
            reaches you. Nothing is lost by asking again — pick an area below, or reword it as what
            happened rather than what you want to know.
          </p>
        </div>

        <div className="mt-5 border-t border-white/[0.05] px-5 py-4">
          <div className="eyebrow mb-3">Pick an area instead</div>
          <div className="flex flex-wrap gap-1.5">
            {AREAS.map((c) => (
              <AreaChip key={c.key} area={c} onAsk={onAsk} />
            ))}
          </div>
        </div>

        <div className="border-t border-white/[0.05] px-5 py-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link
              to="/emergency"
              className="inline-flex items-center gap-2 font-sans text-t3 font-semibold text-danger hover:underline"
            >
              <Siren size={14} className="shrink-0" strokeWidth={2.3} />
              In immediate danger, call 112 first
            </Link>
            <span className="caption">{GREETING.meaning}</span>
          </div>
        </div>

        <div className="px-5 pb-5">
          <DisclaimerNote text={DISCLAIMER} />
        </div>
      </div>
    )
  }

  const mod = reply.module ? getModuleById(reply.module) : null
  const followUps = suggestedFollowUps(intent)

  return (
    <div className="sheet overflow-hidden">
      {/* a. the legal area, and whether it is time-critical */}
      <div className="flex flex-wrap items-center gap-2 px-5 pt-5">
        <Pill tone="electric">{reply.area}</Pill>
        {reply.urgent && (
          <Pill tone="danger" icon={AlertTriangle}>
            Urgent — act today
          </Pill>
        )}
      </div>

      <div className="mt-4 divide-y divide-white/[0.05] border-t border-white/[0.05]">
        {/* b. what this means */}
        <Band label="What this means">
          <p className="copy measure">{reply.meaning}</p>
        </Band>

        {/* c. rights */}
        {reply.rights?.length > 0 && (
          <Band label="Your rights">
            <ul className="space-y-2">
              {reply.rights.map((r) => (
                <li key={r} className="flex gap-2.5">
                  <span
                    className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-fg-faint"
                    aria-hidden="true"
                  />
                  <span className="copy">{r}</span>
                </li>
              ))}
            </ul>
          </Band>
        )}

        {/* d. what you can do — step 1 is the action to take right now */}
        {reply.steps?.length > 0 && (
          <Band label="What you can do">
            <ol className="space-y-3">
              {reply.steps.map((s, i) => (
                <li key={s.step} className="flex gap-3">
                  <span
                    className={
                      i === 0
                        ? 'mt-px grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-electric-500 font-sans text-micro font-extrabold text-white'
                        : 'mt-px grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white/[0.06] font-sans text-micro font-bold text-fg-dim'
                    }
                  >
                    {s.step}
                  </span>
                  <div className="min-w-0">
                    {i === 0 && <div className="eyebrow mb-1 text-electric-300">Do this first</div>}
                    <p className={i === 0 ? 't3 text-fg' : 'copy'}>{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Band>
        )}

        {/* e. the resource — a number you can actually press */}
        <Band label="Relevant resource">
          <ResourceBlock resource={reply.resource} urgent={reply.urgent} />
        </Band>

        {/* f. where it came from */}
        {reply.source && (
          <Band label="Source" action={<VerifiedTag date={VERIFIED_ON} />}>
            <a
              href={reply.source.href}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 font-sans text-body font-semibold text-electric-300 underline decoration-electric-500/40 underline-offset-2 hover:decoration-electric-400"
            >
              {reply.source.label}
              <ExternalLink size={12} strokeWidth={2.4} />
            </a>
          </Band>
        )}
      </div>

      {/* g. always offered: go and learn the topic properly */}
      {mod && (
        <div className="border-t border-white/[0.05]">
          <Link
            to={`/lesson/${mod.id}`}
            className="flex items-center gap-3 px-5 py-4 transition-colors duration-200 hover:bg-white/[0.03]"
          >
            <span className="min-w-0 flex-1">
              <span className="t3 block truncate">Learn this properly</span>
              <span className="caption block truncate">{mod.name} · the full module</span>
            </span>
            <ArrowRight size={15} className="shrink-0 text-electric-300" strokeWidth={2.4} />
          </Link>
        </div>
      )}

      {/* keep going */}
      {followUps.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-white/[0.05] px-5 py-4">
          {followUps.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onAsk(f)}
              className="pressable px-2.5 py-1.5 text-left font-sans text-caption font-medium text-fg-muted transition-colors duration-200 hover:text-fg"
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* h. the trust line. Prominent on purpose — and neutral, never orange. */}
      <div className="px-5 pb-5 pt-4">
        <DisclaimerNote text={reply.disclaimer || DISCLAIMER} />
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- right rail */

function ContextPanel({ onAsk }) {
  return (
    <div className="space-y-3">
      {/* one surface, three bands — a rail is a list, not a stack of cards */}
      <div className="sheet divide-y divide-white/[0.05] overflow-hidden">
        <div className="p-4">
          <div className="eyebrow mb-3">Start with an area</div>
          <div className="flex flex-wrap gap-1.5">
            {AREAS.map((c) => (
              <AreaChip key={c.key} area={c} onAsk={onAsk} />
            ))}
          </div>
        </div>

        <div className="p-4">
          <div className="eyebrow mb-2">Popular questions</div>
          <div className="space-y-1">
            {POPULAR.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => onAsk(q)}
                className="pressable w-full px-2.5 py-2 text-left font-sans text-caption font-medium leading-snug text-fg-muted transition-colors duration-200 hover:text-fg"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          <div className="eyebrow mb-2">Official numbers — tap to call</div>
          <div className="divide-y divide-white/[0.05]">
            {CALLABLE.map((r) => (
              <a key={r.id} href={`tel:${r.number}`} className="flex items-center gap-3 py-2.5">
                <span className="num w-14 shrink-0 text-fg">{r.number}</span>
                <span className="min-w-0 flex-1 truncate caption">{r.name}</span>
                <PhoneCall size={14} className="shrink-0 text-fg-faint" strokeWidth={2.2} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2">
          <ShieldCheck size={13} className="text-good" strokeWidth={2.4} />
          <span className="eyebrow">How answers are built</span>
        </div>
        <p className="copy">
          Every answer is assembled from a knowledge base checked against an official Indian source.
          Sections, laws and helplines are shown with the date they were verified. Where a provision
          could not be verified, the law is named in words rather than a guessed section number.
        </p>
        <div className="mt-2.5">
          <VerifiedTag date={VERIFIED_ON} />
        </div>
      </div>

      <div>
        <Link
          to="/emergency"
          className="flex items-center gap-2.5 rounded-xl bg-danger/[0.07] px-3.5 py-3 ring-1 ring-inset ring-danger/20 transition-colors duration-200 hover:bg-danger/[0.11]"
        >
          <Siren size={15} className="shrink-0 text-danger" strokeWidth={2.3} />
          <span className="min-w-0 flex-1">
            <span className="t3 block">In immediate danger</span>
            <span className="caption block">Call first, read later. 112 is free.</span>
          </span>
        </Link>
      </div>

      <DisclaimerNote />
      <p className="caption">
        LawLink AI is a static awareness assistant. It does not browse, does not learn from your
        messages, and does not give case-specific advice.
      </p>
    </div>
  )
}

/* --------------------------------------------------------------------- page */

export default function Assistant() {
  const { profile } = useStore()
  const name = profile?.name || ''

  const [messages, setMessages] = useState([])
  const [queue, setQueue] = useState([])
  const [draft, setDraft] = useState('')
  const say = useAnnounce()

  const taRef = useRef(null)
  const endRef = useRef(null)
  const pending = queue.length > 0

  /* one reply at a time, in the order asked */
  useEffect(() => {
    if (queue.length === 0) return undefined
    let cancelled = false
    const [head, ...rest] = queue
    const t = setTimeout(
      () => {
        if (cancelled) return
        const { intent } = matchIntent(head)
        setMessages((m) => [
          ...m,
          {
            id: uid(),
            role: 'ai',
            text: head,
            reply: buildReply(intent, head),
            intent, // suggestedFollowUps() takes the intent, not the reply
            ts: Date.now(),
          },
        ])
        setQueue(rest)
      },
      500 + Math.random() * 200,
    )
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [queue])

  /* keep the newest turn in view */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, pending])

  /* The answer is the entire content of this screen and it arrives silently, so a
     screen-reader user hears nothing after pressing Enter. Announce the legal area
     and the first action, which is the part that matters. */
  const lastAnswer = messages[messages.length - 1]?.reply
  useEffect(() => {
    if (!lastAnswer) return
    const first = lastAnswer.steps?.[0]?.text
    say(`${lastAnswer.area}. ${lastAnswer.meaning} ${first ? `First step: ${first}` : ''}`.trim())
  }, [lastAnswer, say])

  /* auto-grow to four rows */
  useEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
  }, [draft])

  const ask = (text) => {
    const q = String(text ?? '').trim()
    if (!q) return
    setMessages((m) => [...m, { id: uid(), role: 'user', text: q, ts: Date.now() }])
    setQueue((q2) => [...q2, q])
    setDraft('')
  }

  const surprise = () => {
    const pool = SURPRISE_POOL.filter((q) => q !== draft.trim())
    const pick = pool[Math.floor(Math.random() * pool.length)] || SURPRISE_POOL[0]
    setDraft(pick)
    taRef.current?.focus()
  }

  const reset = () => {
    setMessages([])
    setQueue([])
    setDraft('')
    taRef.current?.focus()
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      ask(draft)
    }
  }

  const empty = messages.length === 0

  return (
    <div className="lg:flex lg:items-start lg:gap-6">
      {/* ---------------------------------------------------- conversation */}
      <div className="min-w-0 flex-1">
        {/* masthead */}
        <div className="flex items-start gap-3">
          <IconBadge icon={Bot} tone="electric" size="lg" className="hidden sm:grid" />
          <IconBadge icon={Bot} tone="electric" size="md" className="sm:hidden" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="t1">LawLink AI</h1>
              <span className="chip">Awareness assistant</span>
            </div>
            <p className="copy measure mt-1.5">
              Curated answers from a verified knowledge base — not a live language model, and not a
              lawyer.
            </p>
          </div>
          {!empty && (
            <Button
              variant="quiet"
              size="sm"
              onClick={reset}
              icon={RotateCcw}
              aria-label="Start over"
              title="Start over"
              className="shrink-0"
            >
              <span className="hidden sm:inline">Start over</span>
            </Button>
          )}
        </div>

        {/* body */}
        <div className="mt-5 space-y-4 pb-2">
          {empty ? (
            /* ------------------------------------------------- start state */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease }}
            >
              {/* the one .display on this screen — words, never a number */}
              <h2 className="display text-[40px] sm:text-display">What happened?</h2>
              <p className="lead measure mt-3">
                {name
                  ? `${name}, describe what happened in plain words. `
                  : 'Describe what happened in plain words. '}
                I will tell you which legal area it falls under, what your rights are, and what to
                do today.
              </p>

              <div className="mt-7">
                <div className="eyebrow mb-2.5">Pick a situation</div>
                {/* the topic switcher is one sheet, not seven cards */}
                <div className="sheet divide-y divide-white/[0.05] overflow-hidden">
                  {AREAS.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => ask(c.q)}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-200 hover:bg-white/[0.03]"
                    >
                      <Sigil
                        id={c.sigil}
                        size={16}
                        className="mt-0.5 shrink-0 text-electric-300"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="t3 block">{c.label}</span>
                        <span className="copy mt-0.5 block leading-snug">{c.q}</span>
                      </span>
                      <ArrowRight
                        size={14}
                        className="mt-1 shrink-0 text-fg-faint"
                        strokeWidth={2.4}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-7">
                <div className="eyebrow mb-2.5">Popular questions</div>
                <div className="divide-y divide-white/[0.05]">
                  {POPULAR.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => ask(q)}
                      className="flex w-full items-center gap-3 py-2.5 text-left transition-colors duration-200 hover:text-fg"
                    >
                      <span className="t3 min-w-0 flex-1">{q}</span>
                      <ArrowRight size={14} className="shrink-0 text-fg-faint" strokeWidth={2.4} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-7">
                <DisclaimerNote text={DISCLAIMER} />
              </div>
            </motion.div>
          ) : (
            /* ----------------------------------------------- the thread */
            <AnimatePresence initial={false}>
              {messages.map((m) =>
                m.role === 'user' ? (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, ease }}
                    className="flex justify-end"
                  >
                    {/* the user's own words: tonal, no outline */}
                    <div className="max-w-[80%] rounded-2xl rounded-br-md bg-white/[0.06] px-3.5 py-2.5">
                      <p className="whitespace-pre-wrap break-words font-sans text-body leading-relaxed text-fg">
                        {m.text}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, ease }}
                  >
                    <ReplyCard message={m} onAsk={ask} />
                  </motion.div>
                ),
              )}
            </AnimatePresence>
          )}

          <AnimatePresence>{pending && <TypingDots />}</AnimatePresence>

          {messages.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {AREAS.slice(0, 4).map((c) => (
                <AreaChip key={c.key} area={c} onAsk={ask} />
              ))}
            </div>
          )}

          {/* scroll-mb keeps the last message clear of the sticky input bar */}
          <div ref={endRef} className="h-px w-full scroll-mb-32" aria-hidden="true" />
        </div>

        {/* ----------------------------------------------------- input bar */}
        <div className="sticky bottom-[64px] z-20 pt-8 sm:bottom-0">
          {/* flat canvas behind the bar — no gradient, no blur on this screen */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 top-0 -z-10 bg-surface-0"
          />

          {/* mobile: the seven areas collapse into one scrollable chip row */}
          <div className="no-scrollbar -mx-1 mb-2 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:hidden">
            {AREAS.map((c) => (
              <AreaChip key={c.key} area={c} onAsk={ask} />
            ))}
          </div>

          <div className="sheet p-2.5">
            <div className="flex items-end gap-2">
              <textarea
                ref={taRef}
                value={draft}
                rows={1}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Describe what happened in plain words…"
                aria-label="Describe what happened"
                className="max-h-[140px] min-h-[38px] min-w-0 flex-1 resize-none bg-transparent px-1.5 py-2 font-body text-body leading-relaxed text-fg outline-none placeholder:text-fg-dim"
              />
              <Button
                variant="quiet"
                size="sm"
                onClick={surprise}
                icon={Sparkles}
                aria-label="Give me a question to try"
                title="Surprise me"
                className="shrink-0"
              >
                <span className="hidden sm:inline">Surprise me</span>
              </Button>
              <Button
                onClick={() => ask(draft)}
                disabled={!draft.trim()}
                icon={Send}
                aria-label="Send"
                className="shrink-0"
              >
                <span className="hidden sm:inline">Send</span>
              </Button>
            </div>
          </div>

          <p className="caption mt-2 px-1">
            {DISCLAIMER}{' '}
            <span className="lg:hidden">
              <Link to="/emergency" className="font-semibold text-danger hover:underline">
                Emergency?
              </Link>
            </span>
          </p>
        </div>
      </div>

      {/* --------------------------------------------------- context rail */}
      <aside className="hidden w-[320px] shrink-0 lg:sticky lg:top-[84px] lg:block">
        <ContextPanel onAsk={ask} />
      </aside>
    </div>
  )
}
