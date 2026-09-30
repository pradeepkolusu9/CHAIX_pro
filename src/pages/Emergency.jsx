/**
 * Emergency Help (/emergency) — calm, but urgent.
 *
 * Every number, name, authority and URL is rendered straight out of
 * ../data/resources.js; nothing is typed by hand, so a number can never drift
 * from its verified source. Red is used for the 112 hero and call buttons only.
 * The data carries no opening hours, so the only hours shown are the ones the
 * entry's own text states ("24x7") — nothing is invented.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Siren,
  Scale,
  Shield,
  HeartHandshake,
  FileWarning,
  BookOpen,
  Gavel,
  PhoneCall,
  ExternalLink,
  ArrowRight,
  Clock,
  ShieldCheck,
} from 'lucide-react'
import { IconBadge, DisclaimerNote, VerifiedDirectoryTag } from '../components/ui/index.jsx'
import { CATEGORIES, byCategory, DISCLAIMER, VERIFIED_ON } from '../data/resources.js'

const ease = [0.16, 1, 0.3, 1]

const ICONS = { Siren, Scale, Shield, HeartHandshake, FileWarning, BookOpen }
const SECTION_KEYS = ['emergency', 'legalAid', 'women', 'child', 'report', 'learn']

/** Tile colour per category. Red is reserved for the hero + call buttons, so Emergency is ink. */
const TILE = { emergency: 'ink', legalAid: 'electric', women: 'violet', child: 'warn', report: 'xp', learn: 'good' }

const CALL_SCRIPT = [
  'Stay calm and speak slowly. The operator needs details, not emotion — you will not be judged.',
  'Give your exact location: the area or landmark, and the name of your nearest police station or hospital. Share your live location if you are able.',
  'Describe what happened in order: what you saw, who was involved, and when it started.',
  'Ask for the complaint or FIR number. Write it down, with the time you called, before you hang up.',
  'Ask how to follow up — which police station holds the FIR, the officer’s name, and the next step.',
]

const host = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

const niceDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

/* ------------------------------------------------------------ helpline card */
function HelplineCard({ r, catKey }) {
  const Icon = ICONS[CATEGORIES[catKey].icon]
  const urgent = catKey === 'emergency'
  const allDay = /24\s?x\s?7/i.test(r.about)
  return (
    <div className="sheet flex h-full flex-col p-5">
      <div className="flex items-start gap-3">
        <IconBadge icon={Icon} tone={TILE[catKey]} />
        <div className="min-w-0 flex-1">
          <h3 className="t3">{r.name}</h3>
          {allDay && (
            <span className="chip-good mt-1.5">
              <Clock size={11} strokeWidth={2.4} />
              24×7
            </span>
          )}
        </div>
      </div>

      {r.number && <div className="num-xl mt-4 text-[44px] leading-none">{r.number}</div>}
      <p className="copy mt-3 flex-1">{r.about}</p>

      <p className="caption mt-3">
        {r.source} ·{' '}
        <a href={r.sourceUrl} target="_blank" rel="noreferrer noopener" className="font-semibold text-electric-300 hover:underline">
          {host(r.sourceUrl)}
        </a>
      </p>

      {r.number ? (
        <a
          href={`tel:${r.number}`}
          className={`${urgent ? 'btn-danger' : 'btn-ghost'} mt-4 w-full justify-center`}
        >
          <PhoneCall size={15} strokeWidth={2.3} />
          Call {r.number}
          <span className="sr-only"> — {r.name}</span>
        </a>
      ) : (
        <a
          href={r.sourceUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="btn-ghost mt-4 w-full justify-center"
        >
          <ExternalLink size={15} strokeWidth={2.3} />
          Open official site
        </a>
      )}
    </div>
  )
}

/* -------------------------------------------------------------- the page */
export default function Emergency() {
  const [active, setActive] = useState(SECTION_KEYS[0])

  const rows = useMemo(
    () => [...byCategory(active)].sort((a, b) => (b.number ? 1 : 0) - (a.number ? 1 : 0)),
    [active],
  )
  const cat = CATEGORIES[active]

  const onKey = (e) => {
    const i = SECTION_KEYS.indexOf(active)
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = SECTION_KEYS[(i + step + SECTION_KEYS.length) % SECTION_KEYS.length]
    setActive(next)
    document.getElementById(`tab-${next}`)?.focus()
  }

  return (
    <div className="space-y-16 pb-4">
      {/* ================================================= hero */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease }}
        className="sheet-lg sheet-focal p-6 sm:p-10"
      >
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div className="min-w-0">
            <div className="eyebrow">Emergency help</div>
            <h1 className="t1 mt-3">If someone is in danger, call first.</h1>
            <p className="lead measure mt-3">
              One free number connects police, fire and ambulance from any mobile network. Everything
              else on this page can wait.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <VerifiedDirectoryTag date={niceDate(VERIFIED_ON)} />
              <span className="chip">Free · any network</span>
            </div>
          </div>

          <div className="flex flex-col items-start gap-5 lg:items-center lg:text-center">
            <div className="num-xl text-[112px] leading-[0.85] text-danger sm:text-[144px]" aria-label="One one two">
              112
            </div>
            <a href="tel:112" className="btn-danger btn-lg w-full justify-center sm:w-auto lg:min-w-[280px]">
              <PhoneCall size={18} strokeWidth={2.4} />
              Call 112 now
            </a>
          </div>
        </div>
      </motion.section>

      {/* ================================================= directory */}
      <section>
        <div className="mb-6">
          <div className="eyebrow mb-2">Helpline directory</div>
          <h2 className="t1">Find the right line</h2>
          <p className="copy mt-2">
            Checked against each operator’s own publication on {niceDate(VERIFIED_ON)}. Helplines
            change — confirm on the official site before you rely on one.
          </p>
        </div>

        {/* segmented control */}
        <div
          role="tablist"
          aria-label="Helpline categories"
          onKeyDown={onKey}
          className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
        >
          {SECTION_KEYS.map((key) => {
            const on = active === key
            const Icon = ICONS[CATEGORIES[key].icon]
            return (
              <button
                key={key}
                id={`tab-${key}`}
                role="tab"
                type="button"
                aria-selected={on}
                aria-controls="helpline-panel"
                tabIndex={on ? 0 : -1}
                onClick={() => setActive(key)}
                className={`flex min-h-[44px] shrink-0 items-center gap-2 whitespace-nowrap rounded-2xl px-4 font-sans text-body font-semibold transition-all duration-200 ${
                  on
                    ? 'bg-pure text-electric-300 shadow-sheet ring-1 ring-electric-500/25'
                    : 'text-fg-dim hover:bg-white/[0.05] hover:text-fg'
                }`}
              >
                <Icon size={16} strokeWidth={2.2} />
                {CATEGORIES[key].label}
              </button>
            )
          })}
        </div>

        <p className="copy mt-4">{cat.blurb}</p>

        <div id="helpline-panel" role="tabpanel" aria-labelledby={`tab-${active}`} className="mt-5">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {rows.map((r) => (
                <HelplineCard key={r.id} r={r} catKey={active} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ================================================= what to say */}
      <section className="grid gap-8 lg:grid-cols-[5fr_7fr]">
        <div>
          <div className="eyebrow mb-2">Practical</div>
          <h2 className="t1">What to say when you call</h2>
          <p className="copy mt-3">
            Operators are ordinary people on a hard shift. Clear, ordered facts get you help faster
            than emotion does.
          </p>
        </div>
        <ol className="space-y-3">
          {CALL_SCRIPT.map((line, i) => (
            <li key={line} className="sheet flex items-start gap-4 p-4">
              <span className="tile tile-electric num h-9 w-9 rounded-xl">{i + 1}</span>
              <p className="copy pt-1">{line}</p>
            </li>
          ))}
          <li className="copy px-1 pt-2">
            For financial fraud, 1930 is the national cyber crime line — use it alongside 112, never
            instead of it, if someone is in danger right now.
          </li>
        </ol>
      </section>

      {/* ================================================= legal aid */}
      <section id="legal-aid" className="sheet-lg scroll-mt-24 p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <IconBadge icon={Gavel} tone="electric" size="lg" />
          <div className="min-w-0 space-y-3">
            <div className="eyebrow">Entitlement, not charity</div>
            <h2 className="t2">Free legal aid is something you are owed</h2>
            <p className="lead measure">
              Under section 12(c) of the Legal Services Authorities Act, 1987, every woman and every
              child in India is entitled to free legal services — as are people in custody, industrial
              workmen, victims of trafficking and mass disaster victims.
            </p>
            <p className="copy measure">
              Every state and district has a Legal Services Authority with legal aid clinics and court
              support. Where a dispute can settle, ask for a{' '}
              <strong className="font-semibold text-fg">Lok Adalat</strong> — its award is deemed a
              decree of a civil court.
            </p>
            <a
              href="https://nalsa.gov.in"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 font-sans text-body font-semibold text-electric-300 hover:underline"
            >
              nalsa.gov.in — find your district authority
              <ExternalLink size={13} strokeWidth={2.4} />
            </a>
          </div>
        </div>
      </section>

      {/* ================================================= limits */}
      <section>
        <div className="flex items-center gap-3">
          <IconBadge icon={ShieldCheck} tone="good" size="sm" />
          <h2 className="t2">Before you rely on a number</h2>
        </div>
        <ul className="copy mt-4 max-w-[68ch] list-disc space-y-2 pl-5">
          <li>
            Every entry was last checked on {niceDate(VERIFIED_ON)}. Helplines merge, move and stop
            working — re-check against the official site linked on its card.
          </li>
          <li>
            Nothing here is invented or rounded. Where a service has no single national number, the
            card links to the official portal instead.
          </li>
          <li>
            Coverage varies by state. 112 works everywhere; a state line that is not answering is a
            reason to call 112, not to wait.
          </li>
          <li>
            Spotted a change? Tell the department that publishes it — LawLink re-checks after they
            update. There is no submission form, because a wrong number on an emergency page is worse
            than none.
          </li>
        </ul>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
          <Link to="/about" className="inline-flex items-center gap-1.5 font-sans text-body font-semibold text-electric-300 hover:underline">
            How LawLink verifies content
            <ArrowRight size={13} strokeWidth={2.4} />
          </Link>
          <a
            href="https://www.indiacode.nic.in"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 font-sans text-body font-semibold text-electric-300 hover:underline"
          >
            India Code — official text of central laws
            <ExternalLink size={13} strokeWidth={2.4} />
          </a>
        </div>
        <DisclaimerNote text={DISCLAIMER} className="mt-6" />
      </section>
    </div>
  )
}
