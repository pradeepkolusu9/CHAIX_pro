/**
 * Topic aggregator. Each topic lives in its own file under ./topics so content
 * authors can work in parallel without touching the same file.
 */
import cybercrime from './topics/cybercrime.js'
import consumer from './topics/consumer.js'
import road from './topics/road.js'
import student from './topics/student.js'
import workplace from './topics/workplace.js'
import privacy from './topics/privacy.js'
import safety from './topics/safety.js'
import fundamental from './topics/fundamental.js'

/** Journey order — this is also the unlock order. */
export const MODULES = [
  cybercrime,
  consumer,
  road,
  student,
  workplace,
  privacy,
  safety,
  fundamental,
]

const byId = new Map(MODULES.map((m) => [m.id, m]))

export const getModuleById = (id) => byId.get(id) || null
export const moduleIndex = (id) => MODULES.findIndex((m) => m.id === id)

/** Next module on the journey, or null at the end. */
export const nextModule = (id) => {
  const i = moduleIndex(id)
  return i >= 0 && i < MODULES.length - 1 ? MODULES[i + 1] : null
}

export const allScenarios = MODULES.flatMap((m) =>
  m.scenarios.map((s) => ({ ...s, moduleId: m.id, moduleName: m.name, sigil: m.sigil })),
)

export const allQuiz = MODULES.flatMap((m) =>
  m.quiz.map((item) => ({ ...item, moduleId: m.id, moduleName: m.name })),
)

/** Flat searchable index used by the global search page. */
export const searchIndex = MODULES.flatMap((m) => {
  const base = {
    id: m.id,
    moduleId: m.id,
    module: m.name,
    sigil: m.sigil,
    difficulty: m.difficulty,
    minutes: m.minutes,
    law: m.legalBasis.law,
    source: m.source,
    lastVerified: m.lastVerified,
  }
  return [
    {
      ...base,
      kind: 'topic',
      title: m.name,
      text: `${m.tagline} ${m.blurb} ${m.intro.keyPoints.join(' ')}`,
      xp: m.scenarios.length * 50 + m.quiz.length * 25 + 150,
    },
    ...m.scenarios.map((s) => ({
      ...base,
      kind: 'scenario',
      title: s.title,
      text: `${s.situation} ${s.why} ${m.name}`,
      resource: m.authority.name,
      href: `/lesson/${m.id}?tab=scenario`,
      xp: 50,
    })),
    ...m.quiz.map((q) => ({
      ...base,
      kind: 'quiz',
      title: q.question.length > 70 ? `${q.question.slice(0, 70)}…` : q.question,
      text: `${q.question} ${m.name}`,
      resource: m.authority.name,
      href: `/lesson/${m.id}?tab=quiz`,
      xp: 25,
    })),
  ]
})
