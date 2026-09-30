/**
 * LawLink global store.
 *
 * Owns the entire user state, persists it through the storage driver and
 * derives every progression side-effect (levels, badges, streaks) so pages
 * never compute progression themselves.
 *
 * Contract consumed by all pages:
 *   const { user, progress, level, streak, badges, actions, effects } = useStore()
 */
import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { storeGet, storeSet, storeSetLocalSync, storeClearAll, backendLabel, isCloud } from './storage.js'
import { BADGES, LEVELS, XP_RULES, levelForXp, moduleXpTotal } from './gamification.js'
import { getModuleById, nextModule } from '../data/modules.js'
import { todayKey, addDays, dayKeyList } from './dates.js'
import {
  touchStreak as touchStreakPure,
  recomputeStreak as recomputeStreakPure,
  quizCompletion,
  quizAnswerXp,
  sixtySecondXp,
  unlocksForLevel,
} from './progression.js'

/** Ledger and history are capped for storage sanity; the UI labels this honestly. */
export const LEDGER_MAX = 40
export const QUIZ_HISTORY_MAX = 30
// Monotonic, so two effects created in one tick can never share an id.
let idSeq = 0
const nextId = (prefix) => `${prefix}-${(idSeq += 1)}-${Math.random().toString(36).slice(2, 6)}`

const StateCtx = createContext(null)
const DispatchCtx = createContext(null)

export const MODULE_IDS = [
  'cybercrime',
  'consumer',
  'road',
  'student',
  'workplace',
  'privacy',
  'safety',
  'fundamental',
]

/** Fresh profile — a brand new signup starts here. */
function newProfile(name = 'Learner') {
  return {
    name,
    college: '',
    email: '',
    joinedAt: new Date().toISOString(),
    isDemo: false,
  }
}

function newProgress() {
  return {
    xp: 0,
    modules: {}, // id -> { scenariosDone:[], lessonsRead:[], quizDone, quizBest, quizTaken, completed, correct }
    badges: [],
    streak: { current: 0, longest: 0, lastActive: null, activity: {} },
    daily: { lastDone: null, totalDone: 0 },
    sixtySecond: { cleared: 0, best: 0, lastCleared: null, clearedToday: 0 },
    quizHistory: [],
    // Lifetime quiz totals (quizHistory is capped, so it cannot give a lifetime figure).
    quizTotals: { answered: 0, correct: 0, attempts: 0 },
    ledger: [], // { id, at, amount, reason, moduleId }
  }
}

/** Demo account for hackathon presentations: realistic, mid-journey, one action from a level-up. */
export function demoState() {
  const t = todayKey()
  const activity = {}
  // Keys MUST be 'YYYY-MM-DD' (dayKeyList), not Date objects. Using a Date as an
  // object key stringified it to "Tue Sep 29 2026 …", so the demo streak calendar
  // never lit up.
  for (let i = 0; i < 6; i += 1) activity[dayKeyList(addDays(new Date(), -i))] = true
  // Earlier 9-day run (days 7-15 back) so `longest: 9` is backed by real activity.
  for (let back = 7; back <= 15; back += 1) activity[dayKeyList(addDays(new Date(), -back))] = true

  return {
    profile: {
      name: 'Chaitanya',
      college: 'VIT Chennai',
      email: 'demo@lawlink.app',
      joinedAt: addDays(new Date(), -21).toISOString(),
      isDemo: true,
    },
    progress: {
      xp: 1850,
      modules: {
        cybercrime: {
          scenariosDone: ['sc-cy-1', 'sc-cy-2', 'sc-cy-3', 'sc-cy-4', 'sc-cy-5'],
          lessonsRead: ['ls-cy-1', 'ls-cy-2'],
          quizDone: true,
          quizBest: 7,
          quizTaken: 1,
          correct: 7,
          completed: true,
        },
        consumer: {
          scenariosDone: ['sc-co-1', 'sc-co-2', 'sc-co-3'],
          lessonsRead: ['ls-co-1'],
          quizDone: true,
          quizBest: 6,
          quizTaken: 1,
          correct: 6,
          completed: false,
        },
        road: {
          scenariosDone: ['sc-rd-1', 'sc-rd-2'],
          lessonsRead: ['ls-rd-1'],
          quizDone: false,
          quizBest: 0,
          quizTaken: 0,
          correct: 0,
          completed: false,
        },
        student: {
          scenariosDone: ['sc-st-1'],
          lessonsRead: [],
          quizDone: false,
          quizBest: 0,
          quizTaken: 0,
          correct: 0,
          completed: false,
        },
      },
      badges: [],
      streak: { current: 6, longest: 9, lastActive: t, activity },
      daily: { lastDone: dayKeyList(addDays(new Date(), -1)), totalDone: 4 },
      sixtySecond: { cleared: 1, best: 1, lastCleared: dayKeyList(addDays(new Date(), -2)), clearedToday: 0 },
      quizHistory: [
        { moduleId: 'cybercrime', score: 7, total: 8, at: new Date(Date.now() - 3 * 864e5).toISOString() },
        { moduleId: 'consumer', score: 6, total: 8, at: new Date(Date.now() - 1 * 864e5).toISOString() },
      ],
      quizTotals: { answered: 16, correct: 13, attempts: 2 },
      ledger: [
        { id: 'l1', at: new Date(Date.now() - 1 * 864e5).toISOString(), amount: 150, reason: 'Quiz answers — Consumer Rights', moduleId: 'consumer' },
        { id: 'l2', at: new Date(Date.now() - 2 * 864e5).toISOString(), amount: 100, reason: '60-Second Rights Challenge', moduleId: null },
        { id: 'l3', at: new Date(Date.now() - 3 * 864e5).toISOString(), amount: 150, reason: 'Module completed — Cybercrime & Online Safety', moduleId: 'cybercrime' },
        { id: 'l4', at: new Date(Date.now() - 5 * 864e5).toISOString(), amount: 200, reason: '7-day streak bonus', moduleId: null },
      ],
    },
  }
}

const emptyState = () => ({ profile: null, progress: newProgress() })

/**
 * Write derived badge ownership into the persisted record. Badges are recomputed
 * from activity on every render, but `impact.badges` reads the stored list — so it
 * has to be materialised on load, otherwise a freshly restored account reports 0.
 */
function syncBadges(state) {
  if (!state?.profile) return state
  const unlocked = deriveBadges(state.progress)
    .filter((b) => b.unlocked)
    .map((b) => b.id)
  return {
    ...state,
    progress: {
      ...state.progress,
      badges: unlocked,
      streak: recomputeStreak(state.progress.streak), // never show a stale streak on load
    },
  }
}

// ------------------------------------------------------------------ selectors
function moduleStats(progress, id) {
  const m = getModuleById(id)
  const rec = progress.modules[id] || {}
  const scenarioTotal = m?.scenarios?.length || 0
  const lessonTotal = m?.lessons?.length || 0
  const quizTotal = m?.quiz?.length || 0
  const scenariosDone = rec.scenariosDone?.length || 0
  const lessonsRead = rec.lessonsRead?.length || 0
  const units = lessonTotal + scenarioTotal + quizTotal
  const done = lessonsRead + scenariosDone + (rec.quizDone ? quizTotal : 0)
  const computed = units ? Math.round((done / units) * 100) : 0
  // Activities done but quiz failed must not read 100.
  const pct = rec.completed ? 100 : Math.min(99, computed)
  return {
    id,
    scenariosDone,
    scenarioTotal,
    lessonsRead,
    lessonTotal,
    // Raw id lists, kept alongside the counts so pages can test membership
    // (a derived count cannot answer "have I already cleared this one?").
    scenarioIds: rec.scenariosDone || [],
    lessonIds: rec.lessonsRead || [],
    quizTotal,
    quizBest: rec.quizBest || 0,
    quizTaken: rec.quizTaken || 0,
    correct: rec.correct || 0,
    quizDone: Boolean(rec.quizDone),
    completed: Boolean(rec.completed),
    pct,
    xpTotal: moduleXpTotal(m),
  }
}

/** Progress for every module, keyed by id — the shape all list views render. */
export function allModuleStats(progress) {
  const out = {}
  for (const id of MODULE_IDS) out[id] = moduleStats(progress, id)
  return out
}

function deriveBadges(progress) {
  const stats = allModuleStats(progress)
  const modulesDone = MODULE_IDS.filter((id) => stats[id].completed)
  const lessonsCompleted = Object.values(stats).reduce((a, s) => a + s.lessonsRead, 0)
  const bestQuizPct = Math.max(
    0,
    ...Object.values(stats).map((s) => (s.quizTotal ? Math.round((s.quizBest / s.quizTotal) * 100) : 0)),
  )
  const state = {
    lessonsCompleted,
    bestQuizPct,
    longestStreak: progress.streak.longest || 0,
    modulesDone,
    sixtySecondCleared: progress.sixtySecond.cleared || 0,
    perfectQuiz: Object.values(stats).some((s) => s.quizTotal > 0 && s.quizBest === s.quizTotal),
  }
  return BADGES.map((b) => ({ ...b, unlocked: progress.badges.includes(b.id) || b.test(state) }))
}

function recomputeStreak(streak) {
  return recomputeStreakPure(streak)
}

/** The module that will open next on the journey — used for honest level-up copy. */
function nextModuleNameFor(state) {
  const stats = state?.progress?.modules || {}
  const currentIdx = MODULE_IDS.findIndex((id) => {
    const rec = stats[id] || {}
    const m = getModuleById(id)
    const units = (m?.lessons?.length || 0) + (m?.scenarios?.length || 0) + (m?.quiz?.length || 0)
    const done =
      (rec.lessonsRead?.length || 0) +
      (rec.scenariosDone?.length || 0) +
      (rec.quizDone ? m?.quiz?.length || 0 : 0)
    return units > 0 && done > 0 && done < units && !rec.completed
  })
  if (currentIdx === -1) return null
  const partial = getModuleById(MODULE_IDS[currentIdx])
  const nxt = nextModule(partial.id)
  return nxt ? nxt.name : null
}

// -------------------------------------------------------------- derived totals
function impactOf(progress) {
  const stats = allModuleStats(progress)
  const vals = Object.values(stats)
  const lessonsCompleted = vals.reduce((a, s) => a + s.lessonsRead, 0)
  const scenariosDone = vals.reduce((a, s) => a + s.scenariosDone, 0)
  const modulesDone = MODULE_IDS.filter((id) => stats[id].completed).length
  const t = progress.quizTotals || { answered: 0, correct: 0, attempts: 0 }
  const answered = t.answered || 0
  const correct = t.correct || 0
  const quizAccuracy = answered ? Math.round((correct / answered) * 100) : 0
  return {
    lessonsCompleted,
    scenariosDone,
    modulesDone,
    modulesTotal: MODULE_IDS.length,
    quizAccuracy, // lifetime: correct / answered across every attempt
    quizAnswered: answered,
    quizCorrect: correct,
    quizzesTaken: t.attempts || progress.quizHistory.length,
    badges: progress.badges.length,
    streak: progress.streak.current || 0,
    xp: progress.xp,
    journeyPct: Math.round(
      MODULE_IDS.reduce((a, id) => a + stats[id].pct, 0) / MODULE_IDS.length,
    ),
  }
}

// -------------------------------------------------------------------- provider
/** Merge a persisted record over defaults, backfilling fields added since it was saved. */
function hydrateState(raw) {
  const progress = { ...newProgress(), ...raw.progress }
  if (!progress.quizTotals) {
    const h = progress.quizHistory || []
    progress.quizTotals = {
      answered: h.reduce((a, q) => a + q.total, 0),
      correct: h.reduce((a, q) => a + q.score, 0),
      attempts: h.length,
    }
  }
  return syncBadges({ profile: raw.profile, progress })
}

export function StoreProvider({ children }) {
  const [state, setState] = useState(emptyState)
  const [ready, setReady] = useState(false)
  const [effects, setEffects] = useState([])
  const [toasts, setToasts] = useState([])
  const saveTimer = useRef(null)
  // Mirrors the latest committed state so actions read fresh data and compute
  // their result purely, instead of doing side effects inside setState updaters.
  const stateRef = useRef(state)
  const readyRef = useRef(false)

  /** The only place state changes: ref first, then React state and effects, once. */
  const commit = useCallback((next, fx = []) => {
    stateRef.current = next
    setState(next)
    if (fx.length) setEffects((e) => [...e, ...fx])
  }, [])

  // hydrate
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const raw = await storeGet('app')
        if (alive && raw && raw.profile && !stateRef.current.profile) commit(hydrateState(raw))
      } catch (err) {
        console.warn('[lawlink] hydrate failed', err)
      } finally {
        if (alive) {
          readyRef.current = true
          setReady(true)
        }
      }
    })()
    return () => {
      alive = false
    }
  }, [commit])

  // debounced persist
  useEffect(() => {
    if (!ready) return undefined
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      storeSet('app', stateRef.current).catch((e) => console.warn('[lawlink] save failed', e))
    }, 220)
    return () => clearTimeout(saveTimer.current)
  }, [state, ready])

  // synchronous flush so a change made <220ms before the tab closes is never lost
  useEffect(() => {
    const flush = () => {
      if (readyRef.current) storeSetLocalSync('app', stateRef.current)
    }
    const onVis = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  // streak decay when the app stays open across midnight
  useEffect(() => {
    if (!ready) return undefined
    const tick = () => {
      const s = stateRef.current
      if (!s.profile) return
      const streak = recomputeStreak(s.progress.streak)
      if (streak === s.progress.streak) return // unchanged: no state change, no write
      commit({ profile: s.profile, progress: { ...s.progress, streak } })
    }
    const id = setInterval(tick, 60_000)
    window.addEventListener('focus', tick)
    return () => {
      clearInterval(id)
      window.removeEventListener('focus', tick)
    }
  }, [ready, commit])

  const pushToast = useCallback((toast) => {
    const id = nextId('toast')
    setToasts((t) => [...t, { id, ...toast }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), toast.duration || 3200)
  }, [])

  const dismissEffect = useCallback((id) => setEffects((e) => e.filter((x) => x.id !== id)), [])

  // ----------------------------------------------------------------- actions
  const actions = useMemo(() => {
    const touchStreak = (progress) => touchStreakPure(progress.streak)

    /**
     * The single XP entry point. Every reward in the app goes through here so
     * level-ups, badges and streaks are impossible to forget. Pure: returns the
     * next state and the effects to show; the caller commits them.
     *
     * The streak bonus is applied to the RETURNED state, not just announced.
     * A 0-amount award writes no ledger row (it only records the activity).
     */
    const award = (state, { amount, reason, moduleId = null, silent = false, refId = null }) => {
      const before = levelForXp(state.progress.xp)
      const { streak, milestone } = touchStreak(state.progress)
      const ledger =
        amount === 0
          ? state.progress.ledger
          : [
              { id: nextId('l'), at: new Date().toISOString(), amount, reason, moduleId, refId },
              ...state.progress.ledger,
            ].slice(0, LEDGER_MAX)

      let next = {
        profile: state.profile,
        progress: { ...state.progress, xp: state.progress.xp + amount, streak, ledger },
      }
      const newEffects = []
      if (!silent && amount > 0) {
        newEffects.push({ id: nextId('xp'), kind: 'xp', amount, reason })
      }

      const after = levelForXp(next.progress.xp)
      if (after.level > before.level) {
        newEffects.push({
          id: nextId('lvl'),
          kind: 'levelup',
          from: before,
          to: after,
          unlocks: unlocksForLevel(after.level, { nextModuleName: nextModuleNameFor(state) }),
        })
      }

      if (milestone) {
        const bonus = XP_RULES.streakMilestone
        const mid = levelForXp(next.progress.xp)
        next = {
          profile: next.profile,
          progress: {
            ...next.progress,
            xp: next.progress.xp + bonus,
            ledger: [
              { id: nextId('l'), at: new Date().toISOString(), amount: bonus, reason: `${streak.current}-day streak bonus`, moduleId: null },
              ...next.progress.ledger,
            ].slice(0, LEDGER_MAX),
          },
        }
        newEffects.push({ id: nextId('st'), kind: 'streak', amount: bonus, days: streak.current })
        const post = levelForXp(next.progress.xp)
        if (post.level > mid.level) {
          newEffects.push({
            id: nextId('lvl'),
            kind: 'levelup',
            from: mid,
            to: post,
            unlocks: unlocksForLevel(post.level, { nextModuleName: nextModuleNameFor(state) }),
          })
        }
      }

      return { next, newEffects }
    }

    /** Derive badges, add their effects, then commit exactly once. */
    const finish = (next, fx) => {
      const derived = deriveBadges(next.progress)
      const owned = new Set(next.progress.badges)
      const fresh = derived.filter((b) => b.unlocked && !owned.has(b.id))
      let out = next
      if (fresh.length) {
        out = {
          ...next,
          progress: { ...next.progress, badges: [...next.progress.badges, ...fresh.map((b) => b.id)] },
        }
        fresh.forEach((b) => fx.push({ id: nextId(`bd-${b.id}`), kind: 'badge', badge: b }))
      }
      commit(out, fx)
    }

    const setModule = (state, moduleId, patch) => ({
      profile: state.profile,
      progress: {
        ...state.progress,
        modules: {
          ...state.progress.modules,
          [moduleId]: { ...(state.progress.modules[moduleId] || {}), ...patch },
        },
      },
    })

    return {
      async login(name, extra = {}) {
        commit({ profile: { ...newProfile(name || 'Learner'), ...extra }, progress: newProgress() })
        pushToast({ title: 'Welcome to LawLink', body: 'Your legal journey starts now.', tone: 'electric' })
      },

      async logout() {
        commit(emptyState())
        await storeClearAll()
      },

      async loadDemo() {
        commit(syncBadges(demoState()))
        pushToast({ title: 'Demo mode loaded', body: 'Chaitanya · Level 4 · 1,850 XP · 6 day streak', tone: 'xp' })
      },

      async resetProgress() {
        const s = stateRef.current
        commit({ profile: s.profile, progress: newProgress() })
        pushToast({ title: 'Progress reset', body: 'Fresh journey. All XP and badges cleared.', tone: 'danger' })
      },

      async updateProfile(patch) {
        const s = stateRef.current
        commit({ ...s, profile: { ...s.profile, ...patch } })
      },

      /** Read a short lesson card. */
      readLesson(moduleId, lessonId) {
        const s = stateRef.current
        if (!s.profile) return
        const rec = s.progress.modules[moduleId] || {}
        if (rec.lessonsRead?.includes(lessonId)) return
        const r = award(s, { amount: XP_RULES.lessonRead, reason: 'Lesson read', moduleId, refId: lessonId })
        r.newEffects.push({ id: nextId('ls'), kind: 'hint', amount: XP_RULES.lessonRead, reason: 'Lesson read' })
        finish(setModule(r.next, moduleId, { lessonsRead: [...(rec.lessonsRead || []), lessonId] }), r.newEffects)
      },

      /** Finish a scenario (right or wrong — you always learn). */
      completeScenario(moduleId, scenarioId, correct) {
        const s = stateRef.current
        if (!s.profile) return
        const rec = s.progress.modules[moduleId] || {}
        if (rec.scenariosDone?.includes(scenarioId)) return
        const r = award(s, {
          amount: XP_RULES.scenario,
          reason: correct ? 'Scenario cleared' : 'Scenario completed',
          moduleId,
          refId: scenarioId,
        })
        finish(setModule(r.next, moduleId, { scenariosDone: [...(rec.scenariosDone || []), scenarioId] }), r.newEffects)
      },

      /**
       * Submit a full quiz. Awards XP per correct answer (first attempt only) plus
       * topic completion when the module closes.
       * Returns { wasDone, prevBest, wasCompleted, xpGained, newlyCompleted } computed
       * from the state as it was BEFORE this attempt, or null when signed out.
       */
      completeQuiz(moduleId, correctCount, total) {
        const s = stateRef.current
        if (!s.profile) return null
        const rec = s.progress.modules[moduleId] || {}
        const wasDone = Boolean(rec.quizDone)
        const prevBest = rec.quizBest || 0
        const wasCompleted = Boolean(rec.completed)
        const { passes, awardsTopicCompletion } = quizCompletion({
          score: correctCount,
          total,
          previouslyCompleted: wasCompleted,
        })
        // Per-answer XP is once per module; a quiz cannot be farmed by retaking.
        const amount = quizAnswerXp({ score: correctCount, alreadyTaken: wasDone })
        const totals = s.progress.quizTotals || { answered: 0, correct: 0, attempts: 0 }

        let next = setModule(
          {
            profile: s.profile,
            progress: {
              ...s.progress,
              quizHistory: [
                { moduleId, score: correctCount, total, at: new Date().toISOString() },
                ...s.progress.quizHistory,
              ].slice(0, QUIZ_HISTORY_MAX),
              quizTotals: {
                answered: (totals.answered || 0) + total,
                correct: (totals.correct || 0) + correctCount,
                attempts: (totals.attempts || 0) + 1,
              },
            },
          },
          moduleId,
          {
            quizDone: true,
            quizTaken: (rec.quizTaken || 0) + 1,
            quizBest: Math.max(prevBest, correctCount),
            correct: Math.max(rec.correct || 0, correctCount),
          },
        )

        const fx = []
        if (amount > 0) {
          const r = award(next, { amount, reason: `${correctCount}/${total} correct — quiz`, moduleId })
          next = r.next
          fx.push(...r.newEffects)
        }
        // A module completes on ANY attempt that reaches 80%.
        if (awardsTopicCompletion) {
          const r2 = award(next, { amount: XP_RULES.topicComplete, reason: 'Module completed', moduleId })
          next = r2.next
          fx.push(...r2.newEffects)
        }
        if (passes) next = setModule(next, moduleId, { completed: true })
        finish(next, fx)
        return {
          wasDone,
          prevBest,
          wasCompleted,
          xpGained: amount + (awardsTopicCompletion ? XP_RULES.topicComplete : 0),
          newlyCompleted: awardsTopicCompletion,
        }
      },

      /**
       * Daily challenge. `correct=true` pays once per day. `correct=false` only
       * records the attempt (daily.lastAttempt): no XP, not a win, retry allowed.
       */
      completeDaily(correct = true) {
        const s = stateRef.current
        if (!s.profile) return false
        const t = todayKey()
        if (s.progress.daily.lastDone === t) return false
        if (!correct) {
          if (s.progress.daily.lastAttempt !== t) {
            commit({
              profile: s.profile,
              progress: { ...s.progress, daily: { ...s.progress.daily, lastAttempt: t } },
            })
          }
          return false
        }
        const r = award(s, { amount: XP_RULES.dailyChallenge, reason: 'Daily challenge cleared' })
        finish(
          {
            profile: r.next.profile,
            progress: {
              ...r.next.progress,
              daily: { ...s.progress.daily, lastDone: t, lastAttempt: t, totalDone: (s.progress.daily.totalDone || 0) + 1 },
            },
          },
          r.newEffects,
        )
        return true
      },

      /** 60-second run. Only a scoring run (score > 0) pays XP or counts as a clear. */
      clearSixtySecond(score) {
        const s = stateRef.current
        if (!s.profile || !(score > 0)) return false
        const prev = s.progress.sixtySecond || {}
        const clearedToday = prev.lastCleared === todayKey() ? prev.clearedToday || 0 : 0
        // Capped per day: the 60-second run is a skill check, not a faucet.
        const amount = sixtySecondXp({ clearedToday })
        const r = award(s, {
          amount,
          reason: amount > 0 ? '60-Second Rights Challenge' : '60-second run (daily XP cap reached)',
          silent: amount === 0,
          refId: '60s',
        })
        finish(
          {
            profile: r.next.profile,
            progress: {
              ...r.next.progress,
              sixtySecond: {
                cleared: (prev.cleared || 0) + 1,
                best: Math.max(prev.best || 0, score),
                lastCleared: todayKey(),
                clearedToday: clearedToday + 1,
              },
            },
          },
          r.newEffects,
        )
        return true
      },

      pushToast,
    }
  }, [pushToast, commit])

  // module unlock: a module opens once the previous one on the journey is complete
  const unlocked = useMemo(() => {
    if (!state.profile) return {}
    const stats = allModuleStats(state.progress)
    const out = {}
    let open = true
    for (const id of MODULE_IDS) {
      out[id] = open
      if (!stats[id].completed) open = false
    }
    return out
  }, [state.profile, state.progress])

  const derived = useMemo(() => {
    if (!state.profile) return null
    const badges = deriveBadges(state.progress)
    const level = levelForXp(state.progress.xp)
    return {
      badges,
      ownedBadges: badges.filter((b) => b.unlocked),
      level,
      impact: impactOf(state.progress),
      stats: allModuleStats(state.progress),
      week: weekGrid(state.progress),
    }
  }, [state.profile, state.progress])

  const stateValue = useMemo(
    () => ({
      ...state,
      streak: state.progress.streak,
      daily: state.progress.daily,
      sixtySecond: state.progress.sixtySecond,
      ledger: state.progress.ledger,
      quizHistory: state.progress.quizHistory,
      ready,
      backend: backendLabel(),
      cloud: isCloud(),
      level: derived?.level || levelForXp(0),
      badges: derived?.badges || [],
      ownedBadges: derived?.ownedBadges || [],
      impact: derived?.impact || impactOf(newProgress()),
      stats: derived?.stats || {},
      week: derived?.week || [],
      unlocked,
      nextModuleId: MODULE_IDS.find((id) => unlocked[id] && !derived?.stats?.[id]?.completed) || null,
      firstLockedId: MODULE_IDS.find((id) => !unlocked[id]) || null,
      nextBadge: (derived?.badges || []).find((b) => !b.unlocked) || null,
    }),
    [state, ready, derived, unlocked],
  )

  return (
    <StateCtx.Provider value={stateValue}>
      <DispatchCtx.Provider value={{ actions, effects, setEffects, toasts, dismissEffect, pushToast }}>
        {children}
      </DispatchCtx.Provider>
    </StateCtx.Provider>
  )
}

export function useStore() {
  const s = useContext(StateCtx)
  if (!s) throw new Error('useStore must be used inside <StoreProvider>')
  return s
}

export function useActions() {
  const d = useContext(DispatchCtx)
  if (!d) throw new Error('useActions must be used inside <StoreProvider>')
  return d
}

// ------------------------------------------------------------------ utilities
const WEEK_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

/** Monday-first week grid for the streak calendar. */
export function weekGrid(progress) {
  const activity = progress?.streak?.activity || {}
  const now = new Date()
  const dow = (now.getDay() + 6) % 7 // 0 = Monday
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(now, i - dow)
    const key = dayKeyList(d)
    return { label: WEEK_LABELS[i], date: key, day: d.getDate(), done: Boolean(activity[key]), future: i > dow }
  })
}

/**
 * Level-up copy now lives in `lib/progression.js` (`unlocksForLevel`).
 * It used to live here and claimed "Road Laws module opens" at level 4 — which
 * contradicted the journey, where modules unlock by completing the previous one.
 */
export { LEVELS, XP_RULES, levelForXp }
