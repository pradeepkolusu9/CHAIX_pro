/**
 * Auth — /login
 *
 * Public page rendered inside PublicShell (bare dark page, no sidebar, no top bar).
 *
 * Two rules shape this file:
 *  1. A judge must reach a fully-populated account in one click, so the HACKATHON
 *     DEMO MODE panel is the loudest thing on the page and the only primary button.
 *  2. The auth form is honest — it says out loud that it is a prototype and keeps
 *     no secrets. "Remember me" really does persist a prefill.
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Zap,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  UserCheck,
  GraduationCap,
  ArrowRight,
  Target,
  BookOpen,
  Scale,
  Flame,
  RotateCcw,
  LogOut,
  AlertCircle,
  Check,
} from 'lucide-react'
import { useStore, useActions, demoState, MODULE_IDS, allModuleStats } from '../lib/store.jsx'
import {
  Card,
  Skeleton,
  Tabs,
  ProgressBar,
  LevelSeal,
  Button,
  Figure,
  formatNumber,
} from '../components/ui/index.jsx'
import { BADGES, LEVELS, levelForXp, levelNumber } from '../lib/gamification.js'

const EASE = [0.16, 1, 0.3, 1]
const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: EASE, delay },
})

/* ------------------------------------------------------------------ the demo */
/* The preview strip is read straight out of the demo snapshot so what a judge
 * sees here is exactly what they get after clicking. */
const DEMO = demoState()
const DEMO_STATS = allModuleStats(DEMO.progress)
const DEMO_BADGE_COUNT = BADGES.filter((b) =>
  b.test({
    lessonsCompleted: Object.values(DEMO_STATS).reduce((a, s) => a + s.lessonsRead, 0),
    bestQuizPct: Math.max(
      0,
      ...Object.values(DEMO_STATS).map((s) => (s.quizTotal ? Math.round((s.quizBest / s.quizTotal) * 100) : 0)),
    ),
    longestStreak: DEMO.progress.streak.longest,
    modulesDone: MODULE_IDS.filter((id) => DEMO_STATS[id].completed),
    sixtySecondCleared: DEMO.progress.sixtySecond.cleared,
    perfectQuiz: Object.values(DEMO_STATS).some((s) => s.quizTotal > 0 && s.quizBest === s.quizTotal),
  }),
).length
const DEMO_LEVEL = levelForXp(DEMO.progress.xp)

const PITCH = [
  'Scenarios, not lectures — make the call first, then read the law behind it.',
  'Every answer cites the Act, the section and an official government link.',
  'XP, levels and streaks, so knowing your rights becomes a habit.',
]

const TRUST = [
  {
    title: '8 legal modules',
    body: 'Cybercrime, consumer, road, student, workplace, privacy, safety and fundamental rights.',
  },
  {
    title: '40 scenarios',
    body: 'Real situations with the right first step, the tempting wrong one, and the law for both.',
  },
  {
    title: 'Verified sources',
    body: 'Each item carries its Act, an official link and the date it was last checked.',
  },
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const REMEMBER_KEY = 'lawlink:v1:remember'

/* ------------------------------------------------------------------- fields */
function Field({ id, label, icon: Icon, error, hint, right, ...rest }) {
  return (
    <div>
      <label htmlFor={id} className="eyebrow mb-1.5 block">
        {label}
      </label>
      <div className="relative">
        <Icon
          size={15}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-dim"
          strokeWidth={2.2}
        />
        <input
          id={id}
          aria-invalid={error ? 'true' : undefined}
          className={`pressable w-full py-2.5 pl-10 pr-10 text-body text-fg outline-none placeholder:text-fg-faint focus:ring-2 focus:ring-inset focus:ring-electric-500/50 ${
            error ? 'ring-2 ring-inset ring-danger/40' : ''
          }`}
          {...rest}
        />
        {right}
      </div>
      {error ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-caption text-danger">
          <AlertCircle size={12} strokeWidth={2.4} />
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-caption text-fg-dim">{hint}</p>
      ) : null}
    </div>
  )
}

function validate(mode, form) {
  const errors = {}
  const name = form.name.trim()
  const email = form.email.trim()

  if (!name) errors.name = 'Enter your name.'
  else if (name.length < 2) errors.name = 'Name must be at least 2 characters.'

  if (!email) errors.email = 'Enter an email address.'
  else if (!EMAIL_RE.test(email)) errors.email = 'That does not look like a valid email address.'

  if (!form.password) errors.password = 'Enter a password.'
  else if (form.password.length < 6) errors.password = 'Password must be at least 6 characters.'

  return errors
}

const emptyForm = { name: '', college: '', email: '', password: '', remember: false }

/* -------------------------------------------------------------------- page */
export default function Auth() {
  const { profile, ready, level, impact } = useStore()
  const { actions, pushToast } = useActions()
  const nav = useNavigate()

  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [showPw, setShowPw] = useState(false)
  const [busy, setBusy] = useState(false)
  const [demoBusy, setDemoBusy] = useState(false)
  const [resetBusy, setResetBusy] = useState(false)
  const [outBusy, setOutBusy] = useState(false)

  /* "Remember me" genuinely persists the prefill on this device. */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(REMEMBER_KEY)
      if (!raw) return
      const saved = JSON.parse(raw)
      setForm((f) => ({
        ...f,
        name: saved.name || '',
        email: saved.email || '',
        college: saved.college || '',
        remember: true,
      }))
    } catch {
      /* storage blocked — the form still works, it just will not prefill */
    }
  }, [])

  const set = (key) => (e) => {
    const value = e.target.value
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const setRemember = (e) => {
    const remember = e.target.checked
    setForm((f) => ({ ...f, remember }))
    try {
      if (remember) {
        window.localStorage.setItem(
          REMEMBER_KEY,
          JSON.stringify({ name: form.name.trim(), email: form.email.trim(), college: form.college.trim() }),
        )
      } else {
        window.localStorage.removeItem(REMEMBER_KEY)
      }
    } catch {
      /* ignore — not worth interrupting the user for */
    }
  }

  const switchMode = (next) => {
    if (next === mode) return
    setMode(next)
    setErrors({})
  }

  const enterDemo = async () => {
    setDemoBusy(true)
    try {
      await actions.loadDemo()
      nav('/dashboard')
    } finally {
      setDemoBusy(false)
    }
  }

  const resetDemo = async () => {
    setResetBusy(true)
    try {
      await actions.loadDemo()
      pushToast({
        title: 'Demo data reset',
        body: `Progress restored to the snapshot — ${formatNumber(DEMO.progress.xp)} XP, ${DEMO.progress.streak.current}-day streak.`,
        tone: 'electric',
      })
    } finally {
      setResetBusy(false)
    }
  }

  const signOut = async () => {
    setOutBusy(true)
    try {
      await actions.logout()
      pushToast({ title: 'Signed out', body: 'Stored progress cleared from this device.' })
    } finally {
      setOutBusy(false)
    }
  }

  const forgotPassword = () =>
    pushToast({
      title: 'No password reset in the demo',
      body: 'Accounts live on this device only, so there is no email to reset. Use "Reset all progress" in your profile instead.',
    })

  const onSubmit = async (e) => {
    e.preventDefault()
    const found = validate(mode, form)
    setErrors(found)
    if (Object.keys(found).length) return

    setBusy(true)
    try {
      await actions.login(form.name.trim(), { email: form.email.trim(), college: form.college.trim() })
      nav('/dashboard')
    } finally {
      setBusy(false)
    }
  }

  /* ------------------------------------------------------------- rendering */
  const sessionCard = profile ? (
    <div className="space-y-5 py-1 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-electric-500/10">
        <UserCheck size={24} className="text-electric-300" strokeWidth={2.1} />
      </div>
      <div>
        <div className="eyebrow">Account on this device</div>
        <h2 className="t3 mt-1.5">{profile.name}</h2>
        <p className="copy mt-1">{profile.email || 'No email on this account'}</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <span className="text-body text-fg-muted">
          Level {levelNumber(level.level)} · {level.name}
        </span>
        <span className="num text-xp-300">{formatNumber(impact.xp)} XP</span>
        <span className="flex items-center gap-1.5 text-body text-fg-muted">
          <Flame size={13} strokeWidth={2.2} className="text-warn" />
          {impact.streak}-day streak
        </span>
      </div>

      <div className="space-y-2">
        <Button as={Link} to="/dashboard" variant="ghost" className="w-full" iconRight={ArrowRight}>
          Continue to Dashboard
        </Button>
        <Button
          variant="quiet"
          className="w-full"
          icon={RotateCcw}
          loading={resetBusy}
          onClick={resetDemo}
        >
          Load a fresh account
        </Button>
        <Button variant="quiet" className="w-full" icon={LogOut} loading={outBusy} onClick={signOut}>
          Sign out
        </Button>
      </div>
    </div>
  ) : null

  const formCard = (
    <>
      <div className="pressable mb-5 p-1">
        {/* scopes, not content types — no icons on these tabs */}
        <Tabs
          tabs={[
            { key: 'signin', label: 'Sign in' },
            { key: 'signup', label: 'Create account' },
          ]}
          value={mode}
          onChange={switchMode}
        />
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field
          id="auth-name"
          label="Full name"
          icon={User}
          autoComplete="name"
          placeholder="Chaitanya"
          value={form.name}
          onChange={set('name')}
          error={errors.name}
        />

        {mode === 'signup' && (
          <Field
            id="auth-college"
            label="College or organisation"
            icon={GraduationCap}
            autoComplete="organization"
            placeholder="VIT Chennai"
            value={form.college}
            onChange={set('college')}
            hint="Optional — it only labels the leaderboard."
          />
        )}

        <Field
          id="auth-email"
          label="Email address"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="you@college.edu"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
        />

        <Field
          id="auth-password"
          label="Password"
          icon={Lock}
          type={showPw ? 'text' : 'password'}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          placeholder="At least 6 characters"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          right={
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-fg-dim transition-colors hover:bg-white/10 hover:text-fg"
            >
              {showPw ? <EyeOff size={15} strokeWidth={2.2} /> : <Eye size={15} strokeWidth={2.2} />}
            </button>
          }
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-caption text-fg-muted">
            <input
              type="checkbox"
              checked={form.remember}
              onChange={setRemember}
              className="h-3.5 w-3.5 rounded border-white/20 bg-white/[0.06] accent-electric-500"
            />
            Remember me
          </label>
          <button
            type="button"
            onClick={forgotPassword}
            className="text-caption font-semibold text-electric-300 transition-colors hover:text-electric-200"
          >
            Forgot password?
          </button>
        </div>

        {/* demoted: the ONE primary on this screen is Enter Demo Mode */}
        <Button
          type="submit"
          variant="ghost"
          size="lg"
          loading={busy}
          iconRight={ArrowRight}
          className="w-full"
        >
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </Button>

        <p className="text-caption leading-relaxed text-fg-dim">
          Prototype authentication — accounts are stored on this device and are not a real login
          system. Nothing you type is sent anywhere, and there is no password to steal.
        </p>
      </form>
    </>
  )

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 sm:py-9">
      <div className="mx-auto w-full max-w-6xl">
        {/* ---------------------------------------------------------- header */}
        <motion.header {...rise(0)} className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-electric-500/15">
              <Scale size={17} className="text-electric-300" strokeWidth={2.3} />
            </span>
            <span className="text-[15px] font-extrabold tracking-[-0.02em]">LawLink</span>
          </Link>
          <Link to="/" className="chip transition-colors hover:bg-white/[0.08] hover:text-fg">
            Back to home
          </Link>
        </motion.header>

        {/* ----------------------------------------------------------- body */}
        <div className="mt-7 grid items-start gap-6 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-8">
          {/* ------------------------------------------ left: pitch + demo */}
          <div className="min-w-0 space-y-8">
            <motion.div {...rise(0.04)} className="hidden lg:block">
              <div className="eyebrow">Gamified legal literacy · India</div>
              <h1 className="t1 mt-3 max-w-lg">Know your rights before you need them.</h1>
              <p className="lead measure mt-4">
                Eight modules, forty real situations and a verified helpline directory — built so that
                someone who has never opened a single Act still knows exactly what to do in the first
                ten minutes of a problem.
              </p>
              <ol className="mt-6 divide-y divide-white/[0.05]">
                {PITCH.map((text, i) => (
                  <motion.li key={text} {...rise(0.1 + i * 0.05)} className="flex items-start gap-3 py-2.5">
                    <span className="eyebrow mt-0.5 w-4 shrink-0">0{i + 1}</span>
                    <span className="text-body leading-relaxed text-fg-muted">{text}</span>
                  </motion.li>
                ))}
              </ol>
            </motion.div>

            {/* ------------------------------- HACKATHON DEMO MODE — the focal */}
            <motion.div {...rise(0.1)}>
              <div className="sheet-lg sheet-focal p-5 sm:p-6">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-xp-400/[0.12]">
                    <Zap size={18} className="text-xp-300" strokeWidth={2.2} />
                  </span>
                  <div>
                    <div className="eyebrow text-xp-300">Hackathon demo mode</div>
                    <h2 className="t2 mt-1">Enter a finished account in one click</h2>
                  </div>
                </div>

                <p className="lead measure mt-4">
                  Load a fully-built account instantly — Level 4 Legal Explorer, 1,850 XP, 6-day streak,
                  4 badges, partially completed modules. No signup, no typing.
                </p>

                {/* preview strip — the state, visible before the click */}
                <div className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-4 border-y border-white/[0.06] py-4">
                  <div>
                    <div className="eyebrow mb-1.5">Total XP</div>
                    <Figure value={DEMO.progress.xp} size="xl" tone="xp" />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pb-1">
                    <LevelSeal
                      number={levelNumber(DEMO_LEVEL.level)}
                      name={DEMO_LEVEL.name}
                      sub={`${formatNumber(DEMO_LEVEL.into)} / ${formatNumber(DEMO_LEVEL.span)} XP into this level`}
                    />
                    <span className="flex items-center gap-1.5">
                      <Flame size={14} strokeWidth={2.2} className="text-warn" />
                      <span className="num">{DEMO.progress.streak.current}</span>
                      <span className="text-caption text-fg-dim">day streak</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="num">{DEMO_BADGE_COUNT}</span>
                      <span className="text-caption text-fg-dim">badges</span>
                    </span>
                  </div>
                </div>

                <ProgressBar
                  className="mt-4"
                  value={DEMO_LEVEL.pct}
                  variant="xp"
                  showLabel
                  label={`Level ${levelNumber(DEMO_LEVEL.level)} of ${levelNumber(LEVELS.length)} · ${formatNumber(DEMO_LEVEL.toNext)} XP to next`}
                />

                {/* the ONE primary button on this screen */}
                <Button
                  variant="primary"
                  size="lg"
                  icon={Zap}
                  loading={demoBusy}
                  onClick={enterDemo}
                  className="mt-5 w-full"
                >
                  Enter Demo Mode
                </Button>
                <Button
                  variant="quiet"
                  size="sm"
                  icon={RotateCcw}
                  loading={resetBusy}
                  onClick={resetDemo}
                  className="mt-2 w-full"
                >
                  Reset demo data
                </Button>
                <p className="mt-3 text-center text-caption leading-relaxed text-fg-dim">
                  The demo is a snapshot held on this device. Resetting restores it exactly, so you can
                  replay the same flow for the next person in the room.
                </p>
              </div>
            </motion.div>
          </div>

          {/* ------------------------------------------- right: the account */}
          <motion.div {...rise(0.14)} className="min-w-0">
            <Card className="p-4 sm:p-6">
              {profile ? (
                sessionCard
              ) : ready ? (
                formCard
              ) : (
                <div className="space-y-3 py-2">
                  <Skeleton className="h-9 w-full rounded-2xl" />
                  <Skeleton className="h-11 w-full" />
                  <Skeleton className="h-11 w-full" />
                  <Skeleton className="h-11 w-full" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              )}
            </Card>

            {/* trust rows — flat, no boxes */}
            <div className="mt-5 divide-y divide-white/[0.05] border-t border-white/[0.05]">
              {TRUST.map((t, i) => (
                <motion.div key={t.title} {...rise(0.18 + i * 0.05)} className="flex items-start gap-3 py-3">
                  <span className="num mt-0.5 w-4 shrink-0 text-fg-dim">0{i + 1}</span>
                  <div className="min-w-0">
                    <div className="t3">{t.title}</div>
                    <p className="caption mt-0.5">{t.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <p className="mt-5 flex items-start gap-2 text-caption leading-relaxed text-fg-dim">
              <Check size={12} className="mt-0.5 shrink-0 text-good" strokeWidth={2.6} />
              LawLink is legal-awareness education for India. It is not a lawyer and it does not give
              legal advice — read the{' '}
              <Link to="/about" className="text-electric-300 hover:underline">
                methodology page
              </Link>{' '}
              for exactly how the content is checked.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-caption text-fg-faint">
              <span className="flex items-center gap-1.5">
                <Target size={12} strokeWidth={2.2} />
                Scenario-first
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen size={12} strokeWidth={2.2} />
                India Code sources
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
