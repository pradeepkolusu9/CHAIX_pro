/**
 * Content review provenance.
 *
 * IMPORTANT — READ THIS BEFORE QUOTING ANY DATE IN THE UI.
 *
 * Every module and fact in LawLink was written by an AI assistant from its training
 * knowledge, then checked for internal consistency. That is NOT the same as being
 * verified against the primary source, and the original build stamped every item
 * `lastVerified: '2026-09-30'` — the authoring date — under a "Verified" badge.
 * That is a false claim of assurance on a legal-information product, so the single
 * hardcoded constant is replaced by this per-item record.
 *
 * The `lastVerified` field on topics, scenarios and the resource directory is KEPT for
 * compatibility, but its meaning is 'authored / drafted on' — see LAST_VERIFIED_LABEL below.
 * Any UI that prints it should say 'Drafted', never 'Verified'.
 *
 * `review` must never be 'verified' unless a named human reviewer has checked the
 * item against the primary source. Until then it stays 'draft'. Shipping a
 * consumer legal-education product requires a qualified lawyer to sign off the
 * module text; that has not happened yet.
 */

/** @typedef {'draft'|'legal-review'|'verified'} ReviewState */

export const REVIEW_STATE = {
  DRAFT: 'draft',
  LEGAL_REVIEW: 'legal-review',
  VERIFIED: 'verified',
}

/** The date the content was AUTHORED — not the date it was legally checked. */
export const AUTHORED_ON = '2026-09-30'

/**
 * What every `lastVerified` date in the content actually means. UI copy should use
 * this label instead of 'Verified' / 'Last verified' until a named reviewer signs off.
 */
export const LAST_VERIFIED_LABEL = 'Drafted'
export const LAST_VERIFIED_MEANING = 'Authored on this date. Not yet checked by a lawyer.'

/** The date the review record itself was last updated. */
export const REVIEW_RECORD_UPDATED = '2026-09-30'

/**
 * One line to show in place of the old hardcoded "Verified <date>" badge.
 * Kept short: this sits next to a law citation and must not become a wall.
 */
export const REVIEW_NOTE = 'Draft — not yet lawyer-checked'

/**
 * Per-topic review record. `owner` is who is accountable for getting this
 * item signed off; `source` is the primary text to check it against.
 */
export const REVIEW = {
  cybercrime: {
    state: REVIEW_STATE.DRAFT,
    primarySource: 'https://www.indiacode.nic.in — Information Technology Act, 2000',
    note: 'IT Act ss.43, 66C, 66D, 66E; Bharatiya Sakshya Adhiniyam 2023 s.63 (was Evidence Act s.65B); RBI 2017 circular on limiting customer liability (no section number).',
    owner: null,
  },
  consumer: {
    state: REVIEW_STATE.DRAFT,
    primarySource: 'https://www.indiacode.nic.in — Consumer Protection Act, 2019',
    note: 'Section numbers used: 2(7), 2(11), 2(46), 34, 35, 39, 47, 89 — confirm each. Check the current CGRC filing route.',
    owner: null,
  },
  road: {
    state: REVIEW_STATE.DRAFT,
    primarySource: 'https://morth.nic.in — Motor Vehicles Act, 1988 and the 2014 BAC notification',
    note: 'VERIFY: s.185 and the 30 mg/100 ml limit; s.129 is the helmet rule; s.146 insurance; s.134A Good Samaritan. Licence disqualification and refused breath tests are described only in general terms.',
    owner: null,
  },
  student: {
    state: REVIEW_STATE.DRAFT,
    primarySource: 'https://www.ugc.gov.in — UGC Regulations on Curbing the Menace of Ragging, 2009; state anti-ragging laws; POSH Act, 2013 (indiacode.nic.in)',
    note: 'There is no central Ragging Prohibition Act. Education-as-service, fee-withholding, ICC applicability and the RTI route are contestable — see LAWYER_FLAGS.',
    owner: null,
  },
  workplace: {
    state: REVIEW_STATE.DRAFT,
    primarySource: 'https://labour.gov.in — four labour codes, EPF Act 1952, Payment of Gratuity Act 1972',
    note: 'Minimum wages and shop rules are STATE-specific and change — never state a national figure. How far the labour codes have replaced the older Acts depends on commencement.',
    owner: null,
  },
  privacy: {
    state: REVIEW_STATE.DRAFT,
    primarySource: 'https://www.meity.gov.in — Digital Personal Data Protection Act, 2023',
    note: 'DPDP commencement is phased. Do NOT state a date on which every provision is in force.',
    owner: null,
  },
  safety: {
    state: REVIEW_STATE.DRAFT,
    primarySource: 'https://www.indiacode.nic.in — Bharatiya Nyaya Sanhita 2023, POSH Act 2013, Domestic Violence Act 2005',
    note: 'BNS/BNSS/BSA replaced IPC/CrPC/Evidence Act, in force from 1 July 2024 (the CrPC is 1973). 1091 is the women helpline run with the police; 181 is the MWCD Women Helpline.',
    owner: null,
  },
  fundamental: {
    state: REVIEW_STATE.DRAFT,
    primarySource: 'https://www.indiacode.nic.in — Constitution of India, Part III and Part IV',
    note: 'Art. 44 (UCC) is a Directive Principle; no single code applies nationwide, but some states have their own laws. Keep wording neutral.',
    owner: null,
  },
}

export const reviewFor = (moduleId) =>
  REVIEW[moduleId] || {
    state: REVIEW_STATE.DRAFT,
    primarySource: 'https://www.indiacode.nic.in',
    note: '',
    owner: null,
  }

export const isVerified = (moduleId) => reviewFor(moduleId).state === REVIEW_STATE.VERIFIED

/**
 * Wording a qualified lawyer must check before any module can be marked 'verified'.
 * Each item was softened so it is true under either reading; none is a confirmed fact.
 */
export const LAWYER_FLAGS = [
  { module: 'student', item: 'Education / coaching as a "service" under the Consumer Protection Act, 2019' },
  { module: 'student', item: 'Barring exams or withholding results/certificates over unpaid fees' },
  { module: 'student', item: 'State anti-ragging laws and how they sit with the UGC Regulations, 2009' },
  { module: 'safety', item: 'Applicability of the POSH Act, 2013 (ICC / Local Committee) to students' },
  { module: 'workplace', item: 'Which labour codes are in force and which older Acts they replace (wages, EPF, gratuity, maternity)' },
  { module: 'road', item: 'Licence disqualification after a drink-driving conviction; consequences of refusing a breath test' },
  { module: 'road', item: 'Good Samaritan protections (s.134A and the Ministry guidelines): identity and medical-bill wording' },
  { module: 'road', item: 'Scope of compulsory third-party insurance (property damage)' },
  { module: 'fundamental', item: 'Uniform Civil Code: Article 44 versus state-level laws' },
  { module: 'privacy', item: 'DPDP Act commencement, and the credit-report guidance after a breach' },
  { module: 'consumer', item: 'Every Consumer Protection Act, 2019 section number used (2(7), 2(11), 2(46), 34, 35, 39, 47, 89)' },
]

/** Helplines: only these may ever appear in the product. */
export const ALLOWED_HELPLINES = [
  '112', '100', '101', '108', '1076', '1073', '1091', '1098', '181', '1930', '1915', '1033',
]

/**
 * Build-time guard against an invented helpline number.
 *
 * It audits the STRUCTURED fields that actually hold phone numbers — the
 * `emergency` blocks on each module and the `number` on each resource — rather
 * than regex-scanning prose. Scanning prose was tried and abandoned: every
 * statute name ("Motor Vehicles Act, 1988"), section reference ("s.185"), rupee
 * amount ("₹4,999") and level threshold ("150 XP") is a bare number, so a text
 * scan fired on essentially the entire corpus and told us nothing. The only
 * places a phone number can legitimately appear are the two structured fields,
 * and those are exactly what this checks.
 */
export function auditHelplines(entries) {
  const bad = []
  for (const e of entries) {
    const n = e?.number
    if (n == null || n === '') continue
    const s = String(n).trim()
    if (!ALLOWED_HELPLINES.includes(s)) {
      bad.push({ number: s, where: e.label || e.name || 'unknown' })
    }
  }
  return bad
}

/** Every structured number in the product, in one list. */
export function collectHelplineEntries(modules, resources) {
  return [
    ...modules.flatMap((m) =>
      (m.emergency || []).map((e) => ({ number: e.number, label: `${m.id}: ${e.label}` })),
    ),
    ...resources.map((r) => ({ number: r.number, label: r.name })),
  ]
}
