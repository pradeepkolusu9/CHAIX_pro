/**
 * Reward FX — the "moments". Kept separate from the UI kit because these are
 * event-driven, one-shot and must never be imported by data modules.
 *
 * v2 notes (docs/council/04 §9 and §10):
 *   - The level-up is staged as ONE ~2.5s event (settled well inside 3.5s so it
 *     can never slow a live demo): seal → number → name → unlocks → continue.
 *   - 18 particles from the top of the card, and a second 24 only if something
 *     actually unlocked. Particles are the one place a glow is earned.
 *   - `animate-flame` is gone from the streak popup: a `Flame` lucide icon sits
 *     40px to its left, two flame marks read as two products, and motion must
 *     never run on a mark.
 *   - No infinite loop lives in this file. None of the four is allowed one.
 */
import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, X, Check, PartyPopper } from 'lucide-react'
import { useActions } from '../../lib/store.jsx'
import { useBurst } from '../../lib/hooks.js'
import { useAnnounce } from '../../lib/announce.jsx'
import { levelNumber } from '../../lib/gamification.js'
import { formatNumber } from '../../lib/dates.js'
import { Button } from '../ui/Button.jsx'
import { Sigil } from '../ui/Sigil.jsx'

const ease = [0.16, 1, 0.3, 1]
const press = [0.2, 0, 0, 1]

/* ------------------------------------------------------------------ XP pop */
function XpBurst({ effect }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 0, scale: 0.9 }}
      animate={{ opacity: [0, 1, 1, 0], y: -64, scale: [0.9, 1.04, 1, 0.96] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.9, ease: 'easeOut' }}
      className="pointer-events-none fixed left-1/2 top-[22%] z-[120] -translate-x-1/2"
    >
      {/* an earned glow is allowed here — gold is "value earned" and it just arrived */}
      <div className="overlay-panel relative overflow-hidden rounded-2xl px-4 py-2.5 text-center shadow-glow-xp">
        <div className="num-lg text-xp-300">+{formatNumber(effect.amount)} XP</div>
        {effect.reason && <div className="caption mt-0.5">{effect.reason}</div>}
        {/* one gold sweep across the burst, once */}
        <motion.span
          aria-hidden="true"
          initial={{ x: '-120%' }}
          animate={{ x: '320%' }}
          transition={{ delay: 0.12, duration: 0.7, ease: 'linear' }}
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-xp-200/25 to-transparent"
        />
      </div>
    </motion.div>
  )
}

/* -------------------------------------------------------------- Level up */
function LevelUpModal({ effect, onClose }) {
  /* Each particle lives 1.2s, so the moment is visually settled by ~2.5s — well
     inside the 3.5s a live demo can afford. The hook's clear timer must outlive
     BOTH volleys (420 + 1300 + 1200), or the first timer would cut the second
     one off at 1.6s. It only unmounts nodes; nothing else waits on it. */
  const { parts, fire } = useBurst(2600)
  const to = effect.to
  const btnRef = useRef(null)

  useEffect(() => {
    /* 420ms — burst one, from the top of the card */
    const t1 = setTimeout(() => fire(18), 420)
    /* 1300ms — burst two, only if there is something to celebrate */
    const hasUnlocks = (effect.unlocks?.length ?? 0) > 0
    const t2 = hasUnlocks ? setTimeout(() => fire(24), 1300) : null
    /* 1200ms — the door is open and focused, so Enter dismisses */
    const t3 = setTimeout(() => btnRef.current?.focus(), 1200)
    return () => {
      clearTimeout(t1)
      if (t2) clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [fire, effect.unlocks])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.18 } }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
    >
      {/* scrim first: the world goes away before the modal arrives.
          90, not 88 — Tailwind only ships opacity steps of 5, and an unknown
          step compiles to nothing at all. */}
      <div className="absolute inset-0 bg-surface-0/90" />

      {/* particles — emitted at the top edge of the card, where people look */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {parts.map((p) => (
          <motion.span
            key={p.id}
            initial={{ x: '50%', y: '38%', opacity: 1, scale: 1 }}
            animate={{
              x: `calc(50% + ${p.x * 9}px)`,
              y: `calc(38% + ${p.y * 13}px)`,
              opacity: 0,
              scale: 0.4,
              rotate: p.rot,
            }}
            transition={{ duration: 1.2, delay: p.delay, ease: 'easeOut' }}
            className="absolute rounded-[2px]"
            style={{ width: p.size, height: p.size * 1.7, background: p.color }}
          />
        ))}
      </div>

      {/* overlay-panel is the modal surface; sheet-focal carries the ONE gradient */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.18 } }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        className="overlay-panel sheet-focal relative z-10 w-full max-w-md overflow-hidden rounded-3xl"
      >
        {/* the sweep — one time, over the whole card */}
        <motion.span
          aria-hidden="true"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ delay: 1.05, duration: 0.7, ease: 'linear' }}
          className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent"
        />

        <div className="relative px-7 pb-7 pt-8 text-center">
          {/* the accent hairline — it replaces the old "level up" eyebrow */}
          <motion.span
            aria-hidden="true"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            style={{ transformOrigin: 'left' }}
            transition={{ delay: 0.3, duration: 0.32, ease: press }}
            className="absolute inset-x-7 top-0 h-px bg-white/20"
          />

          {/* beat 1 — the seal. A level is a seal, not a headline. */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.12, duration: 0.26, ease }}
            className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-violet2-500/[0.10] ring-1 ring-inset ring-violet2-400/25"
          >
            <Sigil id="level-seal" size={40} className="text-violet2-300" />
          </motion.div>

          {/* beat 2 — the number SNAPS. It is a fact, not a counter. */}
          <motion.div
            initial={{ opacity: 0, scale: 1.14 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.38, duration: 0.26, ease }}
            className="num-xl mt-5"
          >
            {levelNumber(to.level)}
          </motion.div>

          {/* beat 3 — the name lands, tracking in */}
          <motion.h2
            initial={{ opacity: 0, y: 10, letterSpacing: '0.22em' }}
            animate={{ opacity: 1, y: 0, letterSpacing: '0.02em' }}
            transition={{ delay: 0.62, duration: 0.42, ease }}
            className="t2 mt-1.5"
          >
            {to.name}
          </motion.h2>

          {/* beat 4 — where the bar now sits */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.3 }}
            className="mt-5"
          >
            <div className="track h-1.5">
              <div className="track-fill-xp h-full w-full" />
            </div>
            <div className="mt-2 flex justify-between">
              <span className="eyebrow tnum">{formatNumber(to.xp)} XP total</span>
              <span className="eyebrow">
                {to.isMax ? 'Maximum level' : `${formatNumber(to.toNext)} XP to next level`}
              </span>
            </div>
          </motion.div>

          {effect.unlocks?.length > 0 && (
            <motion.ul
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.09, delayChildren: 0.82 } } }}
              className="mt-6 divide-y divide-white/[0.05] border-t border-white/[0.05] text-left"
            >
              {effect.unlocks.map((u) => (
                <motion.li
                  key={u}
                  variants={{
                    hidden: { opacity: 0, x: -10 },
                    show: { opacity: 1, x: 0, transition: { duration: 0.24, ease } },
                  }}
                  className="flex items-center gap-2.5 py-2.5"
                >
                  <Check size={14} className="shrink-0 text-fg-dim" strokeWidth={3} />
                  <span className="copy min-w-0 flex-1">{u}</span>
                </motion.li>
              ))}
            </motion.ul>
          )}

          {/* beat 5 — the door opens last, so the reward is read first */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.15, duration: 0.26, ease }}
            className="mt-7"
          >
            <Button ref={btnRef} variant="primary" className="w-full" onClick={onClose}>
              Continue your journey
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ----------------------------------------------------------- Badge unlock */
function BadgeUnlock({ effect, onClose }) {
  const b = effect.badge
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.18 } }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-surface-0/85" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.18 } }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        className="overlay-panel relative z-10 w-full max-w-sm overflow-hidden rounded-3xl"
      >
        <div className="px-7 pb-7 pt-8 text-center">
          <div className="eyebrow mb-4">Badge unlocked</div>

          {/* the mark you earned, in the gold badge treatment */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 18 }}
            className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-xp-400/[0.12] text-xp-300 ring-1 ring-inset ring-xp-400/25"
          >
            <Sigil id={b.id} size={40} />
          </motion.div>

          <h3 className="t2 mt-5">{b.name}</h3>
          <p className="copy measure mx-auto mt-1.5">{b.desc}</p>

          <Button variant="primary" className="mt-6 w-full" onClick={onClose}>
            Nice
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ---------------------------------------------------------------- Streak */
function StreakPop({ effect, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease }}
      className="fixed bottom-24 left-1/2 z-[115] w-full max-w-xs -translate-x-1/2 px-4 sm:bottom-8"
    >
      <div className="overlay-panel flex items-center gap-3 rounded-2xl p-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-warn/[0.12] text-warn">
          {/* no animation on a mark — and no second flame beside this one */}
          <Flame size={20} strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="t3">{effect.days} day streak</div>
          <div className="caption">Streak bonus awarded</div>
        </div>
        <div className="num shrink-0 text-xp-300">+{formatNumber(effect.amount)}</div>
        <button onClick={onClose} className="shrink-0 text-fg-dim hover:text-fg" aria-label="Dismiss">
          <X size={14} />
        </button>
      </div>
    </motion.div>
  )
}

/* ----------------------------------------------------------- EffectsHost */
export function EffectsHost() {
  const { effects, dismissEffect } = useActions()
  const say = useAnnounce()

  /* Every reward is an invisible-to-sighted state change for a screen reader.
     Without this the whole gamification layer — the thing the product is about —
     is silent. */
  useEffect(() => {
    for (const e of effects) {
      if (e.kind === 'xp') say(`Earned ${e.amount} XP. ${e.reason || ''}`.trim())
      else if (e.kind === 'levelup') say(`Level up. You are now level ${e.to.level}, ${e.to.name}.`)
      else if (e.kind === 'badge') say(`Badge unlocked: ${e.badge.name}. ${e.badge.desc}`)
      else if (e.kind === 'streak') say(`${e.days} day streak. Bonus of ${e.amount} XP awarded.`)
    }
  }, [effects, say])

  return (
    <AnimatePresence>
      {effects.map((e) => {
        if (e.kind === 'levelup')
          return <LevelUpModal key={e.id} effect={e} onClose={() => dismissEffect(e.id)} />
        if (e.kind === 'badge')
          return <BadgeUnlock key={e.id} effect={e} onClose={() => dismissEffect(e.id)} />
        if (e.kind === 'streak')
          return <StreakPop key={e.id} effect={e} onClose={() => dismissEffect(e.id)} />
        if (e.kind === 'xp') return <XpBurst key={e.id} effect={e} />
        return null
      })}
    </AnimatePresence>
  )
}

/* ------------------------------------------------------------- ToastHost */
const TOAST_TONES = {
  default: 'ring-white/[0.08]',
  xp: 'ring-xp-400/25',
  good: 'ring-good/25',
  electric: 'ring-electric-500/25',
  danger: 'ring-danger/25',
}

export function ToastHost() {
  const { toasts } = useActions()
  const say = useAnnounce()
  const last = useRef(null)

  /* Toasts are also pure state changes — the whole "demo mode loaded" /
     "progress reset" feedback was invisible to a screen reader. */
  useEffect(() => {
    const newest = toasts[toasts.length - 1]
    if (newest && newest !== last.current) {
      last.current = newest
      say(`${newest.title}. ${newest.body || ''}`.trim())
    }
  }, [toasts, say])

  return (
    <div className="pointer-events-none fixed bottom-20 left-1/2 z-[100] w-full max-w-sm -translate-x-1/2 space-y-2 px-4 sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease }}
            className={`overlay-panel pointer-events-auto flex items-start gap-2.5 rounded-2xl p-3.5 ring-1 ring-inset ${
              TOAST_TONES[t.tone] || TOAST_TONES.default
            }`}
          >
            <PartyPopper size={15} className="mt-0.5 shrink-0 text-fg-dim" strokeWidth={2.2} />
            <div className="min-w-0">
              <div className="t3">{t.title}</div>
              {t.body && <div className="caption mt-0.5">{t.body}</div>}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
