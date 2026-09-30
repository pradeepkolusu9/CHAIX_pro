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
import { storeGet, storeSet, storeClearAll, backendLabel, isCloud } from './storage.js'
import { BADGES, LEVELS, XP_RULES, levelForXp, moduleXpTotal, TOTAL_MODULES } from './gamification.js'
import { getModuleById, nextModule, MODULES } from '../data/modules.js'
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
const uid = () => Math.random().toString(36).slice(2)

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
  for (const back of [7, 8, 9]) activity[dayKeyList(addDays(new Date(), -back))] = true

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
          quizBest: 6,
          quizTaken: 1,
          correct: 6,
          completed: true,
        },
        consumer: {
          scenariosDone: ['sc-co-1', 'sc-co-2', 'sc-co-3'],
          lessonsRead: ['ls-co-1'],
          quizDone: false,
          quizBest: 0,
          quizTaken: 0,
          correct: 0,
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
        { moduleId: 'cybercrime', score: 6, total: 8, at: new Date(Date.now() - 3 * 864e5).toISOString() },
        { moduleId: 'consumer', score: 6, total: 10, at: new Date(Date.now() - 1 * 864e5).toISOString() },
      ],
      ledger: [
        { id: 'l1', at: new Date(Date.now() - 1 * 864e5).toISOString(), amount: 125, reason: 'Quiz answers — Consumer Rights', moduleId: 'consumer' },
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
    progress: { ...state.progress, badges: unlocked },
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
  const pct = units ? Math.round((done / units) * 100) : 0
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
  const answered = progress.quizHistory.reduce((a, q) => a + q.total, 0)
  const correct = progress.quizHistory.reduce((a, q) => a + q.score, 0)
  const quizAccuracy = answered ? Math.round((correct / answered) * 100) : 0
  return {
    lessonsCompleted,
    scenariosDone,
    modulesDone,
    modulesTotal: MODULE_IDS.length,
    quizAccuracy,
    quizzesTaken: progress.quizHistory.length,
    badges: progress.badges.length,
    streak: progress.streak.current || 0,
    xp: progress.xp,
    journeyPct: Math.round(
      MODULE_IDS.reduce((a, id) => a + stats[id].pct, 0) / MODULE_IDS.length,
    ),
  }
}

// -------------------------------------------------------------------- provider
export function StoreProvider({ children }) {
  const [state, setState] = useState(emptyState)
  const [ready, setReady] = useState(false)
  const [effects, setEffects] = useState([])
  const [toasts, setToasts] = useState([])
  const saveTimer = useRef(null)

  // hydrate
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const raw = await storeGet('app')
        if (alive && raw && raw.profile) {
          setState(syncBadges({ profile: raw.profile, progress: { ...newProgress(), ...raw.progress } }))
        }
      } catch (err) {
        console.warn('[lawlink] hydrate failed', err)
      } finally {
        if (alive) setReady(true)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  // debounced persist
  useEffect(() => {
    if (!ready) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      storeSet('app', state).catch((e) => console.warn('[lawlink] save failed', e))
    }, 220)
    return () => clearTimeout(saveTimer.current)
  }, [state, ready])

  // streak decay when the app stays open across midnight
  useEffect(() => {
    if (!ready) return undefined
    const tick = () =>
      setState((s) =>
        s.profile
          ? {
              profile: s.profile,
              progress: { ...s.progress, streak: recomputeStreak(s.progress.streak) },
            }
          : s,
      )
    const id = setInterval(tick, 60_000)
    window.addEventListener('focus', tick)
    return () => {
      clearInterval(id)
      window.removeEventListener('focus', tick)
    }
  }, [ready])

  const pushToast = useCallback((toast) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, ...toast }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), toast.duration || 3200)
  }, [])

  const dismissEffect = useCallback((id) => setEffects((e) => e.filter((x) => x.id !== id)), [])

  // ----------------------------------------------------------------- actions
  const actions = useMemo(() => {
    const touchStreak = (progress) => touchStreakPure(progress.streak)

    /**
     * The single XP entry point. Every reward in the app goes through here so
     * level-ups, badges and streaks are impossible to forget.
     *
     * Note the streak bonus is applied to the RETURNED state, not just announced.
     * It used to be pushed into the effect queue while the computed state was
     * discarded, so the "+200 XP" appeared and the XP never landed.
     */
    const award = (state, { amount, reason, moduleId = null, silent = false, refId = null }) => {
      const before = levelForXp(state.progress.xp)
      const { streak, milestone } = touchStreak(state.progress)
      const ledger = [
        { id: uid(), at: new Date().toISOString(), amount, reason, moduleId, refId },
        ...state.progress.ledger,
      ].slice(0, LEDGER_MAX)

      let next = {
        profile: state.profile,
        progress: { ...state.progress, xp: state.progress.xp + amount, streak, ledger },
      }
      const newEffects = []
      if (!silent) {
        newEffects.push({ id: `xp-${Date.now()}`, kind: 'xp', amount, reason })
      }

      const after = levelForXp(next.progress.xp)
      if (after.level > before.level) {
        newEffects.push({
          id: `lvl-${Date.now()}`,
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
              { id: uid(), at: new Date().toISOString(), amount: bonus, reason: `${streak.current}-day streak bonus`, moduleId: null },
              ...next.progress.ledger,
            ].slice(0, LEDGER_MAX),
          },
        }
        newEffects.push({ id: `st-${Date.now()}`, kind: 'streak', amount: bonus, days: streak.current })
        const post = levelForXp(next.progress.xp)
        if (post.level > mid.level) {
          newEffects.push({
            id: `lvl-st-${Date.now()}`,
            kind: 'levelup',
            from: mid,
            to: post,
            unlocks: unlocksForLevel(post.level, { nextModuleName: nextModuleNameFor(state) }),
          })
        }
      }

      return { next, newEffects }
    }

    const withBadges = (state) => {
      const derived = deriveBadges(state.progress)
      const owned = new Set(state.progress.badges)
      const fresh = derived.filter((b) => b.unlocked && !owned.has(b.id))
      if (!fresh.length) return { state, fresh: [] }
      return {
        state: {
          ...state,
          progress: {
            ...state.progress,
            badges: [...state.progress.badges, ...fresh.map((b) => b.id)],
          },
        },
        fresh,
      }
    }

    const applyBadgeEffects = (newEffects, fresh) => {
      fresh.forEach((b) =>
        newEffects.push({ id: `bd-${b.id}-${Date.now()}`, kind: 'badge', badge: b }),
      )
    }

    return {
      async login(name, extra = {}) {
        setState({ profile: { ...newProfile(name || 'Learner'), ...extra }, progress: newProgress() })
        pushToast({ title: 'Welcome to LawLink', body: 'Your legal journey starts now.', tone: 'electric' })
      },

      async logout() {
        setState(emptyState())
        await storeClearAll()
      },

      async loadDemo() {
        setState(syncBadges(demoState()))
        pushToast({ title: 'Demo mode loaded', body: 'Chaitanya · Level 4 · 1,850 XP · 6 day streak', tone: 'xp' })
      },

      async resetProgress() {
        setState((s) => ({ profile: s.profile, progress: newProgress() }))
        pushToast({ title: 'Progress reset', body: 'Fresh journey. All XP and badges cleared.', tone: 'danger' })
      },

      async updateProfile(patch) {
        setState((s) => ({ ...s, profile: { ...s.profile, ...patch } }))
      },

      /** Read a short lesson card. */
      async readLesson(moduleId, lessonId) {
        setState((s) => {
          if (!s.profile) return s
          const rec = s.progress.modules[moduleId] || {}
          if (rec.lessonsRead?.includes(lessonId)) return s
          const r = award(s, {
            amount: XP_RULES.lessonRead,
            reason: 'Lesson read',
            moduleId,
            refId: lessonId,
          })
          r.newEffects.push({ id: `ls-${Date.now()}`, kind: 'hint', amount: XP_RULES.lessonRead, reason: 'Lesson read' })
          const withM = {
            profile: r.next.profile,
            progress: {
              ...r.next.progress,
              modules: {
                ...r.next.progress.modules,
                [moduleId]: { ...rec, lessonsRead: [...(rec.lessonsRead || []), lessonId] },
              },
            },
          }
          const b = withBadges(withM)
          applyBadgeEffects(r.newEffects, b.fresh)
          setEffects((e) => [...e, ...r.newEffects])
          return b.state
        })
      },

      /** Finish a scenario (right or wrong — you always learn). */
      async completeScenario(moduleId, scenarioId, correct) {
        setState((s) => {
          if (!s.profile) return s
          const rec = s.progress.modules[moduleId] || {}
          if (rec.scenariosDone?.includes(scenarioId)) return s
          const r = award(s, {
            amount: XP_RULES.scenario,
            reason: correct ? 'Scenario cleared' : 'Scenario completed',
            moduleId,
            refId: scenarioId,
          })
          const withM = {
            profile: r.next.profile,
            progress: {
              ...r.next.progress,
              modules: {
                ...r.next.progress.modules,
                [moduleId]: { ...rec, scenariosDone: [...(rec.scenariosDone || []), scenarioId] },
              },
            },
          }
          const b = withBadges(withM)
          applyBadgeEffects(r.newEffects, b.fresh)
          setEffects((e) => [...e, ...r.newEffects])
          return b.state
        })
      },

      /** Submit a full quiz. Awards XP per correct answer plus topic completion when the module closes. */
      async completeQuiz(moduleId, correctCount, total) {
        setState((s) => {
          if (!s.profile) return s
          const rec = s.progress.modules[moduleId] || {}
          const already = rec.quizDone
          const { passes, awardsTopicCompletion } = quizCompletion({
            score: correctCount,
            total,
            previouslyCompleted: rec.completed,
          })
          // Per-answer XP is once per module; a quiz cannot be farmed by retaking.
          const amount = quizAnswerXp({ score: correctCount, alreadyTaken: already })
          const best = Math.max(rec.quizBest || 0, correctCount)

          const base = {
            profile: s.profile,
            progress: {
              ...s.progress,
              quizHistory: [
                { moduleId, score: correctCount, total, at: new Date().toISOString() },
                ...s.progress.quizHistory,
              ].slice(0, QUIZ_HISTORY_MAX),
              modules: {
                ...s.progress.modules,
                [moduleId]: {
                  ...rec,
                  quizDone: true,
                  quizTaken: (rec.quizTaken || 0) + 1,
                  quizBest: best,
                  correct: Math.max(rec.correct || 0, correctCount),
                },
              },
            },
          }

          const effects = []
          let next = base
          if (amount > 0) {
            const r = award(base, {
              amount,
              reason: `${correctCount}/${total} correct — quiz`,
              moduleId,
            })
            next = r.next
            effects.push(...r.newEffects)
          }
          // A module completes on ANY attempt that reaches 80%. The previous
          // version required the FIRST attempt to pass, so failing once made the
          // module permanently uncompletable and every later module stayed locked.
          if (awardsTopicCompletion) {
            const r2 = award(next, {
              amount: XP_RULES.topicComplete,
              reason: 'Module completed',
              moduleId,
            })
            next = r2.next
            effects.push(...r2.newEffects)
            next = {
              profile: next.profile,
              progress: {
                ...next.progress,
                modules: {
                  ...next.progress.modules,
                  [moduleId]: { ...(next.progress.modules[moduleId] || {}), completed: true },
                },
              },
            }
          } else if (passes) {
            // Already completed on an earlier attempt — nothing more to award.
            next = {
              profile: next.profile,
              progress: {
                ...next.progress,
                modules: {
                  ...next.progress.modules,
                  [moduleId]: { ...(next.progress.modules[moduleId] || {}), completed: true },
                },
              },
            }
          }
          const b = withBadges(next)
          applyBadgeEffects(effects, b.fresh)
          setEffects((e) => [...e, ...effects])
          return b.state
        })
      },

      async completeDaily() {
        setState((s) => {
          if (!s.profile) return s
          const t = todayKey()
          if (s.progress.daily.lastDone === t) return s
          const r = award(s, { amount: XP_RULES.dailyChallenge, reason: 'Daily challenge cleared' })
          const next = {
            profile: r.next.profile,
            progress: {
              ...r.next.progress,
              daily: { lastDone: t, totalDone: (s.progress.daily.totalDone || 0) + 1 },
            },
          }
          const b = withBadges(next)
          applyBadgeEffects(r.newEffects, b.fresh)
          setEffects((e) => [...e, ...r.newEffects])
          return b.state
        })
      },

      async clearSixtySecond(score) {
        setState((s) => {
          if (!s.profile) return s
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
          const next = {
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
          }
          const b = withBadges(next)
          applyBadgeEffects(r.newEffects, b.fresh)
          setEffects((e) => [...e, ...r.newEffects])
          return b.state
        })
      },

      pushToast,
    }
  }, [pushToast])

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
      nextModuleId: MODULE_IDS.find((id) => unlocked[id]) || null,
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
