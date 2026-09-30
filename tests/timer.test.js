import { describe, it, expect } from 'vitest'
import { clockSweep, ringArc, ringGeometry, timerTone, formatClock } from '../src/lib/timer.js'

describe('the 60-second ring is a clock, not a progress bar', () => {
  it('sweeps from full at 60s to empty at 0s', () => {
    expect(clockSweep(60, 60)).toBe(360)
    expect(clockSweep(0, 60)).toBe(0)
  })

  it('is 180 at the halfway point', () => {
    expect(clockSweep(30, 60)).toBe(180)
  })

  it('decreases monotonically as time runs out', () => {
    let prev = Infinity
    for (let s = 60; s >= 0; s -= 1) {
      const v = clockSweep(s, 60)
      expect(v).toBeLessThanOrEqual(prev)
      prev = v
    }
  })

  it('clamps out-of-range input instead of producing a broken arc', () => {
    expect(clockSweep(-5, 60)).toBe(0)
    expect(clockSweep(999, 60)).toBe(360)
    expect(clockSweep(10, 0)).toBe(0)
  })
})

describe('ringArc', () => {
  const g = ringGeometry(128, 8)

  it('starts at 12 o\'clock', () => {
    const d = ringArc({ r: g.r, sw: g.sw, sweepDeg: 90 })
    expect(d.startsWith('M ')).toBe(true)
    const [, sx, sy] = d.match(/M ([\d.]+) ([\d.]+)/).map(Number)
    expect(sx).toBeCloseTo(g.r, 3)
    expect(sy).toBeCloseTo(0, 3)
  })

  it('ends on the horizontal axis for a quarter turn', () => {
    const d = ringArc({ r: g.r, sw: g.sw, sweepDeg: 90 })
    const parts = d.split(' ')
    const x = Number(parts[parts.length - 2])
    const y = Number(parts[parts.length - 1])
    expect(x).toBeCloseTo(0, 2)
    expect(y).toBeCloseTo(g.r, 2)
  })

  it('uses the large-arc flag past 180 degrees', () => {
    expect(ringArc({ r: 10, sw: 2, sweepDeg: 100 })).toContain('0 0 1')
    expect(ringArc({ r: 10, sw: 2, sweepDeg: 260 })).toContain('0 1 1')
  })

  it('clamps a full turn so a single arc can still render', () => {
    const d = ringArc({ r: 10, sw: 2, sweepDeg: 360 })
    expect(d).toMatch(/A 10 10 0 \d 1/)
    expect(d).not.toContain('NaN')
  })

  it('never emits NaN for any sweep in 0..360', () => {
    for (let s = 0; s <= 360; s += 1) {
      expect(ringArc({ r: 10, sw: 2, sweepDeg: s })).not.toContain('NaN')
    }
  })
})

describe('ringGeometry keeps the stroke inside the box', () => {
  it('inset by half the stroke width so nothing clips', () => {
    const { r, c } = ringGeometry(128, 8)
    expect(c).toBe(64)
    expect(r).toBe(60) // (128 - 8) / 2
    expect(r + 8 / 2).toBeLessThanOrEqual(c)
  })
})

describe('urgency tone keys off seconds remaining, not elapsed fraction', () => {
  it('is calm with room, then warns, then urgent', () => {
    expect(timerTone(60)).toBe('good')
    expect(timerTone(21)).toBe('good')
    expect(timerTone(20)).toBe('warn')
    expect(timerTone(11)).toBe('warn')
    expect(timerTone(10)).toBe('danger')
    expect(timerTone(0)).toBe('danger')
  })
})

describe('formatClock', () => {
  it('always reads 00:SS so the width never jumps', () => {
    expect(formatClock(60)).toBe('00:60')
    expect(formatClock(9)).toBe('00:09')
    expect(formatClock(0)).toBe('00:00')
  })

  it('never shows a negative or fractional time', () => {
    expect(formatClock(-3)).toBe('00:00')
    expect(formatClock(0.2)).toBe('00:01')
  })
})
