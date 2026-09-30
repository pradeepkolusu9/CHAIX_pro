/**
 * Auth — /login
 *
 * Public page (PublicShell: bare canvas, no sidebar).
 * Desktop: luminous brand panel left, form right. Mobile: the brand panel is dropped and
 * the right column stacks as demo card -> form.
 * The ONE primary action is "Try the demo". Sign-in is an honest local prototype.
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
  Scale,
  Flame,
  RotateCcw,
  LogOut,
  AlertCircle,
  Target,
  ShieldCheck,
  Trophy,
} from 'lucide-react'
import { useStore, useActions, demoState } from '../lib/store.jsx'
import { Skeleton, Button, IconBadge, ProgressBar, formatNumber } from '../components/ui/index.jsx'
import { levelForXp, levelNumber } from '../lib/gamification.js'

const EASE = [0.16, 1, 0.3, 1]
const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: EASE, delay },
})

/* Read straight from the demo snapshot so the preview matches what you get. */
const DEMO = demoState()
const DEMO_LEVEL = levelForXp(DEMO.progress.xp)

const BENEFITS = [
  { icon: Target, tone: 'electric', title: 'Scenarios, not lectures', body: 'Make the call first, then read the law behind it.' },
  { icon: ShieldCheck, tone: 'good', title: 'Every answer cites its source', body: 'The Act, the section and an official link.' },
  { icon: Trophy, tone: 'xp', title: 'A habit that sticks', body: 'XP, levels and streaks keep you coming back.' },
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const REMEMBER_KEY = 'lawlink:v1:remember'

/* ------------------------------------------------------------------- fields */
function Field({ id, label, icon: Icon, error, hint, right, ...rest }) {
  const msgId = `${id}-msg`
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-caption font-semibold text-fg">
        {label}
      </label>
      <div className="relative">
        <Icon
          size={16}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-fg-dim"
          strokeWidth={2.2}
        />
        <input
          id={id}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error || hint ? msgId : undefined}
          className={`pressable min-h-[48px] w-full py-3 pl-11 pr-11 text-body text-fg outline-none placeholder:text-fg-faint focus:ring-2 focus:ring-inset focus:ring-electric-500/50 ${
            error ? 'ring-2 ring-inset ring-danger/50' : ''
          }`}
          {...rest}
        />
        {right}
      </div>
      {error ? (
        <p id={msgId} role="alert" className="mt-1.5 flex items-center gap-1.5 text-caption font-medium text-danger">
          <AlertCircle size={13} strokeWidth={2.4} />
          {error}
        </p>
      ) : hint ? (
        <p id={msgId} className="mt-1.5 text-caption text-fg-dim">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

function validate(form) {
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
      title: 'No password reset here',
      body: 'Accounts live on this device only, so there is no email to reset. Use "Reset all progress" in your profile instead.',
    })

  const onSubmit = async (e) => {
    e.preventDefault()
    const found = validate(form)
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
    <div className="space-y-6 text-center">
      <IconBadge icon={UserCheck} tone="good" size="lg" className="mx-auto" />
      <div>
        <div className="eyebrow">Signed in on this device</div>
        <h2 className="t1 mt-2">{profile.name}</h2>
        <p className="copy mt-1">{profile.email || 'No email on this account'}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="chip-electric">
          Level {levelNumber(level.level)} · {level.name}
        </span>
        <span className="chip-xp">{formatNumber(impact.xp)} XP</span>
        <span className="chip-warn">
          <Flame size={11} strokeWidth={2.4} />
          {impact.streak}-day streak
        </span>
      </div>
      <div className="space-y-2">
        <Button as={Link} to="/dashboard" variant="primary" size="lg" className="w-full" iconRight={ArrowRight}>
          Continue to Dashboard
        </Button>
        <Button variant="quiet" className="w-full" icon={RotateCcw} loading={resetBusy} onClick={resetDemo}>
          Load the demo account
        </Button>
        <Button variant="quiet" className="w-full" icon={LogOut} loading={outBusy} onClick={signOut}>
          Sign out
        </Button>
      </div>
    </div>
  ) : null

  const formCard = (
    <>
      <div className="inset mb-6 grid grid-cols-2 gap-1 p-1" role="group" aria-label="Account mode">
        {[
          ['signin', 'Sign in'],
          ['signup', 'Create account'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={mode === key}
            onClick={() => switchMode(key)}
            className={`min-h-[44px] rounded-xl px-3 font-sans text-body font-semibold transition-all ${
              mode === key ? 'bg-pure text-electric-300 shadow-sheet' : 'text-fg-dim hover:text-fg'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <h2 className="t2">{mode === 'signin' ? 'Welcome back' : 'Start your streak'}</h2>
      <p className="copy mb-6 mt-1">
        {mode === 'signin' ? 'Pick up where you left off.' : 'Takes ten seconds. No card, no email confirmation.'}
      </p>

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
            hint="Optional. It only labels the leaderboard."
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
              className="absolute right-1.5 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-xl text-fg-dim transition-colors hover:bg-white/10 hover:text-fg"
            >
              {showPw ? <EyeOff size={16} strokeWidth={2.2} /> : <Eye size={16} strokeWidth={2.2} />}
            </button>
          }
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 text-caption text-fg-muted">
            <input
              type="checkbox"
              checked={form.remember}
              onChange={setRemember}
              className="h-4 w-4 rounded accent-electric-500"
            />
            Remember me
          </label>
          <button
            type="button"
            onClick={forgotPassword}
            className="min-h-[44px] text-caption font-semibold text-electric-300 transition-colors hover:text-electric-700"
          >
            Forgot password?
          </button>
        </div>

        {/* secondary weight: the one primary on the page is the demo */}
        <Button type="submit" variant="ghost" size="lg" loading={busy} iconRight={ArrowRight} className="w-full">
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </Button>

        <p className="text-center text-caption leading-relaxed text-fg-dim">
          This is a local prototype. Your account stays on this device and nothing you type is sent anywhere.
        </p>
      </form>
    </>
  )

  const demoCard = (
    <motion.div {...rise(0.08)} className="sheet-lg sheet-focal p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <IconBadge icon={Zap} tone="xp" size="md" />
        <div className="min-w-0">
          <h2 className="t2">Try the demo, no signup</h2>
          <p className="caption mt-0.5">A finished account, one click away.</p>
        </div>
      </div>
      <Button variant="primary" size="lg" icon={Zap} loading={demoBusy} onClick={enterDemo} className="mt-5 w-full">
        Enter Demo Mode
      </Button>
      <div className="mt-3 text-center">
        <button
          type="button"
          onClick={resetDemo}
          disabled={resetBusy}
          className="min-h-[44px] px-3 text-caption font-semibold text-fg-dim underline-offset-2 transition-colors hover:text-electric-300 hover:underline disabled:opacity-50"
        >
          {resetBusy ? 'Resetting…' : 'Reset demo data'}
        </button>
      </div>
    </motion.div>
  )

  return (
    <div className="min-h-screen px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-6xl">
        <motion.header {...rise(0)} className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="tile tile-solid h-9 w-9 rounded-xl">
              <Scale size={17} strokeWidth={2.3} />
            </span>
            <span className="text-[15px] font-extrabold tracking-[-0.02em]">LawLink</span>
          </Link>
          <Link to="/" className="btn-quiet btn-sm">
            Back to home
          </Link>
        </motion.header>

        <div className="mt-6 grid items-stretch gap-6 lg:mt-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-10">
          {/* ------------------------------------------- left: luminous brand panel */}
          <motion.aside
            {...rise(0.04)}
            className="relative hidden min-w-0 flex-col justify-between gap-10 overflow-hidden rounded-[32px] bg-gradient-to-br from-electric-100 via-pure to-xp-200/70 p-10 shadow-sheet-lg lg:flex"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet2-400/25 blur-3xl"
            />
            <div className="relative">
              <div className="eyebrow">Legal literacy for India</div>
              <h1 className="t1 mt-3 max-w-md text-[40px] leading-[1.05]">Know your rights before you need them.</h1>
              <ul className="mt-9 space-y-5">
                {BENEFITS.map((b, i) => (
                  <motion.li key={b.title} {...rise(0.12 + i * 0.06)} className="flex items-start gap-4">
                    <IconBadge icon={b.icon} tone={b.tone} size="md" />
                    <div>
                      <div className="t3">{b.title}</div>
                      <p className="copy mt-0.5">{b.body}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* mini profile card: the demo account */}
            <motion.div {...rise(0.3)} className="sheet relative max-w-sm p-5">
              <div className="flex items-center gap-3">
                <span className="tile tile-violet h-11 w-11 rounded-2xl text-t3 font-bold">
                  {DEMO.profile.name.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="t3 truncate">{DEMO.profile.name}</div>
                  <div className="caption truncate">
                    Level {levelNumber(DEMO_LEVEL.level)} · {DEMO_LEVEL.name}
                  </div>
                </div>
                <span className="chip-warn">
                  <Flame size={11} strokeWidth={2.4} />
                  {DEMO.progress.streak.current}
                </span>
              </div>
              <ProgressBar className="mt-4" value={DEMO_LEVEL.pct} variant="xp" />
              <div className="mt-2 flex items-center justify-between">
                <span className="num text-xp-300">{formatNumber(DEMO.progress.xp)} XP</span>
                <span className="caption">{formatNumber(DEMO_LEVEL.toNext)} to next level</span>
              </div>
            </motion.div>
          </motion.aside>

          {/* -------------------------------------------- right: demo + form */}
          <div className="mx-auto flex w-full min-w-0 max-w-[480px] flex-col gap-5 lg:max-w-none lg:justify-center">
            {!profile && demoCard}

            <motion.div {...rise(0.14)} className="sheet p-5 sm:p-8">
              {profile ? (
                sessionCard
              ) : ready ? (
                formCard
              ) : (
                <div className="space-y-3 py-2">
                  <Skeleton className="h-11 w-full rounded-2xl" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-14 w-full rounded-2xl" />
                </div>
              )}
            </motion.div>

            <p className="text-center text-caption leading-relaxed text-fg-dim">
              LawLink is legal-awareness education, not legal advice.{' '}
              <Link to="/about" className="font-semibold text-electric-300 hover:underline">
                How we check our content
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
