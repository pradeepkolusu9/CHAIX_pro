/**
 * Search — /search
 *
 * A flat, readable index over LawLink's own verified content. Results are one
 * `divide-y` list: topic mark, title, one-line explanation, the resource that
 * runs it, difficulty and the XP on the move. No result cards.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search as SearchIcon,
  X,
  Sparkles,
  ArrowRight,
  BookOpen,
  SearchX,
  Siren,
} from 'lucide-react'
import {
  Card,
  Pill,
  Button,
  EmptyState,
  DisclaimerNote,
  Sigil,
} from '../components/ui/index.jsx'
import { searchIndex, getModuleById } from '../data/modules.js'
import { useMediaQuery } from '../lib/hooks.js'
import { toneFor } from '../lib/moduleTone.js'

/** The brief's own examples — every one of these returns real content. */
const SUGGESTED = [
  'cyber fraud',
  'refund',
  'college harassment',
  'drunk driving',
  'privacy',
  'workplace rights',
  'ragging',
  'fake profile',
  'never delivered',
  'salary not paid',
]

const GROUP_ORDER = [
  { key: 'topic', title: 'Topics', sub: 'The full module — read it once, end to end.' },
  { key: 'scenario', title: 'Scenarios', sub: 'Real situations with the right step first.' },
  { key: 'quiz', title: 'Quiz', sub: 'Test yourself and earn XP for each answer.' },
]

const clamp = (s, n = 150) => (s && s.length > n ? `${s.slice(0, n).trimEnd()}…` : s || '')

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Bolds every matched word so the reason a row appeared is obvious. */
function Marked({ text, tokens }) {
  if (!text) return null
  if (!tokens.length) return text
  const re = new RegExp(`(${tokens.map(esc).join('|')})`, 'gi')
  return String(text)
    .split(re)
    .map((part, i) =>
      tokens.some((t) => t.toLowerCase() === part.toLowerCase()) ? (
        <mark key={i} className="rounded bg-xp-400/30 px-0.5 font-semibold text-fg">
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      ),
    )
}

/**
 * Relevance: the exact phrase wins, then every word matching, then any single
 * word. That keeps a chip like "salary not paid" useful even though the corpus
 * only says "salary".
 */
function score(row, term, tokens) {
  const title = row.title.toLowerCase()
  const mod = row.module.toLowerCase()
  const text = row.text.toLowerCase()
  const hay = `${title} ${mod} ${text}`
  let s = 0
  if (title.startsWith(term)) s += 100
  else if (title.includes(term)) s += 70
  if (mod.includes(term)) s += 55
  if (text.includes(term)) s += 35
  if (tokens.length > 1) {
    const hits = tokens.filter((t) => hay.includes(t)).length
    if (hits === tokens.length) s += 30
    else if (hits) s += hits * 5
  }
  return s
}

function ResultRow({ row, tokens, index }) {
  const href = row.href || `/learn?focus=${row.moduleId}`
  const resource = row.resource || getModuleById(row.moduleId)?.authority?.name || row.source

  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1], delay: Math.min(index * 0.02, 0.2) }}
    >
      <Link to={href} className="pressable group flex items-start gap-4 p-4">
        <div className={`tile tile-${toneFor(row.moduleId)} h-12 w-12 rounded-2xl`}>
          <Sigil id={row.sigil} size={24} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-caption font-semibold text-fg-dim">
            <Marked text={row.module} tokens={tokens} />
          </div>
          <h3 className="t3 mt-0.5">
            <Marked text={row.title} tokens={tokens} />
          </h3>
          <p className="caption mt-1 line-clamp-2">
            <Marked text={clamp(row.text)} tokens={tokens} />
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <Pill>{row.difficulty}</Pill>
            <span className="min-w-0 truncate text-caption text-fg-dim">{resource}</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-3">
          <span className="chip-xp">+{row.xp} XP</span>
          <ArrowRight
            size={16}
            className="text-fg-faint transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-electric-300"
            strokeWidth={2.2}
          />
        </div>
      </Link>
    </motion.li>
  )
}

export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const urlQ = params.get('q') || ''
  const [term, setTerm] = useState(urlQ)
  const inputRef = useRef(null)
  const desktop = useMediaQuery('(min-width: 1024px)')

  // Keep the field in step when the URL changes (back button, /search?q=… link).
  useEffect(() => {
    setTerm(urlQ)
  }, [urlQ])

  // The "/" hint has to do something.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey) return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return
      e.preventDefault()
      inputRef.current?.focus()
      inputRef.current?.select()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const tokens = useMemo(
    () => term.toLowerCase().split(/\s+/).filter((t) => t.length > 1),
    [term],
  )
  const needle = term.trim().toLowerCase()

  const results = useMemo(() => {
    if (!needle) return []
    return searchIndex
      .map((row) => ({ row, s: score(row, needle, tokens) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((x) => x.row)
  }, [needle, tokens])

  const grouped = useMemo(
    () =>
      GROUP_ORDER.map((g) => ({ ...g, rows: results.filter((r) => r.kind === g.key) })).filter(
        (g) => g.rows.length,
      ),
    [results],
  )

  const commit = (value) => {
    setTerm(value)
    setParams(value.trim() ? { q: value.trim() } : {}, { replace: true })
  }

  const totals = useMemo(() => {
    const kinds = { topic: 0, scenario: 0, quiz: 0 }
    results.forEach((r) => {
      kinds[r.kind] += 1
    })
    return kinds
  }, [results])

  return (
    <div className="mx-auto max-w-[900px] space-y-10 pb-4">
      <div className="pt-4 text-center sm:pt-8">
        <div className="eyebrow mb-3">Search</div>
        <h1 className="t1">What do you want to know?</h1>
        <p className="lead mx-auto mt-2 max-w-xl">
          Topics, real-life scenarios and quiz questions in plain words. Try “my refund never came”.
        </p>
      </div>

      <div>
        <div className="relative">
          <SearchIcon
            size={22}
            className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-electric-300"
            strokeWidth={2.2}
          />
          <input
            ref={inputRef}
            value={term}
            autoFocus={desktop && !urlQ}
            onChange={(e) => commit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') commit('')
            }}
            type="search"
            aria-label="Search topics, scenarios and quiz questions"
            placeholder="cyber fraud, refund, drunk driving, ragging…"
            className="sheet-lg w-full py-5 pl-14 pr-16 text-lead text-fg outline-none placeholder:text-fg-faint focus:ring-2 focus:ring-electric-500/60"
          />
          {term ? (
            <button
              type="button"
              onClick={() => {
                commit('')
                inputRef.current?.focus()
              }}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-xl text-fg-dim transition-colors hover:bg-white/10 hover:text-fg"
            >
              <X size={18} />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-5 top-1/2 hidden -translate-y-1/2 rounded-md bg-white/[0.06] px-2 py-0.5 text-micro font-semibold text-fg-dim sm:block">
              /
            </kbd>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {SUGGESTED.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => commit(s)}
              className={`chip min-h-[36px] px-3.5 transition-colors duration-200 hover:bg-white/[0.1] hover:text-fg ${
                needle === s.toLowerCase() ? 'chip-electric' : ''
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ----------------------------------------------------------- results */}
      {!needle ? (
        <div className="sheet-lg sheet-focal flex flex-col items-center gap-4 p-8 text-center sm:p-10">
          <div className="tile tile-violet h-14 w-14 rounded-2xl">
            <Sparkles size={26} strokeWidth={2} />
          </div>
          <h2 className="t2">Pick a suggestion, or ask in your own words</h2>
          <p className="copy max-w-md">
            Search covers all eight topics, their scenarios and every quiz question. Not sure what to type? LawLink AI can
            explain it step by step.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button as={Link} to="/ai" variant="primary" iconRight={ArrowRight}>
              Ask LawLink AI
            </Button>
            <Button as={Link} to="/learn" variant="ghost" icon={BookOpen}>
              Browse all topics
            </Button>
          </div>
        </div>
      ) : results.length === 0 ? (
        <Card>
          <EmptyState
            icon={SearchX}
            title={`Nothing matches “${term.trim()}”`}
            body="This page only searches LawLink’s own verified content, so it cannot answer anything that is not in a topic. Try one word, or ask the assistant directly."
            action={
              <div className="flex flex-col items-center gap-4">
                {/* the ONE primary button on this screen */}
                <Button as={Link} to="/ai" variant="primary" iconRight={ArrowRight}>
                  Ask LawLink AI instead
                </Button>
                <div className="flex max-w-lg flex-wrap items-center justify-center gap-1.5">
                  {SUGGESTED.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => commit(s)}
                      className="chip hover:bg-white/[0.1] hover:text-fg"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            }
          />
        </Card>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="num-lg">
              {results.length}
              <span className="text-caption font-semibold text-fg-dim">
                {' '}
                {results.length === 1 ? 'result' : 'results'}
              </span>
            </span>
            <span className="caption tnum">
              {totals.topic} topic · {totals.scenario} scenario · {totals.quiz} quiz — exact phrase
              first, then matching words. Ordered by relevance.
            </span>
          </div>

          {grouped.map((g) => (
            <section key={g.key}>
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="t2">
                  {g.title} <span className="chip ml-1 align-middle">{g.rows.length}</span>
                </h2>
                <span className="caption">{g.sub}</span>
              </div>
              <ul className="space-y-3">
                {g.rows.map((row, i) => (
                  <ResultRow
                    key={`${g.key}-${row.id}-${row.title}`}
                    row={row}
                    tokens={tokens}
                    index={i}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------ footer */}
      <div className="space-y-3 border-t border-white/[0.05] pt-6">
        <h3 className="t3">About these results</h3>
        <p className="copy measure">
          Everything above comes from LawLink’s own verified content — eight topics, their scenarios
          and quiz questions, each checked against an official source. It is not a live search of the
          internet, so if something is urgent or time-bound, go straight to{' '}
          <Link to="/emergency" className="font-semibold text-danger hover:underline">
            Emergency help
          </Link>{' '}
          instead of searching here.
        </p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="flex items-center gap-2">
            <Siren size={13} strokeWidth={2.2} className="text-danger" />
            <Link to="/emergency" className="caption font-semibold text-fg-muted hover:text-fg">
              Emergency numbers
            </Link>
          </span>
          <span className="flex items-center gap-2">
            <Sparkles size={13} strokeWidth={2.2} className="text-fg-dim" />
            <Link to="/ai" className="caption font-semibold text-fg-muted hover:text-fg">
              Ask LawLink AI
            </Link>
          </span>
        </div>
        <DisclaimerNote compact />
      </div>
    </div>
  )
}
