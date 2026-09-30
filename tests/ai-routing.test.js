/**
 * LawLink AI routing.
 *
 * The intent engine is keyword based, so its failure mode is a confident answer to the
 * wrong question ("Someone is stalking me" answered with the emergency-numbers card, or
 * "I won a crore" answered with maternity leave). These tests pin the seven quick-category
 * chips to their intended intents and keep the generic trigger words from hijacking answers.
 */
import { describe, it, expect } from 'vitest'
import { QUICK_CATEGORIES, INTENTS, matchIntent, buildReply } from '../src/data/aiKnowledge.js'

const EXPECTED = {
  cybercrime: 'cy-money-lost',
  consumer: 'c-order-missing',
  student: 'st-ragging',
  workplace: 'wp-salary',
  road: 'rd-dui',
  privacy: 'pv-data',
  safety: 'sf-stalking',
}

describe('quick-category chips route to their intended intent', () => {
  it('there is a chip for every module in EXPECTED, and nothing else', () => {
    expect(QUICK_CATEGORIES.map((c) => c.key).sort()).toEqual(Object.keys(EXPECTED).sort())
  })

  it.each(QUICK_CATEGORIES.map((c) => [c.key, c.q]))('%s chip: %s', (key, q) => {
    const { intent } = matchIntent(q)
    expect(intent?.id).toBe(EXPECTED[key])
    expect(intent.module).toBe(key)
  })
})

describe('generic words no longer hijack an answer', () => {
  it.each([
    'help me',
    'not sure where do i go',
    'what are my rights',
    'someone is at the door',
    'what is the number',
    'I won a crore',
    'fine',
    'court case',
    'law',
  ])('%j matches nothing', (q) => {
    expect(matchIntent(q).intent).toBeNull()
  })

  it('a single weak word never makes a match on its own', () => {
    for (const q of ['order', 'senior', 'speed', 'hostel', 'education']) {
      expect(matchIntent(q).intent, q).toBeNull()
    }
  })
})

describe('normalisation', () => {
  it('apostrophes and hyphens do not break matching', () => {
    expect(matchIntent("The parcel didn't come").intent?.id).toBe('c-order-missing')
    expect(matchIntent('The parcel didn’t come').intent?.id).toBe('c-order-missing')
    expect(matchIntent('I got an e-challan').intent?.id).toBe('rd-dui')
    expect(matchIntent('I got an e challan').intent?.id).toBe('rd-dui')
  })

  it('emergency intents match ambulance and fire queries', () => {
    expect(matchIntent('I need an ambulance number').intent?.id).toBe('g-emergency')
    expect(matchIntent('fire brigade number').intent?.id).toBe('g-emergency')
  })

  it('is deterministic', () => {
    const q = 'my salary was not paid on time'
    const first = matchIntent(q)
    for (let i = 0; i < 5; i += 1) expect(matchIntent(q)).toEqual(first)
  })
})

describe('emergency content is right', () => {
  const emergency = INTENTS.find((i) => i.id === 'g-emergency')
  const text = JSON.stringify(emergency)

  it('101 is fire and 108 is the ambulance', () => {
    expect(text).toMatch(/101 is the fire service/)
    expect(text).toMatch(/108 is the ambulance/)
    expect(text).not.toMatch(/101 for an ambulance/)
  })

  it('every intent has a coherent reply and resource label', () => {
    for (const intent of INTENTS) {
      const r = buildReply(intent, 'x')
      expect(r.steps.length, intent.id).toBeGreaterThan(0)
      expect(intent.resource.label, intent.id).toBeTruthy()
      // 112 is the all-in-one number, not "Police emergency".
      expect(intent.resource.label, intent.id).not.toMatch(/Police emergency\s*—\s*112/)
      expect(intent.resource.href, intent.id).not.toMatch(/^http:\/\//)
    }
  })

  it('every keyword is reachable (long enough to be tokenised, and not upper-case)', () => {
    const dead = []
    for (const i of INTENTS) {
      for (const k of i.keywords) {
        if (k !== k.toLowerCase()) dead.push(`${i.id}: ${k} (upper-case)`)
        if (!k.includes(' ') && k.replace(/[^a-z0-9]/gi, '').length <= 2) dead.push(`${i.id}: ${k} (too short to match)`)
      }
    }
    expect(dead).toEqual([])
  })
})
