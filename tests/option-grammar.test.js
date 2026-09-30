/**
 * Grammar guard for scenario and quiz options.
 *
 * A mechanical balancing pass once truncated ~20 options mid-sentence ("...ask other
 * buyers to", "...the crack was", "...a clerk hands"). A mangled option reads as a bug
 * and, worse, in one case left the CORRECT answer a non-sequitur. These tests fail the
 * moment an option is not a complete sentence, so that class of damage cannot come back.
 *
 * The checker is itself tested against the real broken strings from the old data, so
 * the guard is proven to catch them (a weaker regex once shipped and caught none).
 */
import { describe, it, expect } from 'vitest'
import { MODULES, allScenarios, allQuiz } from '../src/data/modules.js'

/* Words that cannot end a sentence. Anything ending on one is a dangling fragment. */
const DANGLING = new Set([
  'and', 'or', 'the', 'a', 'an', 'to', 'of', 'for', 'with', 'without', 'that', 'which', 'its', 'their', 'your',
  'this', 'by', 'from', 'about', 'into', 'than', 'as', 'if', 'but', 'so', 'is', 'was', 'has', 'have', 'had',
  'can', 'could', 'will', 'would', 'should', 'no', 'longer', 'hands', 'one', 'before', 'after', 'until',
  'because', 'while', 'whether', 'are', 'were', 'be', 'been', 'his', 'her', 'our', 'my', 'any', 'each',
  'every', 'let', 'promise', 'high', 'internal', 'over', 'at', 'also', 'both', 'either',
])

const words = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9₹\s'-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^['-]+|['-]+$/g, ''))
    .filter(Boolean)

/* Every word used anywhere in the content, with counts. A word cut mid-way ("petiti")
   occurs once at most and is a strict prefix of a real, longer word ("petition"). */
const COUNT = new Map()
const add = (s) => words(s).forEach((w) => COUNT.set(w, (COUNT.get(w) || 0) + 1))
for (const m of MODULES) {
  m.intro.body.forEach(add)
  m.lessons.forEach((l) => l.body.forEach(add))
  for (const s of m.scenarios) {
    add(s.situation)
    add(s.why)
    s.rights.forEach(add)
    s.doThis.forEach((d) => add(d.text))
    s.options.forEach((o) => add(o.text))
  }
  for (const q of m.quiz) {
    add(q.question)
    add(q.why)
    q.options.forEach(add)
  }
}
const ALL = [...COUNT.keys()]

/* "to <verb>" at the very end of an option is an unfinished infinitive clause. */
const BASE_VERBS = new Set(['create', 'make', 'take', 'find', 'give', 'send', 'tell', 'use', 'read', 'sign', 'judge', 'get'])

/* Real words the cut-mid-word heuristic would otherwise mistake for a stump ("win" of "window"). */
const COMPLETE_WORDS = new Set(['win', 'auto', 'stand', 'decide', 'leak', 'clean'])

/** Returns a reason string when the option is not a complete sentence, else null. */
export function fragmentReason(text) {
  const t = String(text).trim()
  if (/[,;:—–-]$/.test(t)) return 'ends on punctuation that continues a sentence'
  if (/[0-9)\]]$/.test(t)) return null // ends on a number or a closing bracket, e.g. "Article 19(1)(a)"
  const ws = words(t)
  const last = ws[ws.length - 1] || ''
  if (!last) return 'empty'
  if (last === 'no' && /\b(say|says|said|tell (him|her|them|us)|answer|reply)\s+no$/i.test(t)) return null // "tell them no" is complete
  if (DANGLING.has(last)) return `ends on "${last}"`
  if (/,\s*and\s+(if|once|unless)\b[^,]*$/i.test(t)) return 'opens a conditional clause and never finishes it'
  if (ws.length > 1 && ws[ws.length - 2] === 'to' && BASE_VERBS.has(last)) return `ends on "to ${last}"`
  const isNumber = /^[0-9₹]/.test(last)
  if (!isNumber && !COMPLETE_WORDS.has(last) && last.length >= 3 && (COUNT.get(last) || 0) <= 1 && ALL.some((w) => w.length > last.length && w.startsWith(last))) {
    return `last word "${last}" looks cut mid-word`
  }
  return null
}

describe('the checker catches the real broken options from the old data', () => {
  // Verbatim from the shipped data before the fix. Each ends mid-sentence.
  const OLD_BROKEN = [
    'Accept it — a seven-day window in a policy you did not read is',
    'Push back in the app chat until the seller admits the crack was',
    'Post the founder\'s photos and number online to create',
    'Post the whole story online with the seniors\' names and let',
    'Visit the accounts office every week until a clerk hands',
    'Wait until Nikhil turns 14, because the school can no longer',
    'Take the facts and photos to a lawyer and file a public interest petition before the High',
    'Show a photo of the RC on your phone and promise',
    'Let him take the test, and if it is above the limit',
    'Write down what happened, then submit a written complaint to your college\'s internal',
    'Go back and try to talk it through with him calmly one',
    'Keep working until the last week so the handover is',
    'Take a screenshot of your bank statement showing the salary has',
    'Resubmit Meera\'s form a second time in her name without',
    'Ask for an appointment letter and a written record of',
    'Take the photos and lawyer to file a public interest petiti',
  ]
  it.each(OLD_BROKEN)('flags: %s', (s) => {
    expect(fragmentReason(s), s).not.toBeNull()
  })

  it('does not flag ordinary complete options', () => {
    for (const ok of [
      'Screenshot the profile and report it on the platform',
      'Call the National Consumer Helpline on 1915',
      'Keep the messages, change passwords and report it',
      'Verify by video call or a question only your friend can answer',
    ]) {
      expect(fragmentReason(ok), ok).toBeNull()
    }
  })
})

describe('no option is truncated mid-sentence', () => {
  it('no scenario option is a fragment', () => {
    const bad = []
    for (const s of allScenarios) {
      for (const o of s.options) {
        const r = fragmentReason(o.text)
        if (r) bad.push(`${s.id}/${o.id} ${JSON.stringify(o.text)} — ${r}`)
      }
    }
    expect(bad, 'truncated scenario options').toEqual([])
  })

  it('no quiz option is a fragment', () => {
    const bad = []
    for (const q of allQuiz) {
      q.options.forEach((o, i) => {
        const r = fragmentReason(o)
        if (r) bad.push(`${q.id}/${i} ${JSON.stringify(o)} — ${r}`)
      })
    }
    expect(bad, 'truncated quiz options').toEqual([])
  })

  it('the correct scenario option is related to its own explanation', () => {
    // Guards the "Reply asking them to remove their earphones" class of bug: a correct answer
    // that is a non-sequitur. A cheap proxy: it must share a content word (or a 5-letter stem)
    // with the scenario's own why / steps / rights.
    const stop = new Set(['their', 'asking', 'about', 'other', 'would', 'there', 'which', 'these', 'those', 'with', 'from', 'that', 'this', 'them', 'they', 'your', 'have', 'been', 'will'])
    const content = (s) => words(s).filter((w) => w.length > 4 && !stop.has(w))
    const bad = []
    for (const s of allScenarios) {
      const c = s.options.find((o) => o.id === s.correct)
      const ref = content(`${s.why} ${s.doThis.map((d) => d.text).join(' ')} ${s.rights.join(' ')}`)
      const shared = content(c.text).filter((w) => ref.some((x) => x.startsWith(w.slice(0, 5))))
      if (!shared.length) bad.push(`${s.id} ${JSON.stringify(c.text)}`)
    }
    expect(bad, 'correct option unrelated to its own explanation').toEqual([])
  })

  it('no scenario option is empty or absurdly short/long', () => {
    for (const s of allScenarios) {
      for (const o of s.options) {
        expect(o.text.trim().length, `${s.id}/${o.id}`).toBeGreaterThanOrEqual(24)
        expect(o.text.trim().length, `${s.id}/${o.id}`).toBeLessThanOrEqual(100)
      }
    }
  })

  it('every option starts with a capital letter or digit', () => {
    for (const s of allScenarios) {
      for (const o of s.options) {
        expect(o.text.trim()[0], `${s.id}/${o.id} ${o.text}`).toBe(o.text.trim()[0].toUpperCase())
      }
    }
    for (const q of allQuiz) {
      q.options.forEach((o, i) => {
        expect(o.trim()[0], `${q.id}/${i} ${o}`).toBe(o.trim()[0].toUpperCase())
      })
    }
  })
})
