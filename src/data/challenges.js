/**
 * Daily Challenge + 60-Second Rights Challenge.
 * Both are built from the same verified scenario pool, so a challenge can never
 * show content that the lesson flow does not also show.
 */
import { allScenarios } from './modules.js'
import { todayKey } from '../lib/dates.js'

/** Deterministic daily pick — stable for the whole day across reloads. */
export function dailyChallenge(date = new Date()) {
  const key = todayKey()
  const seed = date.getFullYear() * 372 + (date.getMonth() + 1) * 31 + date.getDate()
  return allScenarios[seed % allScenarios.length]
}

export const dailyTitle = (sc) => {
  const byModule = {
    cybercrime: 'Can you spot the scam?',
    consumer: 'The refund that never came',
    road: 'Is this legal on the road?',
    student: 'Your rights on campus',
    workplace: 'Your first job, your rights',
    privacy: 'Is this a privacy breach?',
    safety: 'What would you do first?',
    fundamental: 'Which right is at play?',
  }
  return byModule[sc.moduleId] || 'Today’s legal challenge'
}

/** The module name only — there is no emoji field any more; the sigil is the mark. */
export const dailySubtitle = (sc) => sc.moduleName || ''

/**
 * 60-Second Rights Challenge bank.
 * Harder-picked subset: any scenario works, we simply keep them fast.
 */
export const sixtySecondBank = allScenarios

/** Shuffled pick that is stable for a session. */
export function pickSixtySecond(seed = Math.random()) {
  const idx = Math.floor(Math.abs(seed) * sixtySecondBank.length) % sixtySecondBank.length
  return sixtySecondBank[idx]
}

export const sixtyNext = (seed) => (seed + 1) % sixtySecondBank.length
