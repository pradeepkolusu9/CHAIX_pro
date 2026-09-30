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
    note: 'Sections 43, 65B, 66C, 66D, 66E, and s.25 of the Payment and Settlement Systems Act.',
    owner: null,
  },
  consumer: {
    state: REVIEW_STATE.DRAFT,
    primarySource: 'https://www.indiacode.nic.in — Consumer Protection Act, 2019',
    note: 'Check the s.47 / s.38 mapping and the current CGRC filing route.',
    owner: null,
  },
  road: {
    state: REVIEW_STATE.DRAFT,
    primarySource: 'https://morth.nic.in — Motor Vehicles Act, 1988 and the 2014 BAC notification',
    note: 'VERIFY: s.185 (MVA) vs the general drunk-driving provision, and the 30 mg/100 ml limit notification reference.',
    owner: null,
  },
  student: {
    state: REVIEW_STATE.DRAFT,
    primarySource: 'https://www.indiacode.nic.in — Ragging Prohibition Act, 2009; POSH Act, 2013',
    note: 'Check ICC applicability and the RTI route for a specific institution type.',
    owner: null,
  },
  workplace: {
    state: REVIEW_STATE.DRAFT,
    primarySource: 'https://labour.gov.in — four labour codes, EPF Act 1952, Payment of Gratuity Act 1972',
    note: 'Minimum wages and shop rules are STATE-specific and change — never state a national figure.',
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
    note: 'BNS/BNSS/BSA replaced IPC/CrPC/Evidence Act. Quote the new law and note the old section where useful.',
    owner: null,
  },
  fundamental: {
    state: REVIEW_STATE.DRAFT,
    primarySource: 'https://www.indiacode.nic.in — Constitution of India, Part III and Part IV',
    note: 'Art. 44 (UCC) is a Directive Principle, not in force. Keep that distinction explicit.',
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
