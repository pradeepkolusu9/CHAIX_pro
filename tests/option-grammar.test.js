/**
 * Grammar guard for scenario options.
 *
 * A mechanical balancing pass truncated 17 options mid-sentence ("...ask other
 * buyers to"). A mangled option is worse than a long one: it reads as a bug, and
 * the entire point of the length work was that no option looks different in
 * weight. This test fails the moment an option ends on a word that cannot end a
 * sentence, so the class of damage cannot come back.
 */
import { describe, it, expect } from 'vitest'
import { allScenarios } from '../src/data/modules.js'

/* Words that CAN end a sentence. Everything else is a dangling fragment. */
const DANGLING = /\b(and|or|the|a|an|to|of|for|with|that|which|its|their|your|this|by|from|about|into|than|as|if|but|so)$/i

describe('no option is truncated mid-sentence', () => {
  it('no option ends on a dangling function word', () => {
    const bad = []
    for (const s of allScenarios) {
      for (const o of s.options) {
        if (DANGLING.test(o.text.trim())) bad.push(`${s.id}/${o.id} ${JSON.stringify(o.text)}`)
      }
    }
    expect(bad, 'truncated options').toEqual([])
  })

  it('no option ends on a dangling punctuation mark', () => {
    const bad = []
    for (const s of allScenarios) {
      for (const o of s.options) {
        if (/[,;—-]$/.test(o.text.trim())) bad.push(`${s.id}/${o.id} ${JSON.stringify(o.text)}`)
      }
    }
    expect(bad, 'options ending on a comma or dash').toEqual([])
  })

  it('no option is empty or absurdly short', () => {
    for (const s of allScenarios) {
      for (const o of s.options) {
        expect(o.text.trim().length, `${s.id}/${o.id}`).toBeGreaterThanOrEqual(24)
        expect(o.text.trim().length, `${s.id}/${o.id}`).toBeLessThanOrEqual(100)
      }
    }
  })

  it('every option starts with a capital letter', () => {
    for (const s of allScenarios) {
      for (const o of s.options) {
        expect(o.text.trim()[0], `${s.id}/${o.id} ${o.text}`).toBe(o.text.trim()[0].toUpperCase())
      }
    }
  })
})
