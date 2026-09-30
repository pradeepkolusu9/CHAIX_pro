/**
 * LawLink — Landing. Design system v2.
 *
 * Council decisions implemented here (docs/council/01 §5, 02 §5.3 and §6):
 *   - The focal point is the SCENARIO, not the slogan. The interactive teaser is the
 *     hero's right column; its four options and reveal behave exactly as before.
 *   - The page is FOUR BEATS at four scales of one motif: the interruption (an SMS at
 *     11:41 PM) -> the choice (four options) -> the reveal (the law, in plain words,
 *     sourced and dated) -> the road (8 pips, mission 02 of 08).
 *   - ONE gradient in the product: `Legal IQ.` in `.text-gradient-xp`.
 *   - `.display` is used once and it is words. The old 60px "04" numeral is gone:
 *     `<LevelSeal/>` at 40px plus one unboxed `divide-x` row of three `num` figures.
 *   - Every emoji is gone. Topic entries use `<IconBadge icon={sigilGlyph(m.id)} />`;
 *     "Did you know?" uses the lucide `Lightbulb`. Eyebrows are plain type.
 *   - ONE `variant="primary"` on the page: "Start Learning".
 *   - Cut: the 4-box XP economy band, the 3-module "Continue learning" card and the
 *     6-badge emoji grid. The page is roughly half its v1 height.
 */
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, MotionConfig } from 'framer-motion'
import {
  ArrowRight,
  CalendarClock,
  Check,
  Lightbulb,
  Link2,
  Play,
  Scale,
  Shield,
  Siren,
  X,
  Zap,
} from 'lucide-react'
import {
  Card,
  CardHead,
  Panel,
  LevelSeal,
  Pill,
  Button,
  IconBadge,
  DisclaimerNote,
  VerifiedTag,
  sigilGlyph,
  formatNumber,
} from '../components/ui/index.jsx'
import { useStore, useActions, demoState, allModuleStats } from '../lib/store.jsx'
import { levelForXp, levelNumber, XP_RULES } from '../lib/gamification.js'
import { MODULES, getModuleById } from '../data/modules.js'
import { factForDate } from '../data/facts.js'
import { RESOURCES, VERIFIED_ON, DISCLAIMER } from '../data/resources.js'
import { NAV_ITEMS, BRAND } from '../components/layout/nav.js'

const EASE = [0.16, 1, 0.3, 1]

/** Below-the-fold entrance. `once` so nothing re-animates while reading. */
const inView = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.32, delay, ease: EASE },
})

const TOTAL_SCENARIOS = MODULES.reduce((a, m) => a + m.scenarios.length, 0)
const TOTAL_QUESTIONS = MODULES.reduce((a, m) => a + m.quiz.length, 0)

function Section({ children, className = '' }) {
  return <div className={`mx-auto w-full max-w-[1200px] px-4 sm:px-6 ${className}`}>{children}</div>
}

/* ------------------------------------------------------------------ header */
/** L3 — a scrolled top bar is the one place backdrop-blur is legal. */
function TopBar() {
  const { profile } = useStore()
  const Icon = BRAND.icon
  return (
    <header className="overlay-panel sticky top-0 z-40 border-b border-white/[0.06]">
      <div className="mx-auto flex max-w-[1200px] items-center gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-electric-500/15 ring-1 ring-inset ring-electric-500/30">
            <Icon size={16} className="text-electric-300" strokeWidth={2.2} />
          </span>
          <span className="t3 tracking-tight">LAWLINK</span>
        </Link>

        <nav className="ml-3 hidden items-center gap-0.5 lg:flex">
          {NAV_ITEMS.filter((n) => ['/learn', '/journey', '/ai', '/emergency'].includes(n.to)).map((n) => (
            <Link key={n.to} to={n.to} className="btn btn-quiet btn-sm">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {profile ? (
            <Button variant="ghost" size="sm" as={Link} to="/dashboard" iconRight={ArrowRight}>
              Go to dashboard
            </Button>
          ) : (
            <Button variant="ghost" size="sm" as={Link} to="/login">
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

/* --------------------------------------------------- beats 1-3: the teaser */
const TEASER_MODULE = getModuleById('cybercrime')
const TEASER = TEASER_MODULE.scenarios[0]

function Teaser() {
  const [picked, setPicked] = useState(null)
  const { profile } = useStore()
  const nav = useNavigate()
  const reveal = picked !== null
  const right = picked === TEASER.correct

  return (
    <Panel className="p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="eyebrow text-electric-300">Try it now · 20 seconds</span>
        {/* A visitor here has no account, so there is no XP to bank. Claiming a
            live +50 on a page whose whole job is showing that the loop really
            works is the fastest way to lose the judge. The teaser is a preview;
            the real reward is one click away in the dashboard. */}
        <Pill>Preview · no account needed</Pill>
      </div>

      {/* BEAT 1 — the interruption. One message, and it is 11:41 PM. */}
      <div className="rounded-2xl bg-surface-2/70 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="eyebrow">YuvaBazaar Offers</span>
          <span className="caption tnum shrink-0">11:41 PM</span>
        </div>
        <p className="lead measure mt-2">{TEASER.situation}</p>
      </div>

      {/* BEAT 2 — the choice. Four options, one of them right. On reveal they stay
          put and are marked, so you can see which one the law would have taken. */}
      <div className="eyebrow mt-5">What would you do?</div>
      <div className="mt-2.5 space-y-2">
        {TEASER.options.map((o) => {
          const isCorrect = o.id === TEASER.correct
          const isPicked = picked === o.id
          const state = !reveal
            ? 'pressable cursor-pointer'
            : isCorrect
              ? 'pressable bg-good/[0.06] ring-2 ring-inset ring-good/30'
              : isPicked
                ? 'pressable bg-danger/[0.06] ring-2 ring-inset ring-danger/30'
                : 'pressable opacity-45'
          return (
            <button
              key={o.id}
              type="button"
              disabled={reveal}
              onClick={() => setPicked(o.id)}
              className={`flex w-full items-center gap-3 px-3 py-2.5 text-left ${state}`}
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white/[0.06] text-micro font-semibold uppercase text-fg-dim">
                {reveal && isCorrect ? (
                  <Check size={12} className="text-good" strokeWidth={3} />
                ) : reveal && isPicked ? (
                  <X size={12} className="text-danger" strokeWidth={2.8} />
                ) : (
                  o.id
                )}
              </span>
              <span className="min-w-0 flex-1 text-body text-fg">{o.text}</span>
            </button>
          )
        })}
      </div>

      {reveal ? (
        /* BEAT 3 — the reveal. The law, in plain words, with its source and date. */
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: EASE }}
          className="mt-4"
        >
          <div className="flex items-center gap-2">
            {right ? (
              <Check size={15} className="shrink-0 text-good" strokeWidth={3} />
            ) : (
              <X size={15} className="shrink-0 text-danger" strokeWidth={2.6} />
            )}
            <span className={`t3 ${right ? 'text-good' : 'text-danger'}`}>
              {right ? 'Correct — good call' : 'Not quite — here is the right move'}
            </span>
          </div>

          <p className="copy measure mt-2">{TEASER.why}</p>

          <div className="mt-4 border-t border-white/[0.05] pt-3.5">
            <div className="eyebrow">In plain words</div>
            <p className="serif mt-1 text-[15px] italic text-fg-muted">
              {TEASER_MODULE.legalBasis.note}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
              <span className="flex items-center gap-1.5 caption">
                <Scale size={12} className="shrink-0 text-fg-faint" strokeWidth={2.2} />
                {TEASER.law}
              </span>
              <a
                href={TEASER.source}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-1.5 font-semibold text-electric-300 underline decoration-electric-500/40 underline-offset-2 hover:decoration-electric-400"
              >
                <Link2 size={12} strokeWidth={2.2} />
                Official source
              </a>
              <span className="flex items-center gap-1.5 caption tnum">
                <CalendarClock size={12} className="shrink-0 text-fg-faint" strokeWidth={2.2} />
                Verified {TEASER.lastVerified}
              </span>
            </div>
          </div>

          <DisclaimerNote text={DISCLAIMER} compact className="mt-3.5" />

          <Button
            variant="ghost"
            className="mt-4 w-full"
            onClick={() => nav(profile ? '/dashboard' : '/login')}
            iconRight={ArrowRight}
          >
            Play the full {TOTAL_SCENARIOS}-scenario journey
          </Button>
        </motion.div>
      ) : (
        <p className="caption mt-4">
          No signup needed. Pick an answer and the law appears, with its source and the date it was
          checked.
        </p>
      )}
    </Panel>
  )
}

/* ---------------------------------------- the progression line (no XpWidget) */
/** Replaces the old 60px "04" widget: a 40px seal + three unboxed `num` figures. */
function ProgressLine() {
  const { profile, level, streak, stats } = useStore()

  const sample = !profile
  const shown = useMemo(
    () => (profile ? level : levelForXp(demoState().progress.xp)),
    [profile, level],
  )
  const shownStats = useMemo(
    () => (profile ? stats : allModuleStats(demoState().progress)),
    [profile, stats],
  )
  const totals = useMemo(() => {
    const vals = Object.values(shownStats || {})
    return {
      scenarios: vals.reduce((a, s) => a + (s.scenariosDone || 0), 0),
      modules: vals.filter((s) => s.completed).length,
    }
  }, [shownStats])

  const shownStreak = profile ? streak?.current || 0 : demoState().progress.streak.current

  // Every figure is derived from real progress — nothing is hardcoded, so the
  // signed-out sample account reports exactly what the demo save contains.
  const figures = [
    { label: 'Day streak', value: shownStreak },
    { label: 'Scenarios', value: `${totals.scenarios}/${TOTAL_SCENARIOS}` },
    { label: 'Modules', value: `${totals.modules}/${MODULES.length}` },
  ]

  return (
    <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-white/[0.06] pt-5">
      <div className="flex items-center gap-3">
        <LevelSeal
          number={levelNumber(shown.level)}
          name={shown.name}
          sub={`${formatNumber(shown.xp)} XP`}
        />
        {/* No "Live" badge. It was a claim about the world that nothing on the
            page supported — and on a legal-information site an unsupported
            liveness claim is the cheapest way to lose the trust the rest of the
            design spends its effort earning. "Sample account" is a true statement
            about state. */}
        {sample && <Pill>Sample account</Pill>}
      </div>
      <div className="grid flex-1 grid-cols-3 divide-x divide-white/[0.05]">
        {figures.map((f) => (
          <div key={f.label} className="px-4 first:pl-0">
            <div className="eyebrow mb-1">{f.label}</div>
            <div className="num">{f.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* -------------------------------------------------------- beat 4: the road */
/** 8-pip quest track — same pattern as the Dashboard hero. */
function QuestTrack({ stats, unlocked }) {
  const partial = MODULES.findIndex((m) => stats[m.id] && stats[m.id].pct > 0 && stats[m.id].pct < 100)
  const current = partial === -1 ? MODULES.findIndex((m) => unlocked[m.id] !== false) : partial
  const nextLocked = MODULES.find((m) => unlocked[m.id] === false)
  const done = current === -1 ? MODULES.length : current

  return (
    <div>
      <div
        className="grid grid-cols-8 gap-1.5"
        role="img"
        aria-label={`Mission ${done + 1} of ${MODULES.length}`}
      >
        {MODULES.map((m, i) => {
          const s = stats[m.id] || {}
          const state = s.completed ? 'done' : i === current ? 'current' : 'locked'
          return (
            <span
              key={m.id}
              title={m.name}
              data-s={state}
              className={`h-1.5 rounded-full ${
                state === 'done' ? 'bg-good/70' : state === 'current' ? 'bg-electric-400' : 'bg-white/[0.08]'
              }`}
            />
          )
        })}
      </div>
      <p className="caption mt-2">
        Mission {String(Math.min(done + 1, MODULES.length)).padStart(2, '0')} of{' '}
        {String(MODULES.length).padStart(2, '0')}
        {nextLocked && ` · ${nextLocked.name} unlocks next`}
      </p>
    </div>
  )
}

function RoadBand() {
  const { profile, stats, unlocked } = useStore()
  const nav = useNavigate()

  const shown = useMemo(() => {
    if (profile) return { stats, unlocked }
    const demo = allModuleStats(demoState().progress)
    const map = {}
    let open = true
    for (const m of MODULES) {
      map[m.id] = open
      if (!demo[m.id]?.completed) open = false
    }
    return { stats: demo, unlocked: map }
  }, [profile, stats, unlocked])

  return (
    <section className="border-t border-white/[0.06]">
      <Section className="py-8 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-10">
          <motion.div {...inView()}>
            <div className="eyebrow mb-2">The road</div>
            <h2 className="t2">Every mission ends. The next one is already there.</h2>
            <p className="copy measure mt-1.5">
              Eight modules unlock in order, and every level unlocks something new — a badge, a title,
              a harder scenario. The map always shows the one thing to do next, and tomorrow there is
              another message to open.
            </p>
          </motion.div>

          <motion.div {...inView(0.06)}>
            <QuestTrack stats={shown.stats} unlocked={shown.unlocked} />
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              iconRight={ArrowRight}
              onClick={() => nav(profile ? '/journey' : '/login')}
            >
              See the journey map
            </Button>
          </motion.div>
        </div>
      </Section>
    </section>
  )
}

/* ------------------------------------------------------------ the syllabus */
/**
 * Eight topic entries as a flat hairline ledger rather than eight raised cards:
 * it holds the page to the six-surfaces-at-once budget. One Sigil per entry,
 * in journey order, the first one electric because it is where you start.
 */
function TopicIndex() {
  const { profile } = useStore()

  return (
    <section className="border-t border-white/[0.06]">
      <Section className="py-8 sm:py-10">
        <CardHead
          eyebrow="The syllabus"
          title={`Eight modules, ${TOTAL_SCENARIOS} situations you will actually meet`}
          sub="Each module is a short lesson set, five real scenarios, a quiz — and the law behind every answer."
          action={
            <Link
              to="/learn"
              className="hidden shrink-0 items-center gap-1 caption font-semibold text-electric-300 hover:underline sm:flex"
            >
              Open the syllabus
              <ArrowRight size={13} />
            </Link>
          }
        />

        <motion.div
          {...inView()}
          className="grid grid-cols-1 border-t border-white/[0.05] sm:grid-cols-2 lg:grid-cols-4"
        >
          {MODULES.map((m, i) => (
            <Link
              key={m.id}
              to={profile ? `/lesson/${m.id}` : '/learn'}
              className={`group flex flex-col border-b border-white/[0.05] px-4 py-5 transition-colors hover:bg-white/[0.03] sm:border-l sm:border-l-0 ${
                i % 4 === 0 ? 'lg:border-l-0' : ''
              } ${i >= MODULES.length - 4 ? 'lg:border-b-0' : ''}`}
            >
              <IconBadge icon={sigilGlyph(m.id)} tone={i === 0 ? 'electric' : 'muted'} size="lg" />
              <h3 className="t3 mt-4">{m.name}</h3>
              <p className="copy mt-1.5 flex-1">{m.tagline}</p>
              <div className="mt-3.5 flex items-center justify-between gap-2">
                <span className="chip">{m.difficulty}</span>
                <span className="num text-xp-300">
                  {m.scenarios.length * XP_RULES.scenario + m.quiz.length * XP_RULES.quizCorrect + XP_RULES.topicComplete}
                  <span className="ml-1 text-caption font-semibold text-fg-dim">XP</span>
                </span>
              </div>
            </Link>
          ))}
        </motion.div>
      </Section>
    </section>
  )
}

/* ------------------------------------------------- did you know + emergency */
function FactCard() {
  const fact = factForDate()
  return (
    <Card className="flex h-full items-start gap-3.5 p-5">
      <IconBadge icon={Lightbulb} tone="muted" size="sm" className="mt-0.5" />
      <div className="min-w-0">
        <div className="eyebrow">Did you know?</div>
        <h3 className="t3 mt-2">{fact.title}</h3>
        <p className="copy measure mt-1.5">{fact.body}</p>
        <a
          href={fact.link}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-3 inline-flex items-center gap-1.5 text-caption font-semibold text-electric-300 hover:underline"
        >
          {fact.linkLabel}
          <ArrowRight size={13} />
        </a>
      </div>
    </Card>
  )
}

function EmergencyStrip() {
  const nav = useNavigate()
  const emergency = RESOURCES.filter((r) => r.category === 'emergency' && r.number).slice(0, 4)

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="eyebrow mb-2 text-danger">Emergency help</div>
          <h3 className="t2">Verified Indian helplines. Nothing invented.</h3>
          <p className="copy measure mt-1.5">
            Every number below is an officially published helpline, shown with the authority that runs
            it. If anyone is in immediate danger, call 112 first.
          </p>
        </div>
        <VerifiedTag date={VERIFIED_ON} className="shrink-0" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 border-t border-white/[0.05] pt-4">
        {emergency.map((r) => (
          <a
            key={r.id}
            href={`tel:${r.number}`}
            className="group rounded-xl px-1 py-1.5 transition-colors hover:bg-white/[0.04] sm:px-2"
          >
            <div className="num-lg text-danger">{r.number}</div>
            <div className="t3 mt-1 leading-snug">{r.name}</div>
            <div className="caption mt-0.5">{r.source}</div>
          </a>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/[0.05] pt-3.5">
        <Button variant="ghost" size="sm" icon={Siren} onClick={() => nav('/emergency')}>
          Open the resource directory
        </Button>
        <span className="caption">Tap a number to call it.</span>
      </div>
    </Card>
  )
}

/* ---------------------------------------------------------------- the page */
export default function Landing() {
  const { profile } = useStore()
  const { actions } = useActions()
  const nav = useNavigate()

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen">
        <TopBar />

        {/* ============================================ beats 1-3 — the hero */}
        <section className="dotgrid relative">
          <Section className="grid gap-9 py-10 sm:py-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:py-14">
            {/* left — the promise, the one primary, the proof */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span className="eyebrow">Gamified legal literacy</span>
                <span className="h-3 w-px bg-white/10" aria-hidden="true" />
                <span className="eyebrow tnum">
                  {MODULES.length} modules · {TOTAL_SCENARIOS} scenarios · {TOTAL_QUESTIONS} questions
                </span>
              </div>

              {/* the ONE .display on the product — words, not an integer */}
              <h1 className="display mt-4 text-[36px] sm:text-display">
                Know Your Rights.
                <br />
                Level Up Your
                <br />
                <span className="text-gradient-xp">Legal IQ.</span>
              </h1>

              <p className="lead measure mt-5">
                Indian law is not the problem — it is scattered, dense and written for lawyers. LawLink
                turns it into short, interactive challenges built on{' '}
                <span className="font-semibold text-fg">real situations you will actually face</span>,
                then rewards you for learning it.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* the only btn-primary in the product's landing page */}
                <Button
                  variant="primary"
                  size="lg"
                  icon={Play}
                  onClick={() => nav(profile ? '/dashboard' : '/login')}
                >
                  Start Learning
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  iconRight={ArrowRight}
                  onClick={() => nav('/learn')}
                >
                  Explore Legal Topics
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
                <VerifiedTag date={VERIFIED_ON} />
                <span className="caption">No signup to try a scenario · Works on mobile</span>
              </div>

              <ProgressLine />
            </motion.div>

            {/* right — the scenario, promoted. The focal point of the page. */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08, ease: EASE }}
            >
              <Teaser />
            </motion.div>
          </Section>
        </section>

        <RoadBand />

        <TopicIndex />

        {/* ------------------------------------------- supporting, subordinate */}
        <section className="border-t border-white/[0.06]">
          <Section className="grid gap-4 py-8 sm:py-10 lg:grid-cols-[1fr_1.2fr]">
            <motion.div {...inView()} className="flex">
              <FactCard />
            </motion.div>
            <motion.div {...inView(0.06)} className="flex">
              <EmergencyStrip />
            </motion.div>
          </Section>
        </section>

        {/* --------------------------------------------- the close + the demo */}
        <section className="border-t border-white/[0.06]">
          <Section className="py-8 sm:py-10">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div className="min-w-0">
                <div className="eyebrow mb-2">No credit card, no real account</div>
                <h2 className="t2">Your first scenario is ninety seconds long.</h2>
                <p className="copy measure mt-1.5">
                  Load the demo account and watch XP, badges and level-ups happen live, from a
                  realistic mid-journey save.
                </p>
              </div>
              <Button
                variant="ghost"
                size="lg"
                icon={Zap}
                iconRight={ArrowRight}
                onClick={async () => {
                  await actions.loadDemo()
                  nav('/dashboard')
                }}
              >
                Jump straight into demo mode
              </Button>
            </div>
            <DisclaimerNote text={DISCLAIMER} className="mt-6" />
          </Section>
        </section>

        <SiteFooter />
      </div>
    </MotionConfig>
  )
}

/* ----------------------------------------------------------------- footer */
function SiteFooter() {
  const links = NAV_ITEMS.filter((n) =>
    ['/learn', '/journey', '/daily', '/ai', '/emergency'].includes(n.to),
  )
  return (
    <footer className="border-t border-white/[0.06] px-4 py-9 sm:px-6">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <div className="flex items-center gap-2">
            <Shield size={15} className="text-electric-300" strokeWidth={2.3} />
            <span className="t3 tracking-tight">LAWLINK</span>
          </div>
          <p className="caption measure mt-3">
            A gamified legal literacy platform for Indian students. Content is educational and carries
            its source and verification date. Helplines: 112 emergency · 1930 cyber fraud · 1915
            consumer · 1091 and 181 women.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-10 gap-y-2">
          {links.map((n) => (
            <Link key={n.to} to={n.to} className="caption font-semibold text-fg-dim hover:text-fg">
              {n.label}
            </Link>
          ))}
          <Link to="/about" className="caption font-semibold text-fg-dim hover:text-fg">
            About &amp; methodology
          </Link>
        </div>
      </div>
    </footer>
  )
}
