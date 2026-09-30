/**
 * LawLink AI — the awareness assistant (/ai).
 *
 * The matching engine lives in ../data/aiKnowledge.js and is finished:
 *   matchIntent(message)  -> { intent, score }   (intent is null on no match)
 *   buildReply(intent, q) -> the structured reply object
 *   suggestedFollowUps(intent) -> string[]        (takes the INTENT, not a reply)
 *
 * This file is only the interface: a chat thread (user bubbles right, structured
 * answer cards left) with a composer pinned to the bottom. No infinite loops.
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
  Siren,
  Sparkles,
} from 'lucide-react'
import { Pill, Sigil, VerifiedTag } from '../components/ui/index.jsx'
import { toneFor } from '../lib/moduleTone.js'
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

/** The seven areas. `key` is already the module id. */
const AREAS = QUICK_CATEGORIES

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
const CALLABLE = ['r-112', 'r-cybercrime', 'r-consumer', 'r-181', 'r-1091']
  .map((id) => RESOURCES.find((r) => r.id === id && r.number))
  .filter(Boolean)

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

/* ----------------------------------------------------------------- fragments */

function AreaTile({ id, size = 'h-10 w-10 rounded-xl', px = 20 }) {
  return (
    <span className={`tile tile-${toneFor(id)} ${size}`}>
      <Sigil id={id} size={px} />
    </span>
  )
}

/** Small tinted chip, used for the topic switcher above the composer. */
function AreaChip({ area, onAsk }) {
  return (
    <button
      type="button"
      onClick={() => onAsk(area.q)}
      className="chip-electric min-h-[36px] shrink-0 whitespace-nowrap px-3 transition-colors duration-200 hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-400"
    >
      <Sigil id={area.key} size={14} />
      {area.label}
    </button>
  )
}

/** One labelled section of an answer. */
function Block({ label, children, action }) {
  return (
    <section className="px-5 py-4 sm:px-6">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <span className="eyebrow">{label}</span>
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
        className="pressable flex items-center gap-4 p-4"
      >
        <span className={`tile ${urgent ? 'tile-danger' : 'tile-electric'} h-12 w-12 rounded-2xl`}>
          <PhoneCall size={20} strokeWidth={2.2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className={`num-lg block ${urgent ? 'text-danger' : 'text-electric-300'}`}>
            {resource.number}
          </span>
          <span className="caption mt-0.5 block">{resource.label}</span>
        </span>
        <span className="eyebrow shrink-0">Tap to call</span>
      </a>
    )
  }

  return (
    <a
      href={resource.href}
      target="_blank"
      rel="noreferrer noopener"
      className="pressable flex items-center gap-4 p-4"
    >
      <span className="tile tile-electric h-12 w-12 rounded-2xl">
        <ExternalLink size={19} strokeWidth={2.2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="t3 block">{resource.label}</span>
        <span className="caption mt-0.5 block">Open the official site</span>
      </span>
    </a>
  )
}

/** The assistant's avatar next to each turn. */
function Avatar() {
  return (
    <span className="tile tile-solid mt-1 hidden h-9 w-9 rounded-xl sm:grid">
      <Bot size={18} strokeWidth={2.1} />
    </span>
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
      className="flex gap-3"
    >
      <Avatar />
      <div className="sheet flex items-center gap-3 px-4 py-3">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-electric-500"
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
        <div className="px-5 pt-5 sm:px-6 sm:pt-6">
          <div className="eyebrow mb-2">No verified match yet</div>
          <h3 className="t2">I will not guess at a law or a helpline</h3>
          <p className="copy measure mt-2">
            I answer only from a checked knowledge base. Pick an area below, or reword it as what
            happened rather than what you want to know.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 px-5 py-4 sm:px-6">
          {AREAS.map((c) => (
            <AreaChip key={c.key} area={c} onAsk={onAsk} />
          ))}
        </div>

        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <Link
            to="/emergency"
            className="inline-flex items-center gap-2 font-sans text-t3 font-semibold text-danger hover:underline"
          >
            <Siren size={15} className="shrink-0" strokeWidth={2.3} />
            In immediate danger, call 112 first
          </Link>
          <p className="caption mt-2">{GREETING.meaning}</p>
        </div>
      </div>
    )
  }

  const mod = reply.module ? getModuleById(reply.module) : null
  const followUps = suggestedFollowUps(intent)

  return (
    <div className="sheet overflow-hidden">
      {/* a. the legal area, and whether it is time-critical */}
      <div className="flex flex-wrap items-center gap-2 px-5 pt-5 sm:px-6 sm:pt-6">
        <Pill tone="electric">{reply.area}</Pill>
        {reply.urgent && (
          <Pill tone="danger" icon={AlertTriangle}>
            Urgent — act today
          </Pill>
        )}
      </div>

      {/* b. what this means */}
      <div className="px-5 pb-1 pt-3 sm:px-6">
        <h3 className="eyebrow mb-1.5">What this means</h3>
        <p className="lead">{reply.meaning}</p>
      </div>

      {/* c. rights */}
      {reply.rights?.length > 0 && (
        <Block label="Your rights">
          <div className="inset space-y-2 p-4">
            {reply.rights.map((r) => (
              <div key={r} className="flex gap-2.5">
                <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-electric-500" aria-hidden="true" />
                <span className="copy">{r}</span>
              </div>
            ))}
          </div>
        </Block>
      )}

      {/* d. what you can do — step 1 is the action to take right now */}
      {reply.steps?.length > 0 && (
        <Block label="What you can do">
          <ol className="space-y-3">
            {reply.steps.map((s, i) => (
              <li key={s.step} className="flex gap-3">
                <span
                  className={
                    i === 0
                      ? 'tile tile-solid num mt-px h-7 w-7 rounded-lg !text-micro font-extrabold'
                      : 'tile tile-electric num mt-px h-7 w-7 rounded-lg !text-micro'
                  }
                >
                  {s.step}
                </span>
                <div className="min-w-0">
                  {i === 0 && <div className="eyebrow mb-0.5">Do this first</div>}
                  <p className={i === 0 ? 't3 text-fg' : 'copy'}>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Block>
      )}

      {/* e. the resource — a number you can actually press */}
      <Block label="Relevant resource">
        <ResourceBlock resource={reply.resource} urgent={reply.urgent} />
      </Block>

      {/* f. where it came from */}
      {reply.source && (
        <Block label="Source" action={<VerifiedTag date={VERIFIED_ON} />}>
          <a
            href={reply.source.href}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 font-sans text-body font-semibold text-electric-300 underline decoration-electric-500/40 underline-offset-2 hover:decoration-electric-400"
          >
            {reply.source.label}
            <ExternalLink size={12} strokeWidth={2.4} />
          </a>
        </Block>
      )}

      {/* g. learn the topic properly */}
      {mod && (
        <Link
          to={`/lesson/${mod.id}`}
          className="mx-5 my-2 flex items-center gap-3 rounded-2xl bg-electric-500/[0.07] px-4 py-3 transition-colors duration-200 hover:bg-electric-500/[0.12] sm:mx-6"
        >
          <span className={`tile tile-${toneFor(mod.id)} h-9 w-9 rounded-xl`}>
            <Sigil id={mod.id} size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="t3 block truncate">Learn this properly</span>
            <span className="caption block truncate">{mod.name} · the full module</span>
          </span>
          <ArrowRight size={16} className="shrink-0 text-electric-300" strokeWidth={2.4} />
        </Link>
      )}

      {/* keep going */}
      {followUps.length > 0 && (
        <div className="flex flex-wrap gap-2 px-5 pb-1 pt-3 sm:px-6">
          {followUps.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onAsk(f)}
              className="chip-electric min-h-[36px] px-3 text-left transition-colors duration-200 hover:brightness-95"
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* h. one small disclaimer */}
      <p className="caption px-5 pb-5 pt-3 sm:px-6">{reply.disclaimer || DISCLAIMER}</p>
    </div>
  )
}

/* --------------------------------------------------------------- empty state */

function EmptyState({ name, onAsk }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease }}
      className="pt-4 sm:pt-10"
    >
      <div className="text-center">
        <span className="tile tile-solid mx-auto h-20 w-20 rounded-[28px]">
          <Bot size={38} strokeWidth={1.9} />
        </span>
        <div className="eyebrow mt-6">LawLink AI · awareness assistant</div>
        <h1 className="display mt-2 text-[40px] sm:text-[56px]">What happened?</h1>
        <p className="lead mx-auto mt-3 max-w-[52ch]">
          {name ? `${name}, tell` : 'Tell'} me in plain words. I will name the legal area, your
          rights and what to do today — from a checked knowledge base, not a live model.
        </p>
      </div>

      <div className="mt-12">
        <div className="eyebrow mb-3">Start with an area</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AREAS.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => onAsk(c.q)}
              className="pressable flex items-start gap-3 p-4 text-left"
            >
              <AreaTile id={c.key} />
              <span className="min-w-0 flex-1">
                <span className="t3 block">{c.label}</span>
                <span className="caption mt-0.5 block leading-snug">{c.q}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <div className="eyebrow mb-3">Or try one of these</div>
        <div className="flex flex-wrap gap-2">
          {POPULAR.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onAsk(q)}
              className="chip-electric min-h-[40px] px-4 text-left text-caption transition-colors duration-200 hover:brightness-95"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="eyebrow mr-1">Tap to call</span>
        {CALLABLE.map((r) => (
          <a
            key={r.id}
            href={`tel:${r.number}`}
            className="btn-quiet btn-sm min-h-[44px] gap-1.5 tnum"
            title={r.name}
          >
            <PhoneCall size={13} strokeWidth={2.3} />
            <span className="font-bold text-fg">{r.number}</span>
            <span className="hidden text-fg-dim sm:inline">{r.name}</span>
          </a>
        ))}
      </div>
    </motion.div>
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

  /* The answer arrives silently, so announce the legal area and the first action. */
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
    <div className="mx-auto max-w-[820px]">
      {/* thread header, only once a chat is running */}
      {!empty && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="tile tile-solid h-9 w-9 rounded-xl">
              <Bot size={18} strokeWidth={2.1} />
            </span>
            <div>
              <div className="t3">LawLink AI</div>
              <div className="caption">Awareness assistant · not a lawyer</div>
            </div>
          </div>
          <button type="button" onClick={reset} className="btn-quiet btn-sm min-h-[44px]" title="Start over">
            <RotateCcw size={14} strokeWidth={2.3} />
            <span className="hidden sm:inline">Start over</span>
            <span className="sr-only sm:hidden">Start over</span>
          </button>
        </div>
      )}

      {/* body */}
      <div className="mt-4 space-y-5 pb-4">
        {empty ? (
          <EmptyState name={name} onAsk={ask} />
        ) : (
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
                  <div className="max-w-[85%] rounded-3xl rounded-br-lg bg-gradient-to-b from-electric-400 to-electric-500 px-4 py-3 shadow-glow sm:max-w-[75%]">
                    <p className="whitespace-pre-wrap break-words font-sans text-body leading-relaxed text-pure">
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
                  className="flex gap-3"
                >
                  <Avatar />
                  <div className="min-w-0 flex-1">
                    <ReplyCard message={m} onAsk={ask} />
                  </div>
                </motion.div>
              ),
            )}
          </AnimatePresence>
        )}

        <AnimatePresence>{pending && <TypingDots />}</AnimatePresence>

        {/* scroll-mb keeps the last message clear of the sticky composer */}
        <div ref={endRef} className="h-px w-full scroll-mb-40" aria-hidden="true" />
      </div>

      {/* ----------------------------------------------------- composer */}
      <div className="safe-b sticky bottom-[64px] z-20 sm:bottom-0">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 top-0 -z-10 bg-surface-0" />

        {!empty && (
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-2 pt-3">
            {AREAS.map((c) => (
              <AreaChip key={c.key} area={c} onAsk={ask} />
            ))}
          </div>
        )}

        <div className={`sheet p-2 ${empty ? 'mt-3' : ''}`}>
          <div className="flex items-end gap-1.5">
            <textarea
              ref={taRef}
              value={draft}
              rows={1}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Describe what happened in plain words…"
              aria-label="Describe what happened"
              className="max-h-[140px] min-h-[44px] min-w-0 flex-1 resize-none bg-transparent px-3 py-2.5 font-body text-body leading-relaxed text-fg outline-none placeholder:text-fg-dim"
            />
            <button
              type="button"
              onClick={surprise}
              aria-label="Give me a question to try"
              title="Surprise me"
              className="btn-quiet btn-sm h-11 shrink-0"
            >
              <Sparkles size={16} strokeWidth={2.3} />
              <span className="hidden sm:inline">Surprise me</span>
            </button>
            <button
              type="button"
              onClick={() => ask(draft)}
              disabled={!draft.trim()}
              aria-label="Send"
              className="btn-primary h-11 w-11 shrink-0 !rounded-[14px] !p-0 sm:w-auto sm:!px-4"
            >
              <Send size={16} strokeWidth={2.3} />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </div>

        <p className="caption px-1 pb-1 pt-2 text-center">
          <Link to="/emergency" className="font-semibold text-danger hover:underline">
            In danger? Call 112.
          </Link>{' '}
          Answers are awareness, not legal advice.
        </p>
      </div>
    </div>
  )
}
