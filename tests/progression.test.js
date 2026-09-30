/**
 * Progression logic tests.
 *
 * These exist because the shipped store had five real bugs in this exact area:
 * a permanent module dead-end, a streak bonus that was shown but never applied,
 * a milestone that re-fired forever, a streak that never reset, and demo date
 * keys that were Date objects. Each one has a test below.
 */
import { describe, it, expect } from 'vitest'
import {
  touchStreak,
  recomputeStreak,
  quizCompletion,
  quizAnswerXp,
  sixtySecondXp,
  unlocksForLevel,
} from '../src/lib/progression.js'
import { levelForXp, LEVELS, TOTAL_MODULES, BADGES } from '../src/lib/gamification.js'
import { dayKeyList } from '../src/lib/dates.js'

const back = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return dayKeyList(d)
}
const today = () => dayKeyList(new Date())

describe('touchStreak', () => {
  it('starts a streak at 1 on first ever activity', () => {
    const { streak, milestone } = touchStreak({ activity: {} }, today())
    expect(streak.current).toBe(1)
    expect(milestone).toBe(false)
  })

  it('increments on a consecutive day', () => {
    const { streak } = touchStreak({ current: 3, longest: 3, lastActive: back(1), activity: {} }, today())
    expect(streak.current).toBe(4)
  })

  it('RESETS to 1 after a gap — the bug that let a stale streak keep climbing', () => {
    // Last activity was 5 days ago. Old code did current + 1.
    const { streak } = touchStreak({ current: 9, longest: 9, lastActive: back(5), activity: {} }, today())
    expect(streak.current).toBe(1)
    expect(streak.longest).toBe(9)
  })

  it('does not advance when the user acts twice in one day', () => {
    const t = today()
    const { streak, milestone } = touchStreak({ current: 6, longest: 6, lastActive: t, activity: { [t]: true } }, t)
    expect(streak.current).toBe(6)
    expect(milestone).toBe(false)
  })

  it('fires the 7-day milestone exactly when the current streak hits 7', () => {
    const { streak, milestone } = touchStreak(
      { current: 6, longest: 6, lastActive: back(1), activity: {} },
      today(),
    )
    expect(streak.current).toBe(7)
    expect(milestone).toBe(true)
  })

  it('does NOT re-fire the milestone on a later day from the same all-time longest', () => {
    // The old code tested longest % 7 === 0, so after one 7-day run the FIRST
    // activity of any later day paid the bonus again, even from a streak of 1.
    const s = { current: 1, longest: 7, lastActive: back(1), activity: {} }
    const { milestone } = touchStreak(s, today())
    expect(milestone).toBe(false)
  })

  it('fires again at 14, not at 8', () => {
    const at13 = touchStreak({ current: 13, longest: 13, lastActive: back(1), activity: {} }, today())
    expect(at13.streak.current).toBe(14)
    expect(at13.milestone).toBe(true)
    const at15 = touchStreak({ current: 15, longest: 15, lastActive: back(1), activity: {} }, today())
    expect(at15.milestone).toBe(false)
  })

  it('writes YYYY-MM-DD activity keys, not Date objects', () => {
    const { streak } = touchStreak({ activity: {} }, today())
    const key = Object.keys(streak.activity)[0]
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('recomputeStreak', () => {
  it('keeps the streak alive on the day after activity', () => {
    expect(recomputeStreak({ current: 4, longest: 4, lastActive: back(1) }).current).toBe(4)
  })
  it('keeps it alive on the same day', () => {
    expect(recomputeStreak({ current: 4, longest: 4, lastActive: today() }).current).toBe(4)
  })
  it('zeroes it after two days of silence but keeps the record', () => {
    const r = recomputeStreak({ current: 4, longest: 11, lastActive: back(3) })
    expect(r.current).toBe(0)
    expect(r.longest).toBe(11)
  })
})

describe('quizCompletion — the permanent dead-end bug', () => {
  it('a FAILED first attempt does not complete the module', () => {
    const r = quizCompletion({ score: 5, total: 10, previouslyCompleted: false })
    expect(r.pct).toBe(50)
    expect(r.passes).toBe(false)
    expect(r.awardsTopicCompletion).toBe(false)
  })

  it('a LATER attempt can still complete it — this is the bug that locked a user out forever', () => {
    const r = quizCompletion({ score: 9, total: 10, previouslyCompleted: false })
    expect(r.passes).toBe(true)
    expect(r.awardsTopicCompletion).toBe(true)
  })

  it('the topic XP is awarded only once', () => {
    const r = quizCompletion({ score: 10, total: 10, previouslyCompleted: true })
    expect(r.passes).toBe(true)
    expect(r.awardsTopicCompletion).toBe(false)
  })
})

describe('quizAnswerXp', () => {
  it('pays per correct answer on the first attempt', () => {
    expect(quizAnswerXp({ score: 8, alreadyTaken: false })).toBe(200)
  })
  it('pays nothing on a retake, so a quiz cannot be farmed', () => {
    expect(quizAnswerXp({ score: 10, alreadyTaken: true })).toBe(0)
  })
})

describe('sixtySecondXp — anti-farm cap', () => {
  it('pays while under the daily cap', () => {
    expect(sixtySecondXp({ clearedToday: 0 })).toBe(100)
    expect(sixtySecondXp({ clearedToday: 2 })).toBe(100)
  })
  it('pays nothing beyond the cap', () => {
    expect(sixtySecondXp({ clearedToday: 3 })).toBe(0)
    expect(sixtySecondXp({ clearedToday: 40 })).toBe(0)
  })
})

describe('levelForXp', () => {
  it('maps XP to the right level band', () => {
    expect(levelForXp(0).level).toBe(1)
    expect(levelForXp(399).level).toBe(1)
    expect(levelForXp(400).level).toBe(2)
    expect(levelForXp(1500).level).toBe(4)
    expect(levelForXp(1999).level).toBe(4)
    expect(levelForXp(2000).level).toBe(5)
  })

  it('reports progress within the band', () => {
    const l = levelForXp(1750) // level 4 spans 1500–2000
    expect(l.pct).toBe(50)
    expect(l.toNext).toBe(250)
  })

  it('caps cleanly at the maximum level', () => {
    const max = levelForXp(999999)
    expect(max.isMax).toBe(true)
    expect(max.level).toBe(LEVELS.length)
  })

  it('handles junk input without producing NaN', () => {
    expect(levelForXp(-50).level).toBe(1)
    expect(levelForXp(undefined).pct).toBeGreaterThanOrEqual(0)
  })
})

describe('level thresholds are strictly increasing', () => {
  it('no level can be skipped', () => {
    for (let i = 1; i < LEVELS.length; i += 1) {
      expect(LEVELS[i].min).toBeGreaterThan(LEVELS[i - 1].min)
    }
  })
})

describe('unlocksForLevel no longer contradicts the journey', () => {
  it('never claims a module opens at a level', () => {
    for (let lvl = 1; lvl <= LEVELS.length; lvl += 1) {
      for (const line of unlocksForLevel(lvl, { nextModuleName: 'Road Laws' })) {
        expect(line).not.toMatch(/module opens/i)
      }
    }
  })
})

describe('badge predicates', () => {
  const legend = BADGES.find((b) => b.id === 'legal-legend')
  it('legal-legend keys off TOTAL_MODULES, not a hardcoded 8', () => {
    expect(legend.test({ modulesDone: new Array(7).fill('x') })).toBe(false)
    expect(legend.test({ modulesDone: new Array(TOTAL_MODULES).fill('x') })).toBe(true)
  })

  it('no badge shares a name with a level title', () => {
    const levelNames = new Set(LEVELS.map((l) => l.name))
    for (const b of BADGES) expect(levelNames.has(b.name)).toBe(false)
  })

  it('every badge has a sigil id', () => {
    for (const b of BADGES) expect(typeof b.sigil).toBe('string')
  })
})
