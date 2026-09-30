/**
 * LawLink — Landing (HEAVEN). Five moves:
 *   1 hero + SMS phone teaser  2 how it works  3 module showcase  4 trust band  5 closing CTA
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, MotionConfig } from 'framer-motion'
import {
  ArrowRight,
  BookOpenCheck,
  CalendarClock,
  Check,
  Flame,
  Link2,
  MessageSquareText,
  MousePointerClick,
  Play,
  Scale,
  ShieldCheck,
  Siren,
  Trophy,
  X,
  Zap,
} from 'lucide-react'
import { Button, IconBadge, ConfirmModal, DisclaimerNote, Sigil, VerifiedTag } from '../components/ui/index.jsx'
import { useStore, useActions } from '../lib/store.jsx'
import { XP_RULES } from '../lib/gamification.js'
import { toneFor } from '../lib/moduleTone.js'
import { MODULES, getModuleById } from '../data/modules.js'
import { RESOURCES, VERIFIED_ON, DISCLAIMER } from '../data/resources.js'
import { NAV_ITEMS, BRAND } from '../components/layout/nav.js'

const EASE = [0.16, 1, 0.3, 1]

const inView = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.35, delay, ease: EASE },
})

const TOTAL_SCENARIOS = MODULES.reduce((a, m) => a + m.scenarios.length, 0)
const TOTAL_QUESTIONS = MODULES.reduce((a, m) => a + m.quiz.length, 0)

function Section({ children, className = '' }) {
  return <div className={`mx-auto w-full max-w-[1200px] px-4 sm:px-6 ${className}`}>{children}</div>
}

function Heading({ eyebrow, title, sub, className = '' }) {
  return (
    <div className={className}>
      <div className="eyebrow mb-3">{eyebrow}</div>
      <h2 className="t1 max-w-[20ch] sm:max-w-none">{title}</h2>
      {sub && <p className="lead measure mt-3">{sub}</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ header */
function TopBar() {
  const { profile } = useStore()
  const Icon = BRAND.icon
  return (
    <header className="overlay-panel sticky top-0 z-40">
      <div className="mx-auto flex max-w-[1200px] items-center gap-3 px-4 py-2.5 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="tile tile-solid h-9 w-9 rounded-xl">
            <Icon size={18} strokeWidth={2.2} />
          </span>
          <span className="t3 tracking-tight">LawLink</span>
        </Link>

        <nav aria-label="Primary" className="ml-4 hidden items-center gap-1 lg:flex">
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

/* -------------------------------------------------------- the phone teaser */
const TEASER_MODULE = getModuleById('cybercrime')
const TEASER = TEASER_MODULE.scenarios[0]

function PhoneTeaser() {
  const [picked, setPicked] = useState(null)
  const { profile } = useStore()
  const nav = useNavigate()
  const reveal = picked !== null
  const right = picked === TEASER.correct

  return (
    <div className="relative mx-auto w-full max-w-[400px]">
      {/* device */}
      <div className="rounded-[44px] bg-ink-950 p-2.5 shadow-[0_40px_90px_-30px_rgba(15,27,61,0.55)]">
        <div className="overflow-hidden rounded-[34px] bg-surface-1">
          <div className="flex items-center justify-between px-6 pb-1 pt-3 text-micro font-semibold text-fg-dim">
            <span className="tnum">11:41</span>
            <span className="h-1.5 w-16 rounded-full bg-ink-950/80" aria-hidden="true" />
            <span>5G</span>
          </div>

          <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-2.5">
            <IconBadge icon={MessageSquareText} tone="electric" size="sm" />
            <div className="min-w-0">
              <div className="t3 truncate leading-tight">YuvaBazaar Offers</div>
              <div className="caption">Unknown sender · Today 11:41 PM</div>
            </div>
          </div>

          <div className="px-4 pb-5 pt-4">
            {/* the scam message as an incoming bubble */}
            <div className="max-w-[92%] rounded-[20px] rounded-tl-md bg-pure px-4 py-3 shadow-[0_1px_2px_rgba(20,34,79,0.08)]">
              <p className="text-body text-fg">{TEASER.situation}</p>
            </div>

            <div className="eyebrow mb-2.5 mt-5">What would you do?</div>
            <div className="space-y-2">
              {TEASER.options.map((o) => {
                const isCorrect = o.id === TEASER.correct
                const isPicked = picked === o.id
                const state = !reveal
                  ? 'pressable cursor-pointer'
                  : isCorrect
                    ? 'pressable bg-none bg-good/[0.08] ring-2 ring-inset ring-good/30'
                    : isPicked
                      ? 'pressable bg-none bg-danger/[0.08] ring-2 ring-inset ring-danger/30'
                      : 'pressable opacity-70'
                return (
                  <button
                    key={o.id}
                    type="button"
                    disabled={reveal}
                    onClick={() => setPicked(o.id)}
                    className={`flex min-h-[44px] w-full items-center gap-3 px-3 py-2.5 text-left ${state}`}
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-electric-500/10 text-micro font-bold uppercase text-electric-300">
                      {reveal && isCorrect ? (
                        <Check size={14} className="text-good" strokeWidth={3} />
                      ) : reveal && isPicked ? (
                        <X size={14} className="text-danger" strokeWidth={2.8} />
                      ) : (
                        o.id
                      )}
                    </span>
                    <span className="min-w-0 flex-1 text-body text-fg">{o.text}</span>
                  </button>
                )
              })}
            </div>

            {/* the live region is always mounted, so the reveal is announced when it fills */}
            <div aria-live="polite">
              {reveal ? (
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
                  <p className="copy mt-2">{TEASER.why}</p>

                  <div className="inset mt-3.5 p-3.5">
                    <div className="eyebrow">In plain words</div>
                    <p className="serif mt-1 text-[15px] italic text-fg-muted">{TEASER_MODULE.legalBasis.note}</p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <span className="caption flex items-center gap-1.5">
                        <Scale size={12} className="shrink-0" strokeWidth={2.2} />
                        {TEASER.law}
                      </span>
                      <a
                        href={TEASER.source}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="flex items-center gap-1.5 text-caption font-semibold text-electric-300 underline decoration-electric-500/40 underline-offset-2"
                      >
                        <Link2 size={12} strokeWidth={2.2} />
                        Official source
                      </a>
                      <span className="caption tnum flex items-center gap-1.5">
                        <CalendarClock size={12} className="shrink-0" strokeWidth={2.2} />
                        Drafted {TEASER.lastVerified}
                      </span>
                    </div>
                  </div>

                  <DisclaimerNote text={DISCLAIMER} compact className="mt-3" />

                  <Button
                    variant="primary"
                    className="mt-4 w-full"
                    onClick={() => nav(profile ? '/dashboard' : '/login')}
                    iconRight={ArrowRight}
                  >
                    Play all {TOTAL_SCENARIOS} scenarios
                  </Button>
                </motion.div>
              ) : (
                <p className="caption mt-4 text-center">No signup. Tap an answer and the law appears.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------- steps */
const STEPS = [
  {
    icon: MessageSquareText,
    tone: 'electric',
    title: 'Read a real situation',
    body: 'A fake KYC text at midnight. A landlord who will not return your deposit. Real scenes, not textbook cases.',
  },
  {
    icon: MousePointerClick,
    tone: 'xp',
    title: 'Make your choice',
    body: 'Four options, no pressure. Pick what you would actually do, then find out how it plays out.',
  },
  {
    icon: BookOpenCheck,
    tone: 'good',
    title: 'See the law and your rights',
    body: 'Every answer comes with the law in plain words, an official source and the date it was checked.',
  },
]

function HowItWorks() {
  return (
    <Section className="py-16 sm:py-24">
      <Heading
        eyebrow="How it works"
        title="Three steps. Twenty seconds each."
        sub="No lectures. You learn your rights by using them."
      />
      <div className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
        {STEPS.map((s, i) => (
          <motion.div key={s.title} {...inView(i * 0.06)} className="relative">
            <div className="flex items-end gap-4">
              <IconBadge icon={s.icon} tone={s.tone} size="lg" />
              <span className="num-xl select-none text-electric-500/25" aria-hidden="true">
                0{i + 1}
              </span>
            </div>
            <h3 className="t2 mt-5">{s.title}</h3>
            <p className="copy mt-2 max-w-[34ch]">{s.body}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  )
}

/* ---------------------------------------------------------------- modules */
/** Non-uniform: first module is the feature, the rest flow in a mixed-span grid. */
const SPAN = [
  'lg:col-span-6 lg:row-span-2',
  'lg:col-span-3',
  'lg:col-span-3',
  'lg:col-span-3',
  'lg:col-span-3',
  'lg:col-span-4',
  'lg:col-span-4',
  'lg:col-span-4',
]

function ModuleShowcase() {
  return (
    <Section className="pb-16 sm:pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Heading
          eyebrow="The syllabus"
          title={`Eight areas of law you will actually meet`}
          sub={`${TOTAL_SCENARIOS} scenarios and ${TOTAL_QUESTIONS} quiz questions, each tied to the law behind it.`}
        />
        <Link to="/learn" className="btn btn-ghost btn-sm">
          Browse all topics
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
        {MODULES.map((m, i) => {
          const tone = toneFor(m.id)
          const big = i === 0
          return (
            <motion.div key={m.id} {...inView(Math.min(i, 5) * 0.05)} className={`${SPAN[i]} min-w-0`}>
              <Link
                to={`/lesson/${m.id}`}
                className={`sheet group flex h-full flex-col p-5 transition-transform hover:-translate-y-0.5 ${
                  big ? 'sheet-focal justify-between p-6 sm:p-8' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={`tile tile-${tone} ${big ? 'h-20 w-20 rounded-3xl' : 'h-12 w-12 rounded-2xl'}`}>
                    <Sigil id={m.id} size={big ? 38 : 24} />
                  </span>
                  <span className="chip">{m.difficulty}</span>
                </div>
                <div className={big ? 'mt-16' : 'mt-5'}>
                  <h3 className={big ? 't1' : 't3'}>{m.name}</h3>
                  <p className={`copy mt-1.5 ${big ? 'measure lead' : ''}`}>{m.tagline}</p>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span className="caption">{m.scenarios.length} scenarios</span>
                    <span className="flex items-center gap-1 text-caption font-semibold text-electric-300">
                      {big ? 'Start here' : 'Open'}
                      <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>

      {/* one compact reward strip */}
      <motion.div
        {...inView()}
        className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-3xl bg-xp-400/[0.08] px-5 py-4 sm:px-6"
      >
        <span className="chip-xp">
          <Zap size={11} strokeWidth={2.4} />+{XP_RULES.scenario} XP per scenario
        </span>
        <span className="flex items-center gap-2 text-body text-fg-muted">
          <Flame size={16} className="text-warn" strokeWidth={2.2} /> Daily streaks
        </span>
        <span className="flex items-center gap-2 text-body text-fg-muted">
          <Trophy size={16} className="text-xp-300" strokeWidth={2.2} /> Badges and levels
        </span>
        <span className="caption sm:ml-auto">Learning that pays you back in XP.</span>
      </motion.div>
    </Section>
  )
}

/* ------------------------------------------------------------------- trust */
const PILLARS = [
  {
    icon: ShieldCheck,
    tone: 'good',
    title: 'Verified sources',
    body: 'Every answer links to the official text and shows when it was written.',
  },
  {
    icon: BookOpenCheck,
    tone: 'electric',
    title: 'Plain words',
    body: 'Sections and sub-clauses translated into what they mean for you.',
  },
  {
    icon: Scale,
    tone: 'violet',
    title: 'Awareness, not advice',
    body: 'Built to teach. For your own case, talk to a lawyer.',
  },
]

function TrustBand() {
  const nav = useNavigate()
  const numbers = RESOURCES.filter((r) => r.category === 'emergency' && r.number)
  const more = RESOURCES.filter((r) => r.category !== 'emergency' && r.number)
  const lines = [...numbers, ...more]

  return (
    <section className="bg-electric-500/[0.07]">
      <Section className="py-16 sm:py-24">
        <Heading
          eyebrow="Why trust it"
          title="Built to be checked, not just believed."
          sub="You should never have to take our word for it."
        />
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <motion.div key={p.title} {...inView(i * 0.06)} className="flex gap-4">
              <IconBadge icon={p.icon} tone={p.tone} size="md" />
              <div>
                <h3 className="t3">{p.title}</h3>
                <p className="copy mt-1">{p.body}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* calm-but-urgent emergency strip */}
        <motion.div
          {...inView()}
          className="mt-12 overflow-hidden rounded-[32px] bg-pure shadow-[0_0_0_1px_rgba(225,29,72,0.16),0_30px_60px_-36px_rgba(225,29,72,0.4)]"
        >
          <div className="flex flex-wrap items-center gap-4 bg-danger/[0.07] px-5 py-5 sm:px-8">
            <IconBadge icon={Siren} tone="danger" size="md" />
            <div className="min-w-0 flex-1">
              <h3 className="t2">In danger right now? Call 112.</h3>
              <p className="copy mt-0.5">Free, 24 hours, anywhere in India. The numbers below work the same way.</p>
            </div>
            <a href="tel:112" className="btn btn-danger btn-lg">
              Call 112
            </a>
          </div>
          <ul className="grid grid-cols-2 gap-px bg-danger/[0.08] md:grid-cols-5">
            {lines.map((r) => (
              <li key={r.id} className="min-w-0 bg-pure">
                <a
                  href={`tel:${r.number}`}
                  className="block min-h-[44px] px-4 py-3.5 transition-colors hover:bg-danger/[0.04]"
                >
                  <div className="num text-danger">{r.number}</div>
                  <div className="caption mt-0.5 truncate">{r.name}</div>
                </a>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-3 px-5 py-4 sm:px-8">
            <Button variant="ghost" size="sm" icon={Siren} onClick={() => nav('/emergency')}>
              Full resource directory
            </Button>
            <span className="caption">Tap a number to call.</span>
          </div>
        </motion.div>
      </Section>
    </section>
  )
}

/* --------------------------------------------------------------- the close */
function ClosingCta() {
  const { profile } = useStore()
  const { actions } = useActions()
  const nav = useNavigate()
  const [confirm, setConfirm] = useState(false)
  const enterDemo = async () => {
    setConfirm(false)
    await actions.loadDemo()
    nav('/dashboard')
  }
  return (
    <Section className="py-16 sm:py-24">
      <ConfirmModal
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={enterDemo}
        title="Replace your account with the demo?"
        body="This device's progress and account will be replaced by the demo data. You can't undo this."
        confirmLabel="Replace with demo"
      />
      <motion.div {...inView()} className="sheet-lg sheet-focal px-6 py-12 text-center sm:px-12 sm:py-16">
        <h2 className="t1 mx-auto max-w-[22ch]">
          Your first scenario is <span className="text-gradient-xp">ninety seconds</span> away.
        </h2>
        <p className="lead mx-auto mt-3 max-w-[46ch]">
          Jump in with a demo account. Watch XP, badges and level-ups happen, no card and no real signup.
        </p>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Button variant="primary" size="lg" icon={Play} onClick={() => nav(profile ? '/dashboard' : '/login')}>
            Start Learning
          </Button>
          <Button
            variant="ghost"
            size="lg"
            icon={Zap}
            onClick={() => (profile && !profile.isDemo ? setConfirm(true) : enterDemo())}
          >
            Try demo mode
          </Button>
        </div>
      </motion.div>
    </Section>
  )
}

/* ---------------------------------------------------------------- footer */
function SiteFooter() {
  const links = NAV_ITEMS.filter((n) => ['/learn', '/journey', '/daily', '/ai', '/emergency'].includes(n.to))
  const Icon = BRAND.icon
  return (
    <footer className="px-4 pb-10 pt-2 sm:px-6">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <span className="tile tile-solid h-8 w-8 rounded-lg">
              <Icon size={16} strokeWidth={2.2} />
            </span>
            <span className="t3 tracking-tight">LawLink</span>
          </div>
          <p className="caption mt-3">
            A gamified legal literacy platform for Indian students. Educational content with sources. Helplines: 112
            emergency · 1930 cyber fraud · 1915 consumer · 1091 and 181 women.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-10 gap-y-2">
          {links.map((n) => (
            <Link key={n.to} to={n.to} className="caption font-semibold hover:text-fg">
              {n.label}
            </Link>
          ))}
          <Link to="/about" className="caption font-semibold hover:text-fg">
            About &amp; methodology
          </Link>
        </div>
      </div>
    </footer>
  )
}

/* ------------------------------------------------------------------- page */
export default function Landing() {
  const { profile } = useStore()
  const nav = useNavigate()

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen">
        <TopBar />

        {/* 1 — hero; the phone hangs into the next band on desktop */}
        <section className="dotgrid relative">
          <Section className="grid items-start gap-12 pb-10 pt-10 sm:pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:pt-20">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="lg:pt-6"
            >
              <span className="chip-electric">
                <Scale size={11} strokeWidth={2.4} />
                Legal literacy, gamified
              </span>
              <h1 className="display mt-5 text-[40px] leading-[1.05] sm:text-[56px] lg:text-display">
                Know Your Rights.
                <br />
                Level Up Your <span className="text-gradient-xp whitespace-nowrap">Legal IQ.</span>
              </h1>
              <p className="lead measure mt-5">
                Indian law is not the problem. It is just written for lawyers. LawLink turns it into quick, playable
                situations from your own life, then shows you exactly what the law says.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button variant="primary" size="lg" icon={Play} onClick={() => nav(profile ? '/dashboard' : '/login')}>
                  Start Learning
                </Button>
                <Button variant="ghost" size="lg" iconRight={ArrowRight} onClick={() => nav('/learn')}>
                  Explore Legal Topics
                </Button>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
                <VerifiedTag date={VERIFIED_ON} />
                <span className="caption">
                  {MODULES.length} modules · {TOTAL_SCENARIOS} scenarios · works on mobile
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08, ease: EASE }}
              className="relative z-10 w-full lg:-mb-32"
            >
              <PhoneTeaser />
            </motion.div>
          </Section>
        </section>

        <div className="lg:pt-24" />
        <HowItWorks />
        <ModuleShowcase />
        <TrustBand />
        <ClosingCta />
        <SiteFooter />
      </div>
    </MotionConfig>
  )
}
