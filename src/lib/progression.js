/**
 * Pure progression logic — streak, unlocks, XP awards.
 *
 * Extracted from the store so it can be unit tested without React. The bugs this
 * module exists to prevent:
 *   - the 7-day streak bonus was displayed but never actually added to XP
 *   - the milestone tested `longest % 7` (all-time), so it re-fired forever
 *   - a returning user got `current + 1` instead of a reset to 1
 *   - a failed first quiz permanently blocked a module from completing
 */
import { dayKeyList, todayKey } from './dates.js'

/** 'YYYY-MM-DD' for `n` days before `from`. */
const keyOffset = (from, n) => {
  const d = new Date(`${from}T00:00:00`)
  d.setDate(d.getDate() + n)
  return dayKeyList(d)
}

/**
 * Fold an activity event into a streak.
 *
 * Rules, all of which the previous version got wrong:
 *   - acting twice in a day does not advance the streak
 *   - acting on a non-consecutive day RESETS to 1, it does not increment
 *   - the 7-day bonus is keyed on the CURRENT streak crossing a multiple of 7,
 *     so it can never re-fire from a stale all-time record
 */
export function touchStreak(streak = {}, today = todayKey()) {
  const activity = { ...(streak.activity || {}) }
  const last = streak.lastActive || null
  const prevCurrent = streak.current || 0

  let current
  if (last === today) {
    current = prevCurrent // already counted today
  } else {
    current = last === keyOffset(today, -1) ? prevCurrent + 1 : 1 // consecutive, else reset
    activity[today] = true
  }

  const longest = Math.max(streak.longest || 0, current)
  // Fires only on the day the current streak crosses 7/14/21…
  const milestone = current % 7 === 0 && current > prevCurrent

  return { streak: { current, longest, lastActive: today, activity }, milestone }
}

/** Decay a streak for display without recording an activity event. */
export function recomputeStreak(streak = {}, today = todayKey()) {
  if (!streak.lastActive) return { ...streak, current: 0, longest: Math.max(streak.longest || 0, 0) }
  if (streak.lastActive === today || streak.lastActive === keyOffset(today, -1)) return streak
  return { ...streak, current: 0, longest: Math.max(streak.longest || 0, 0) }
}

/**
 * A module is complete at >=80% on any attempt, and only the attempt that first
 * crosses the line awards the topic XP. A failed first attempt must never be able
 * to lock the module out forever.
 */
export function quizCompletion({ score, total, previouslyCompleted }) {
  const pct = total ? Math.round((score / total) * 100) : 0
  const passes = pct >= 80
  return { pct, passes, awardsTopicCompletion: passes && !previouslyCompleted }
}

/** Per-answer XP is granted once per module, so a quiz cannot be farmed by retaking. */
export function quizAnswerXp({ score, alreadyTaken }) {
  return alreadyTaken ? 0 : score * 25
}

/** The 60-second run is a skill check, not a faucet: cap the daily XP it can pay out. */
export const SIXTY_SECOND_DAILY_CAP = 3
export function sixtySecondXp({ clearedToday, dailyCap = SIXTY_SECOND_DAILY_CAP }) {
  return clearedToday < dailyCap ? 100 : 0
}

/**
 * What a level actually unlocks. This used to claim modules open at certain levels,
 * which contradicted the journey: modules unlock by completing the previous one,
 * not by level. Now the copy only ever describes level-scoped things.
 */
export function unlocksForLevel(level, { nextModuleName = null } = {}) {
  const base = {
    2: ['Daily Challenge difficulty step unlocked', 'Streak bonus tracking begins'],
    3: ['Quick Learner badge track unlocked'],
    4: ['Achievements track unlocked'],
    5: ['🛡 Workplace Rights badge unlocked', 'Justice Navigator title track'],
    6: ['Law Guardian title unlocked'],
    7: ['Justice Navigator title unlocked'],
    8: ['🏆 Legal Master title unlocked', 'Every badge in the collection unlocked'],
  }
  const list = [...(base[level] || [])]
  if (nextModuleName) list.push(`${nextModuleName} is your next mission`)
  return list
}
