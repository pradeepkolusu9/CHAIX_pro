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
  SectionHeading,
  Pill,
  Button,
  EmptyState,
  DisclaimerNote,
  Sigil,
} from '../components/ui/index.jsx'
import { searchIndex, getModuleById } from '../data/modules.js'
import { useMediaQuery } from '../lib/hooks.js'

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

const KIND = {
  topic: 'Topic',
  scenario: 'Scenario',
  quiz: 'Quiz',
}

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
        <span key={i} className="font-semibold text-electric-300">
          {part}
        </span>
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
      className="divide-y divide-white/[0.05]"
    >
      <Link to={href} className="group flex items-start gap-3.5 py-3.5">
        <Sigil id={row.sigil} size={16} className="mt-1 shrink-0 text-fg-dim" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="eyebrow">{KIND[row.kind]}</span>
            <span className="text-caption text-fg-dim">
              <Marked text={row.module} tokens={tokens} />
            </span>
            <h3 className="t3 min-w-0 basis-full truncate sm:basis-auto sm:flex-1">
              <Marked text={row.title} tokens={tokens} />
            </h3>
            <span className="num shrink-0 text-xp-300">+{row.xp} XP</span>
          </div>
          <p className="caption mt-1 line-clamp-2">
            <Marked text={clamp(row.text)} tokens={tokens} />
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <Pill>{row.difficulty}</Pill>
            <span className="min-w-0 truncate text-caption text-fg-dim">{resource}</span>
          </div>
        </div>

        <ArrowRight
          size={14}
          className="mt-1 shrink-0 text-fg-faint transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-fg-muted"
          strokeWidth={2.2}
        />
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
    <div className="mx-auto max-w-[900px] space-y-8 pb-4">
      <SectionHeading
        eyebrow="Search"
        title="Search Indian law, in plain words"
        sub="Every topic, real-life scenario and quiz question in LawLink. Type what you actually want to know — “my refund never came”, “harassment in college” — and read the result before you open it."
      />

      {/* ------------------------------------------------------------ input */}
      <div>
        <div className="relative">
          <SearchIcon
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-fg-dim"
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
            className="pressable w-full py-4 pl-11 pr-24 text-lead text-fg outline-none placeholder:text-fg-faint focus:ring-2 focus:ring-inset focus:ring-electric-500/50"
          />
          {term ? (
            <button
              type="button"
              onClick={() => {
                commit('')
                inputRef.current?.focus()
              }}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-fg-dim transition-colors hover:bg-white/10 hover:text-fg"
            >
              <X size={16} />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-md bg-white/[0.05] px-1.5 py-0.5 text-micro font-semibold text-fg-dim sm:block">
              /
            </kbd>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="eyebrow mr-1">Suggested</span>
          {SUGGESTED.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => commit(s)}
              className={`chip transition-colors duration-200 hover:bg-white/[0.1] hover:text-fg ${
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
        <Card>
          <EmptyState
            icon={Sparkles}
            title="Pick one of the suggestions above"
            body="Nothing is typed yet. Search covers all eight topics, their scenarios and every quiz question — results stay inside LawLink’s verified content, so what you read here matches the lesson."
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button as={Link} to="/learn" variant="ghost" icon={BookOpen}>
                  Browse all topics
                </Button>
                <Button as={Link} to="/ai" variant="primary" iconRight={ArrowRight}>
                  Ask LawLink AI
                </Button>
              </div>
            }
          />
        </Card>
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
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="t2">{g.title}</h2>
                <span className="caption">{g.sub}</span>
              </div>
              <ul>
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
