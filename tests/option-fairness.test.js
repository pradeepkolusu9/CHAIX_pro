/**
 * Option-length fairness.
 *
 * The copy reviewer measured that in 24 of 40 scenarios the correct option was
 * >=1.6x longer than the average wrong option — up to 2.9x — and that all 40
 * correct options had a UNIQUE length. The lesson a student actually learned was
 * "pick the longest line", which is uncorrelated with knowing the law and
 * defeats the entire purpose of the module.
 *
 * These tests lock the fix in place so it cannot drift back.
 */
import { describe, it, expect } from 'vitest'
import { allScenarios } from '../src/data/modules.js'

const len = (s) => s.trim().length

function ratioFor(sc) {
  const correct = sc.options.find((o) => o.id === sc.correct)
  const wrong = sc.options.filter((o) => o.id !== sc.correct)
  if (!correct || !wrong.length) return null
  const meanWrong = wrong.reduce((a, o) => a + len(o.text), 0) / wrong.length
  return { correct: correct.text, ratio: len(correct.text) / meanWrong }
}

describe('the correct answer is not identifiable by length', () => {
  const ratios = allScenarios.map((s) => ({ id: s.id, ...ratioFor(s) })).filter((r) => r.ratio != null)

  it('scenarios are actually being measured', () => {
    expect(ratios.length).toBe(allScenarios.length)
    expect(ratios.length).toBeGreaterThanOrEqual(40)
  })

  it('no correct option is more than 1.45x the mean of its distractors', () => {
    const bad = ratios.filter((r) => r.ratio > 1.45)
    expect(
      bad.map((b) => `${b.id} ${b.ratio.toFixed(2)}x`),
      'correct answer is longer than its distractors — length gives it away',
    ).toEqual([])
  })

  it('no correct option is dramatically SHORTER than its distractors either', () => {
    // The mirror failure is just as bad: it teaches "the terse one is right".
    const bad = ratios.filter((r) => r.ratio < 0.7)
    expect(bad.map((b) => `${b.id} ${b.ratio.toFixed(2)}x`)).toEqual([])
  })

  /* A correct option that is LONGEST by 1–2 characters is noise, not a tell: with
     four options the longest is unique about half the time by chance. The real
     defect was a 2.9x outlier, so these assert a *meaningful* margin. A reader
     cannot perceive an 8-character difference across rows of different text;
     they absolutely can perceive a 30-character one. */
  const MARGIN = 8

  it('the correct option is never meaningfully the longest', () => {
    const offenders = allScenarios.filter((s) => {
      const correct = s.options.find((o) => o.id === s.correct)
      if (!correct) return false
      const maxWrong = Math.max(...s.options.filter((o) => o.id !== s.correct).map((o) => len(o.text)))
      return len(correct.text) - maxWrong > MARGIN
    })
    expect(offenders.map((o) => o.id)).toEqual([])
  })

  it('the correct option is never meaningfully the shortest', () => {
    const offenders = allScenarios.filter((s) => {
      const correct = s.options.find((o) => o.id === s.correct)
      if (!correct) return false
      const minWrong = Math.min(...s.options.filter((o) => o.id !== s.correct).map((o) => len(o.text)))
      return minWrong - len(correct.text) > MARGIN
    })
    expect(offenders.map((o) => o.id)).toEqual([])
  })

  it('options stay within a readable single-line band', () => {
    // 78 chars is roughly two 13.5px lines in a 68ch column; beyond that the
    // longest option is also the tallest tap target, which biases the click twice.
    const long = allScenarios.flatMap((s) =>
      s.options.filter((o) => len(o.text) > 110).map((o) => `${s.id}/${o.id} ${len(o.text)}ch`),
    )
    expect(long, 'options too long to render evenly').toEqual([])
  })
})

describe('the hint is a nudge, not a compressed answer key', () => {
  const stop = new Set(['the', 'a', 'an', 'and', 'or', 'to', 'of', 'in', 'on', 'for', 'is', 'it', 'you', 'your', 'that', 'this', 'be', 'are', 'was', 'if', 'as', 'at', 'by', 'not', 'no', 'do', 'can', 'they', 'their', 'them', 'from', 'with', 'ask', 'write', 'send', 'call'])

  const words = (s) =>
    new Set(
      String(s)
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 3 && !stop.has(w)),
    )

  it('no hint shares a third of its vocabulary with the correct option', () => {
    const offenders = []
    for (const s of allScenarios) {
      if (!s.hint) continue
      const correct = s.options.find((o) => o.id === s.correct)
      if (!correct) continue
      const hw = words(s.hint)
      if (!hw.size) continue
      const cw = words(correct.text)
      const shared = [...hw].filter((w) => cw.has(w))
      const overlap = shared.length / Math.max(hw.size, cw.size)
      if (overlap >= 0.34) offenders.push(`${s.id} ${Math.round(overlap * 100)}%`)
    }
    expect(offenders, 'hint leaks the correct answer').toEqual([])
  })
})
