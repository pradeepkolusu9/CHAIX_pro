/**
 * Content integrity + honesty tests.
 *
 * The product's whole value is that its legal information is trustworthy. These
 * tests are the cheapest possible guard on that claim, and they encode two real
 * failures we shipped: a "Verified" badge over AI-authored text, and a hardcoded
 * date that pretended every item had been checked on the same day it was written.
 */
import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import { MODULES, allScenarios, allQuiz } from '../src/data/modules.js'
import { FACTS } from '../src/data/facts.js'
import { RESOURCES, VERIFIED_ON } from '../src/data/resources.js'
import { REVIEW, reviewFor, REVIEW_STATE, ALLOWED_HELPLINES, auditHelplines, collectHelplineEntries } from '../src/lib/review.js'

const allStrings = () => [
  ...MODULES.flatMap((m) => [
    m.tagline,
    m.blurb,
    m.legalBasis.law,
    m.legalBasis.section,
    m.legalBasis.note,
    m.intro.heading,
    ...m.intro.body,
    ...m.intro.keyPoints,
    ...m.lessons.flatMap((l) => [l.title, ...l.body, l.takeaway]),
    ...m.scenarios.flatMap((s) => [s.title, s.situation, s.why, s.hint || '', ...s.rights, ...s.doThis.map((d) => d.text), s.law || '']),
    ...m.quiz.flatMap((q) => [q.question, q.why, q.law]),
  ]),
  ...FACTS.flatMap((f) => [f.title, f.body, f.linkLabel]),
  ...RESOURCES.flatMap((r) => [r.name, r.about, r.source]),
]

describe('no invented helpline numbers', () => {
  it('every phone number in the product is on the whitelist', () => {
    // Audits the structured fields that can hold a number. A prose scan was
    // tried and abandoned: "Act, 1988", "s.185", "₹4,999" are all bare numbers,
    // so a text scan flagged the whole corpus and proved nothing.
    const entries = collectHelplineEntries(MODULES, RESOURCES)
    expect(entries.length, 'no helplines found — the audit is not actually checking anything').toBeGreaterThan(5)
    const bad = auditHelplines(entries)
    expect(bad, `unverified numbers: ${bad.map((b) => `${b.number} (${b.where})`).join(', ')}`).toEqual([])
  })

  it('no prose string contains an 3-digit token in a phone-like context', () => {
    // Narrower than a full scan: look for the phrases a user would actually
    // read as a number to dial.
    const dialish = allStrings()
      .join(' ')
      .matchAll(/(?:dial|call|contact|phone|helpline|toll-?free)[^.;]{0,24}?(\d{3,4})/gi)
    const offenders = [...dialish].map((m) => m[1]).filter((n) => !ALLOWED_HELPLINES.includes(n))
    expect(offenders, `phone-like numbers in prose: ${offenders.join(', ')}`).toEqual([])
  })

  it('the whitelist itself contains only real Indian helplines', () => {
    for (const n of ALLOWED_HELPLINES) {
      expect(n).toMatch(/^\d{3,4}$/)
    }
    expect(ALLOWED_HELPLINES).toContain('112')
    expect(ALLOWED_HELPLINES).toContain('1930')
  })
})

describe('content completeness — no placeholders shipped to users', () => {
  it('no module carries an unfilled template value', () => {
    for (const m of MODULES) {
      const blob = JSON.stringify(m)
      for (const bad of ['lorem', 'TODO', 'TBD', 'coming soon', 'FIXME', 'undefined', 'placeholder']) {
        expect(blob.toLowerCase(), `${m.id} contains "${bad}"`).not.toContain(bad.toLowerCase())
      }
    }
  })

  it('every scenario has real options, a correct answer and a real explanation', () => {
    for (const s of allScenarios) {
      expect(s.options.length, s.id).toBeGreaterThanOrEqual(3)
      expect(s.options.some((o) => o.id === s.correct), `${s.id} correct id is not an option`).toBe(true)
      expect(s.why.length, `${s.id} why`).toBeGreaterThan(60)
      expect(s.doThis.length, `${s.id} steps`).toBeGreaterThan(0)
      expect(s.rights.length, `${s.id} rights`).toBeGreaterThan(0)
    }
  })

  it('every quiz item points at a real option index', () => {
    for (const q of allQuiz) {
      expect(q.correct, q.id).toBeGreaterThanOrEqual(0)
      expect(q.correct, q.id).toBeLessThan(q.options.length)
    }
  })

  it('the answer is not always the same position', () => {
    // A predictable correct-answer position is a scoring exploit.
    const dist = {}
    for (const q of allQuiz) dist[q.correct] = (dist[q.correct] || 0) + 1
    const positions = Object.keys(dist)
    expect(positions.length, 'correct answers are clustered in one position').toBeGreaterThanOrEqual(3)
  })

  it('every module is registered for review', () => {
    for (const m of MODULES) {
      expect(REVIEW[m.id], `${m.id} has no review record`).toBeTruthy()
    }
  })
})

describe('review honesty — the claim must match the reality', () => {
  it('nothing is marked verified while it has no named reviewer', () => {
    for (const [id, r] of Object.entries(REVIEW)) {
      if (r.state === REVIEW_STATE.VERIFIED) {
        expect(r.owner, `${id} claims verified with no reviewer`).toBeTruthy()
      }
    }
  })

  it('every module has a primary source to check against', () => {
    for (const [id, r] of Object.entries(REVIEW)) {
      expect(r.primarySource, id).toMatch(/^https:\/\//)
    }
  })

  it('reviewFor falls back safely for an unknown id', () => {
    expect(reviewFor('nope').state).toBe(REVIEW_STATE.DRAFT)
  })
})

describe('the verified date is not a blanket claim', () => {
  it('a single date does not imply every item was checked on it', () => {
    // The old build stamped every item with the authoring date and shipped a
    // "Verified 2026-09-30" badge. VERIFIED_ON now describes the resource
    // DIRECTORY only, and must not be reused as a content-review claim.
    expect(VERIFIED_ON).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    for (const m of MODULES) {
      // Modules may still carry a date for provenance, but the UI must not read
      // it as a legal sign-off. The distinction is documented in lib/review.js.
      expect(typeof m.lastVerified).toBe('string')
    }
  })
})

describe('quiz structure', () => {
  it('every quiz question has exactly four distinct options (SCHEMA.md)', () => {
    const bad = allQuiz.filter((q) => q.options.length !== 4 || new Set(q.options.map((o) => o.trim().toLowerCase())).size !== 4)
    expect(bad.map((q) => q.id)).toEqual([])
  })

  it('ids are unique across scenarios, lessons and quiz items', () => {
    const ids = MODULES.flatMap((m) => [
      ...m.lessons.map((l) => l.id),
      ...m.scenarios.map((s) => s.id),
      ...m.quiz.map((q) => q.id),
    ])
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
    expect(dupes).toEqual([])
    for (const s of allScenarios) {
      expect(new Set(s.options.map((o) => o.id)).size, `${s.id} option ids`).toBe(s.options.length)
    }
  })

  it('the correct quiz option is the uniquely longest in at most 35% of questions', () => {
    const uniqueLongest = allQuiz.filter((q) => {
      const L = q.options.map((o) => o.length)
      const c = L[q.correct]
      return c === Math.max(...L) && L.filter((x) => x === c).length === 1
    })
    expect(uniqueLongest.length / allQuiz.length).toBeLessThanOrEqual(0.35)
  })

  it('correct answers are spread across all four positions', () => {
    const dist = [0, 0, 0, 0]
    for (const q of allQuiz) dist[q.correct] += 1
    for (const n of dist) expect(n / allQuiz.length).toBeGreaterThan(0.15)
  })
})

describe('demo progress only references content that exists', () => {
  it('every id listed in store.jsx demoState() exists in src/data', () => {
    const src = readFileSync(new URL('../src/lib/store.jsx', import.meta.url), 'utf8')
    const start = src.indexOf('export function demoState')
    expect(start, 'demoState not found').toBeGreaterThan(-1)
    const body = src.slice(start, src.indexOf('\nexport ', start + 10) > 0 ? src.indexOf('\nexport ', start + 10) : undefined)
    const known = new Set(MODULES.flatMap((m) => [...m.lessons.map((l) => l.id), ...m.scenarios.map((s) => s.id), ...m.quiz.map((q) => q.id)]))
    const used = [...body.matchAll(/'((?:sc|ls|q)-[a-z]{2}-\d+)'/g)].map((m) => m[1])
    expect(used.length, 'no ids found — the check is not reading anything').toBeGreaterThan(5)
    expect(used.filter((id) => !known.has(id))).toEqual([])
    const moduleKeys = [...body.matchAll(/^\s{8}([a-z]+): \{\s*$/gm)].map((m) => m[1])
    for (const k of moduleKeys) expect(MODULES.some((m) => m.id === k), `demo module ${k}`).toBe(true)
  })
})

describe('emergency numbers mean what they say', () => {
  it('101 is the fire service and 108 the ambulance in the resource directory', () => {
    const by = Object.fromEntries(RESOURCES.filter((r) => r.number).map((r) => [r.number, r]))
    expect(by['101'].name.toLowerCase()).toContain('fire')
    expect(by['101'].name.toLowerCase()).not.toContain('ambulance')
    expect(by['108'].name.toLowerCase()).toContain('ambulance')
  })

  it('no string calls 101 an ambulance number', () => {
    const bad = allStrings().filter((s) => /101[^.]{0,40}ambulance|ambulance[^.]{0,40}\b101\b/i.test(s))
    expect(bad).toEqual([])
  })

  it('no content cites a repealed or invented statute', () => {
    const blob = JSON.stringify([MODULES, FACTS, RESOURCES])
    for (const bad of ['Ragging Prohibition Act', 'Criminal Procedure, 1938', '1 October 2024', 'nios.ac.in', 'Section 65B of the Information Technology Act', 'Payment and Settlement Systems Act']) {
      expect(blob, bad).not.toContain(bad)
    }
    expect(blob).not.toMatch(/http:\/\//)
  })
})
