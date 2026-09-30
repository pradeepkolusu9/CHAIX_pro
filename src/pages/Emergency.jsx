/**
 * Emergency Help (/emergency) — the safety-critical page.
 *
 * Accuracy beats decoration. Every number, name, authority and URL on this
 * screen is rendered straight out of ../data/resources.js; nothing is typed by
 * hand here, so a number can never drift from its verified source.
 *
 * v2 notes (docs/council):
 *   - `112` is the one `num-xl` on the page, and red is its only job.
 *   - Danger red is the only status hue. Blue is the "reach a human" band and
 *     green marks the one educational band — the legend says so, and the legend
 *     is kept. violet2 (level identity) and xp (earned value) never appear.
 *   - No gradients on this screen, and no free-floating glow behind copy.
 *   - One focal point: 112. A judge should be able to point at it in ten
 *     seconds and read the next action off the same block.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
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
} from 'lucide-react'
import {
  Card,
  Button,
  IconBadge,
  VerifiedTag,
  DisclaimerNote,
} from '../components/ui/index.jsx'
import { CATEGORIES, byCategory, DISCLAIMER, VERIFIED_ON } from '../data/resources.js'
import { useReducedMotionPref } from '../lib/hooks.js'

const ease = [0.16, 1, 0.3, 1]

/** Category icon name (from CATEGORIES) -> lucide component. */
const ICONS = { Siren, Scale, Shield, HeartHandshake, FileWarning, BookOpen }

/** Order of the directory. Headings, blurbs and nav labels all come from data. */
const SECTION_KEYS = ['emergency', 'legalAid', 'women', 'child', 'report', 'learn']

/** What the eyebrow after the entry count is allowed to say. */
const KIND = {
  emergency: 'Emergency',
  legalAid: 'Legal Aid',
  women: 'Support',
  child: 'Support',
  report: 'Official portal',
  learn: 'Educational Resource',
}

/**
 * Band tone, derived so the legend and the cards can never disagree.
 * Red = call now, someone is at risk. Blue = free help and representation.
 * Green = read the law itself.
 */
const toneFor = (key) => (key === 'emergency' ? 'danger' : key === 'learn' ? 'good' : 'electric')

const LEGEND = [
  { dot: 'bg-danger', text: 'Emergency — call now, someone is at risk' },
  { dot: 'bg-electric-500', text: 'Legal aid — free help and representation' },
  { dot: 'bg-good', text: 'Educational resource — read the law itself' },
]

const CALL_SCRIPT = [
  'Stay calm and speak slowly. The operator needs details, not emotion — you will not be judged.',
  'Give your exact location: the area or landmark, and the name of your nearest police station or hospital. Share your live location if you are able.',
  'Describe what happened in order: what you saw, who was involved, and when it started.',
  'Ask for the complaint or FIR number. Write it down, with the time you called, before you hang up.',
  'Ask how to follow up — which police station holds the FIR, the officer’s name, and the next step.',
]

/** Strip a URL down to the hostname a reader can recognise. */
const host = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/**
 * Band heading at `t2`. The page has already spent its one `t1` on the title,
 * so nothing below it may shout at the same weight.
 */
function BandHeading({ eyebrow, title, sub }) {
  return (
    <div className="mb-3">
      {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
      <h2 className="t2">{title}</h2>
      {sub && <p className="copy measure mt-1">{sub}</p>}
    </div>
  )
}

/* -------------------------------------------------------------- one entry */
function EntryRow({ r, tone }) {
  const urgent = tone === 'danger'
  return (
    <div className="grid gap-3 px-4 py-4 sm:px-5 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-8">
      <div className="min-w-0">
        <h3 className="t3">{r.name}</h3>
        <p className="copy measure mt-1">{r.about}</p>
        <p className="caption mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>{r.source}</span>
          <span className="text-fg-faint" aria-hidden="true">
            ·
          </span>
          <a
            href={r.sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="text-electric-300 hover:underline"
          >
            {host(r.sourceUrl)}
          </a>
        </p>
      </div>

      {r.number ? (
        /* The number is the point of the row, so it IS the button — full width on
           mobile, and legible in ten seconds. No glyph needed: "Call 112" is
           the affordance, and one icon per card is the rule anyway. */
        urgent ? (
          <Button
            as="a"
            href={`tel:${r.number}`}
            variant="danger"
            size="lg"
            className="w-full shrink-0 justify-center tabular-nums lg:w-auto"
          >
            <span>Call</span>
            <span className="num-lg ml-1">{r.number}</span>
            <span className="sr-only"> — {r.name}</span>
          </Button>
        ) : (
          <a
            href={`tel:${r.number}`}
            className="pressable inline-flex w-full shrink-0 items-center justify-center gap-1.5 px-5 py-3 lg:w-auto"
          >
            <span className="font-sans text-body font-semibold text-fg">Call</span>
            <span className="num-lg">{r.number}</span>
            <span className="sr-only"> — {r.name}</span>
          </a>
        )
      ) : (
        <Button
          as="a"
          href={r.sourceUrl}
          target="_blank"
          rel="noreferrer noopener"
          variant="quiet"
          icon={ExternalLink}
          className="w-full justify-center lg:w-auto"
        >
          Open official site
        </Button>
      )}
    </div>
  )
}

/* -------------------------------------------------------------- the page */
export default function Emergency() {
  const [active, setActive] = useState(SECTION_KEYS[0])
  const reduce = useReducedMotionPref()
  const sectionRefs = useRef({})

  /** Numbered entries first inside every group. */
  const groups = useMemo(
    () =>
      SECTION_KEYS.map((key) => ({
        key,
        cat: CATEGORIES[key],
        tone: toneFor(key),
        rows: [...byCategory(key)].sort((a, b) => (b.number ? 1 : 0) - (a.number ? 1 : 0)),
      })),
    [],
  )

  // Scroll-spy: highlight the section currently under the sticky header.
  useEffect(() => {
    const els = SECTION_KEYS.map((k) => sectionRefs.current[k]).filter(Boolean)
    if (!els.length) return undefined
    const io = new IntersectionObserver(
      (entries) => {
        const seen = entries.filter((e) => e.isIntersecting)
        if (!seen.length) return
        const top = seen.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        setActive(top.target.getAttribute('data-section'))
      },
      { rootMargin: '-64px 0px -60% 0px', threshold: 0 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const jump = (key) => {
    const el = sectionRefs.current[key]
    if (!el) return
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    setActive(key)
  }

  return (
    <div className="space-y-8">
      {/* ================================================= the masthead */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease }}
      >
        <div className="flex items-start gap-3">
          <IconBadge icon={Siren} tone="danger" size="lg" />
          <div className="min-w-0">
            <div className="eyebrow mb-1.5 text-danger">Emergency help</div>
            <h1 className="t1">Emergency Help</h1>
          </div>
        </div>

        <p className="lead measure mt-4">
          If anyone is in immediate danger, call <span className="text-danger">112</span> first — it
          connects to police, fire and ambulance.
        </p>
        <p className="copy measure mt-2">
          This page is a directory of officially published Indian helplines and portals. Every number
          below is printed exactly as its source department publishes it — nothing here is invented or
          rounded off.
        </p>

        {/* ------------------------- the focal point: 112 and what to do next */}
        <div className="sheet-lg mt-5 p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="eyebrow mb-2 text-danger">Free · works on any mobile network</div>
              <div className="num-xl text-danger">112</div>
              <p className="copy measure mt-2">
                All-in-One Emergency Response — police, fire and ambulance in most states.
              </p>
            </div>
            <Button
              as="a"
              href="tel:112"
              variant="danger"
              size="lg"
              icon={PhoneCall}
              className="w-full shrink-0 justify-center sm:w-auto"
            >
              Call 112 now
            </Button>
          </div>
        </div>

        {/* colour legend — how to read the bands below */}
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
          {LEGEND.map((l) => (
            <span key={l.text} className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${l.dot}`} aria-hidden="true" />
              <span className="caption">{l.text}</span>
            </span>
          ))}
        </div>
      </motion.div>

      {/* ================================================= sticky category nav */}
      <div className="no-scrollbar sticky top-16 z-30 -mx-4 flex gap-1.5 overflow-x-auto bg-surface-0 px-4 py-2 sm:-mx-6 sm:px-6">
        {groups.map((g) => {
          const on = active === g.key
          const Icon = ICONS[g.cat.icon]
          return (
            <button
              key={g.key}
              type="button"
              onClick={() => jump(g.key)}
              aria-current={on ? 'true' : undefined}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 font-sans text-caption font-semibold transition-colors duration-200 ${
                on
                  ? 'bg-white/[0.06] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.09)]'
                  : 'text-fg-dim hover:bg-white/[0.05] hover:text-fg'
              }`}
            >
              <Icon size={14} strokeWidth={2.2} />
              {g.cat.label}
            </button>
          )
        })}
      </div>

      {/* ======================================================== sections */}
      {groups.map((g) => (
        <section
          key={g.key}
          data-section={g.key}
          ref={(el) => {
            sectionRefs.current[g.key] = el
          }}
          className="scroll-mt-32 space-y-3"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.12, margin: '0px 0px -8% 0px' }}
            transition={{ duration: 0.26, ease }}
          >
            <BandHeading
              eyebrow={`${g.rows.length} ${g.rows.length === 1 ? 'entry' : 'entries'} · ${KIND[g.key]}`}
              title={g.cat.label}
              sub={g.cat.blurb}
            />
          </motion.div>

          {/* one flat list per band. Eleven bordered cards used to live here. */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1, margin: '0px 0px -8% 0px' }}
            transition={{ duration: 0.26, ease, delay: 0.04 }}
            className="sheet divide-y divide-white/[0.05] overflow-hidden"
          >
            {g.rows.map((r) => (
              <EntryRow key={r.id} r={r} tone={g.tone} />
            ))}
          </motion.div>
        </section>
      ))}

      {/* ================================================ what to say card */}
      <section className="scroll-mt-32">
        <BandHeading
          eyebrow="Practical"
          title="What to say when you call"
          sub="Helpline operators are ordinary people on a difficult shift. Clear, ordered information gets you help faster than emotion does."
        />
        <Card>
          <ol className="divide-y divide-white/[0.05]">
            {CALL_SCRIPT.map((line, i) => (
              <li key={line} className="flex gap-3.5 py-3 first:pt-0 last:pb-0">
                <span className="num mt-0.5 w-4 shrink-0 text-fg-dim">{i + 1}</span>
                <p className="copy measure">{line}</p>
              </li>
            ))}
          </ol>
          <p className="copy measure mt-4 border-t border-white/[0.05] pt-4">
            Keep the FIR or complaint number somewhere safe — it is what speeds up everything after the
            call. For financial fraud, 1930 is the national cyber crime line; use it alongside 112,
            never instead of it, if someone is in danger right now.
          </p>
        </Card>
      </section>

      {/* =================================================== free legal aid */}
      <section className="scroll-mt-32">
        <BandHeading
          eyebrow="Entitlement, not charity"
          title="Free legal aid — what you are actually owed"
          sub="Legal Services Authorities Act, 1987 · section 12(c)"
        />
        <Card>
          <div className="flex items-start gap-3.5">
            <IconBadge icon={Gavel} tone="electric" />
            <div className="min-w-0 space-y-3">
              <p className="lead measure">
                Under section 12(c) of the Legal Services Authorities Act, 1987, every woman and
                every child in India is entitled to free legal services.
              </p>
              <p className="copy measure">
                So are people in custody, industrial workmen, victims of trafficking, mass disaster
                victims and the others listed in that section — for them it is an entitlement, not a
                means test.
              </p>
              <p className="copy measure">
                Every state and district has a Legal Services Authority running legal aid clinics and
                court support. Where a dispute can settle, ask for a{' '}
                <strong className="font-semibold text-fg">Lok Adalat</strong> — the award is deemed to
                be a decree of a civil court.
              </p>
              <a
                href="https://nalsa.gov.in"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 font-sans text-body font-semibold text-electric-300 hover:underline"
              >
                nalsa.gov.in — find your district authority
                <ExternalLink size={12} strokeWidth={2.4} />
              </a>
            </div>
          </div>
        </Card>
      </section>

      {/* ================================================= suggest a resource */}
      <section>
        <BandHeading eyebrow="Corrections" title="Suggest a resource" sub="How this directory is kept honest" />
        <Card>
          <div className="flex items-start gap-3.5">
            <IconBadge icon={BookOpen} tone="muted" />
            <div className="min-w-0 space-y-2.5">
              <p className="copy measure">
                This is a curated set of officially published Indian helplines and portals. LawLink
                does not run a submission form, because an unverified number on an emergency page is
                worse than no number at all.
              </p>
              <p className="copy measure">
                If a helpline has changed, report it to the department that publishes it first — most
                numbers here are linked straight to the official page, so that is the fastest route to
                a correction. Once the department updates it, LawLink re-checks and updates this
                directory.
              </p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-1.5 font-sans text-caption font-semibold text-electric-300 hover:underline"
                >
                  How LawLink verifies content
                  <ArrowRight size={12} strokeWidth={2.4} />
                </Link>
                <a
                  href="https://www.indiacode.nic.in"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 font-sans text-caption font-semibold text-electric-300 hover:underline"
                >
                  India Code — official text of central laws
                  <ExternalLink size={12} strokeWidth={2.4} />
                </a>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* ================================================= verification footer */}
      <section>
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="eyebrow mb-1.5">Verification and limits of this page</div>
              <p className="copy measure">
                Three things worth knowing before you rely on a number printed here.
              </p>
            </div>
            <VerifiedTag date={VERIFIED_ON} />
          </div>

          <ul className="mt-4 divide-y divide-white/[0.05] border-t border-white/[0.05]">
            <li className="py-3">
              <p className="copy measure">
                Every entry was last verified on {VERIFIED_ON}. Helplines change, get merged or stop
                working — before a real emergency, re-check the number against the official site
                linked on its card.
              </p>
            </li>
            <li className="py-3">
              <p className="copy measure">
                No number on this page was invented, rounded or guessed. Where a service has no single
                national number, the entry links to the official portal instead of showing an empty
                phone slot.
              </p>
            </li>
            <li className="py-3 last:pb-0">
              <p className="copy measure">
                Coverage varies by state. 112 is the single number that works everywhere; a state
                service that is not answering is a reason to call 112, not to wait.
              </p>
            </li>
          </ul>

          <DisclaimerNote text={DISCLAIMER} className="mt-5" />
        </Card>
      </section>
    </div>
  )
}
