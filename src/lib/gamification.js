/**
 * LawLink gamification engine.
 * Single source of truth for levels, XP awards, badges and unlocks.
 * Every XP grant flows through `awardFor()` so numbers stay consistent.
 */

export const XP_RULES = {
  lessonRead: 20,
  scenario: 50,
  quizCorrect: 25,
  dailyChallenge: 100,
  topicComplete: 150,
  streakMilestone: 200,
  sixtySecond: 100,
}

export const LEVELS = [
  { level: 1, name: 'Curious Citizen', min: 0, accent: 'electric' },
  { level: 2, name: 'Law Learner', min: 400, accent: 'electric' },
  { level: 3, name: 'Rights Rookie', min: 900, accent: 'violet' },
  { level: 4, name: 'Legal Explorer', min: 1500, accent: 'violet' },
  { level: 5, name: 'Rights Ranger', min: 2000, accent: 'violet' },
  { level: 6, name: 'Law Guardian', min: 2900, accent: 'xp' },
  { level: 7, name: 'Justice Navigator', min: 4000, accent: 'xp' },
  { level: 8, name: 'Legal Master', min: 5400, accent: 'xp' },
]

export const MAX_LEVEL = LEVELS.length

/**
 * Number of journey modules. Declared here so badge predicates never hardcode it —
 * `legal-legend` used `>= 8`, which silently broke the moment a module was added.
 * `lib/store.jsx` asserts this matches MODULE_IDS.length.
 */
export const TOTAL_MODULES = 8

/** Resolve a level record from lifetime XP. */
export function levelForXp(xp = 0) {
  const safe = Math.max(0, Math.floor(xp) || 0)
  let current = LEVELS[0]
  for (const l of LEVELS) if (safe >= l.min) current = l
  const next = LEVELS.find((l) => l.level === current.level + 1) || null
  const span = next ? next.min - current.min : 0
  const into = safe - current.min
  const pct = next ? Math.min(100, Math.round((into / span) * 100)) : 100
  return {
    ...current,
    xp: safe,
    next,
    into,
    span,
    pct,
    toNext: next ? Math.max(0, next.min - safe) : 0,
    isMax: !next,
  }
}

export const levelNumber = (lvl) => String(lvl).padStart(2, '0')

/** Accent colour classes keyed by accent name, used by cards / level-up modal. */
export const ACCENT = {
  electric: {
    text: 'text-electric-300',
    bg: 'bg-electric-500',
    ring: 'ring-electric-500/40',
    glow: 'shadow-glow',
    grad: 'from-electric-500 to-electric-400',
  },
  violet: {
    text: 'text-violet2-300',
    bg: 'bg-violet2-500',
    ring: 'ring-violet2-500/40',
    glow: 'shadow-glow-violet',
    grad: 'from-violet2-600 to-violet2-400',
  },
  xp: {
    text: 'text-xp-300',
    bg: 'bg-xp-400',
    ring: 'ring-xp-400/40',
    glow: 'shadow-glow-xp',
    grad: 'from-xp-500 to-xp-300',
  },
}

/**
 * Badges. `test` is a pure predicate over the user state, so unlocking is
 * always derivable and can be recomputed after any change (no drift).
 */
export const BADGES = [
  {
    id: 'first-step',
    sigil: 'first-step',
    name: 'First Step',
    desc: 'Complete your first lesson.',
    test: (s) => s.lessonsCompleted >= 1,
    hint: 'Finish any lesson to unlock',
  },
  {
    id: 'quick-learner',
    sigil: 'quick-learner',
    name: 'Quick Learner',
    desc: 'Score 90% or higher in a quiz.',
    test: (s) => s.bestQuizPct >= 90,
    hint: 'Score 90%+ in any quiz',
  },
  {
    id: 'streak-master',
    sigil: 'streak-master',
    name: 'Streak Master',
    desc: 'Maintain a 7-day streak.',
    test: (s) => s.longestStreak >= 7,
    hint: 'Learn 7 days in a row',
  },
  {
    id: 'cyber-defender',
    sigil: 'cyber-defender',
    name: 'Cyber Defender',
    desc: 'Complete the Cybercrime & Online Safety module.',
    test: (s) => s.modulesDone.includes('cybercrime'),
    hint: 'Complete Cybercrime & Online Safety',
  },
  {
    id: 'road-warrior',
    sigil: 'road-warrior',
    name: 'Road Warrior',
    desc: 'Complete the Road Laws module.',
    test: (s) => s.modulesDone.includes('road'),
    hint: 'Complete Road Laws',
  },
  {
    id: 'smart-consumer',
    sigil: 'smart-consumer',
    name: 'Smart Consumer',
    desc: 'Complete the Consumer Rights module.',
    test: (s) => s.modulesDone.includes('consumer'),
    hint: 'Complete Consumer Rights',
  },
  {
    id: 'rights-protector',
    sigil: 'rights-protector',
    name: 'Rights Protector',
    desc: "Complete the Women's Safety module.",
    test: (s) => s.modulesDone.includes('safety'),
    hint: "Complete Women's Safety",
  },
  {
    id: 'campus-guardian',
    sigil: 'campus-guardian',
    name: 'Campus Guardian',
    desc: 'Complete the Student Rights module.',
    test: (s) => s.modulesDone.includes('student'),
    hint: 'Complete Student Rights',
  },
  {
    id: 'legal-legend',
    sigil: 'legal-legend',
    name: 'Legal Legend',
    desc: 'Complete all major modules.',
    test: (s) => s.modulesDone.length >= TOTAL_MODULES,
    hint: 'Complete every module',
  },
  {
    id: 'workplace-rights',
    sigil: 'workplace-rights',
    // Was "Rights Ranger", which is also the name of LEVEL 5 — the badge and the
    // level title collided in the UI.
    name: 'Fair Workplace',
    desc: 'Complete the Workplace Rights module.',
    test: (s) => s.modulesDone.includes('workplace'),
    hint: 'Complete Workplace Rights',
  },
  {
    id: 'first-blood',
    sigil: 'first-blood',
    name: 'Quick Thinker',
    desc: 'Clear the 60-Second Rights Challenge.',
    test: (s) => s.sixtySecondCleared >= 1,
    hint: 'Clear a 60-second challenge',
  },
  {
    id: 'perfect-ten',
    sigil: 'perfect-ten',
    name: 'Flawless',
    desc: 'Get a perfect 10/10 on any quiz.',
    test: (s) => s.perfectQuiz,
    hint: 'Score 10/10 in a quiz',
  },
]

export const badgeById = (id) => BADGES.find((b) => b.id === id)

/** XP earned per legal module, derived from its content so numbers never drift. */
export function moduleXpTotal(mod) {
  if (!mod) return 0
  const scenarioXp = (mod.scenarios?.length || 0) * XP_RULES.scenario
  const quizXp = (mod.quiz?.length || 0) * XP_RULES.quizCorrect
  return XP_RULES.topicComplete + scenarioXp + quizXp
}
