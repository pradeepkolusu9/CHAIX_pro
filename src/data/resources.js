/**
 * Verified Indian emergency and legal-resource directory.
 *
 * ONLY the numbers below are used in LawLink. Each one is an official,
 * published helpline. If a number cannot be verified against an official
 * source it does not belong in this file.
 *
 * Drafted 30 September 2026 and NOT yet checked by a lawyer or against every
 * official source. Helplines do change — verify before an actual emergency and
 * prefer the official website where listed. Emergency numbers: police 100, fire 101,
 * ambulance 108, all-in-one 112.
 */

export const VERIFIED_ON = '2026-09-30'

export const CATEGORIES = {
  emergency: {
    key: 'emergency',
    label: 'Emergency',
    icon: 'Siren',
    blurb: 'Use these if anyone is in immediate danger.',
    tone: 'danger',
  },
  legalAid: {
    key: 'legalAid',
    label: 'Legal Aid',
    icon: 'Scale',
    blurb: 'Free legal help, especially for those who cannot afford it.',
    tone: 'electric',
  },
  women: {
    key: 'women',
    label: 'Women & Safety',
    icon: 'Shield',
    blurb: 'Confidential support for women and girls.',
    tone: 'violet',
  },
  child: {
    key: 'child',
    label: 'Child Protection',
    icon: 'HeartHandshake',
    blurb: 'For children in distress or at risk.',
    tone: 'warn',
  },
  report: {
    key: 'report',
    label: 'Report & Complain',
    icon: 'FileWarning',
    blurb: 'Official portals to register a complaint online.',
    tone: 'xp',
  },
  learn: {
    key: 'learn',
    label: 'Learn & Read',
    icon: 'BookOpen',
    blurb: 'Primary law and official education material.',
    tone: 'good',
  },
}

export const RESOURCES = [
  // ------------------------------------------------------------- emergency
  {
    id: 'r-112',
    category: 'emergency',
    name: 'All-in-One Emergency Response',
    number: '112',
    about: 'A single emergency number for police, fire and ambulance in most states. Works on any mobile network and is free.',
    source: 'National Emergency Response Centre, Ministry of Home Affairs',
    sourceUrl: 'https://112.gov.in',
  },
  {
    id: 'r-100',
    category: 'emergency',
    name: 'Police Control Room',
    number: '100',
    about: 'Your local police station. Use this to register an FIR or report an ongoing situation.',
    source: 'State Police / local police control room',
    sourceUrl: 'https://www.mha.gov.in',
  },
  {
    id: 'r-101',
    category: 'emergency',
    name: 'Fire Service',
    number: '101',
    about: 'Fire and rescue service. Call 101 for a fire. If you are unsure which service you need, call 112.',
    source: 'State fire and emergency services',
    sourceUrl: 'https://www.mha.gov.in',
  },
  {
    id: 'r-108',
    category: 'emergency',
    name: 'Ambulance — Emergency Medical Response',
    number: '108',
    about: 'Emergency ambulance and medical response, free in many states. Availability and coverage vary by state — 112 is the safer single number.',
    source: 'State run emergency medical services',
    sourceUrl: 'https://nhm.gov.in',
  },
  {
    id: 'r-1033',
    category: 'emergency',
    name: 'Highway Helpline',
    number: '1033',
    about: 'Toll-free helpline of the National Highways Authority of India (NHAI) for assistance and accident help on national highways.',
    source: 'National Highways Authority of India',
    sourceUrl: 'https://nhai.gov.in',
  },

  // ------------------------------------------------------------- women
  {
    id: 'r-181',
    category: 'women',
    name: 'Women Helpline',
    number: '181',
    about: 'Women Helpline of the Ministry of Women and Child Development, for women in distress. Supports police, medical and legal help.',
    source: 'Ministry of Women and Child Development',
    sourceUrl: 'https://wcd.gov.in',
  },
  {
    id: 'r-1091',
    category: 'women',
    name: 'Women Helpline (Police)',
    number: '1091',
    about: 'Helpline for women in distress, run with the police. The Ministry of Women and Child Development runs a separate Women Helpline on 181.',
    source: 'State police, Ministry of Home Affairs',
    sourceUrl: 'https://www.mha.gov.in',
  },
  {
    id: 'r-domestic',
    category: 'women',
    name: 'Domestic Violence Support',
    number: null,
    about:
      'Under the Domestic Violence Act, 2005 a woman facing violence can approach a Magistrate for a protection order, a residence order, monetary relief and custody of children. This is a civil remedy — you do not have to wait for a criminal case.',
    source: 'National Commission for Women / District Magistrate',
    sourceUrl: 'https://ncw.gov.in',
  },

  // ------------------------------------------------------------- child
  {
    id: 'r-1098',
    category: 'child',
    name: 'Childline',
    number: '1098',
    about: '24x7 helpline for children in distress, run by the Ministry of Women and Child Development with partner organisations.',
    source: 'Ministry of Women and Child Development',
    sourceUrl: 'https://wcd.gov.in',
  },
  {
    id: 'r-ncpcr',
    category: 'child',
    name: 'National Commission for Protection of Child Rights',
    number: null,
    about: 'Statutory body that takes complaints about a child\'s rights, including child labour and abuse in institutions.',
    source: 'NCPCR, Ministry of Women and Child Development',
    sourceUrl: 'https://ncpcr.gov.in',
  },

  // ------------------------------------------------------------- legal aid
  {
    id: 'r-nalsa',
    category: 'legalAid',
    name: 'National Legal Services Authority',
    number: null,
    about:
      'NALSA coordinates free legal aid across India. Under section 12(c) of the Legal Services Authorities Act, 1987, women and children are entitled to free legal services, as are people in custody, industrial workmen, victims of trafficking, mass disaster victims and others.',
    source: 'NALSA — Legal Services Authorities Act, 1987',
    sourceUrl: 'https://nalsa.gov.in',
  },
  {
    id: 'r-lokadalat',
    category: 'legalAid',
    name: 'Lok Adalat (National Legal Services Authority)',
    number: null,
    about:
      'Legal settlements are organised regularly. Lok Adalat under the Legal Services Authorities Act, 1987 is a forum where cases are settled, and an award is deemed to be a decree of a civil court. Check the NALSA site for the next Lok Adalat in your district.',
    source: 'NALSA',
    sourceUrl: 'https://nalsa.gov.in',
  },
  {
    id: 'r-legal-services',
    category: 'legalAid',
    name: 'State Legal Services Authorities',
    number: null,
    about:
      'Every state and district has a Legal Services Authority that runs a legal aid clinic, an Nyaya Kendra and court support services.',
    source: 'State / District Legal Services Authority',
    sourceUrl: 'https://nalsa.gov.in',
  },

  // ------------------------------------------------------------- report
  {
    id: 'r-cybercrime',
    category: 'report',
    name: 'National Cyber Crime Reporting Portal',
    number: '1930',
    about:
      '24x7 national helpline and online portal for reporting cyber crime and financial fraud. You get a complaint number — keep it, it is what speeds up the process.',
    source: 'Indian Cyber Crime Coordination Centre (I4C), Ministry of Home Affairs',
    sourceUrl: 'https://cybercrime.gov.in',
  },
  {
    id: 'r-consumer',
    category: 'report',
    name: 'National Consumer Helpline',
    number: '1915',
    about:
      'National toll-free consumer helpline of the Department of Consumer Affairs. Handles e-commerce, service deficiency and product liability complaints.',
    source: 'Department of Consumer Affairs, Government of India',
    sourceUrl: 'https://consumerhelpline.gov.in',
  },
  {
    id: 'r-cgrc',
    category: 'report',
    name: 'Consumer Disputes Redressal Commission',
    number: null,
    about:
      'A consumer can file a complaint with a District, State or National Consumer Disputes Redressal Commission under the Consumer Protection Act, 2019. Filing is available online through the National Consumer Helpline portal.',
    source: 'Department of Consumer Affairs',
    sourceUrl: 'https://consumerhelpline.gov.in',
  },
  {
    id: 'r-ecourts',
    category: 'report',
    name: 'eCourts Services',
    number: null,
    about:
      'Official court services portal — case status, cause lists, judgments and online filing, run by the Supreme Court of India.',
    source: 'Supreme Court of India',
    sourceUrl: 'https://ecourts.gov.in',
  },
  {
    id: 'r-njdg',
    category: 'report',
    name: 'National Judicial Data Grid',
    number: null,
    about: 'Search judgments across the Supreme Court and all High Courts from one place.',
    source: 'National Judicial Data Grid',
    sourceUrl: 'https://njdg.gov.in',
  },
  {
    id: 'r-labour',
    category: 'report',
    name: 'Ministry of Labour & Employment',
    number: null,
    about:
      'Information on the labour codes, wage and hour rules, and the grievances mechanism. The office of the relevant state labour commissioner enforces the law at district level.',
    source: 'Ministry of Labour and Employment',
    sourceUrl: 'https://labour.gov.in',
  },
  {
    id: 'r-epfo',
    category: 'report',
    name: 'EPFO Grievance Portal',
    number: null,
    about: 'Raise a provident fund claim or complaint online.',
    source: "Employees' Provident Fund Organisation",
    sourceUrl: 'https://www.epfigms.gov.in',
  },
  {
    id: 'r-rti',
    category: 'report',
    name: 'Right to Information — RTI Online',
    number: null,
    about:
      'The Right to Information Act, 2005 lets any citizen request information from a public authority. A request can be filed with the Public Information Officer of that office.',
    source: 'Department of Personnel and Training / RTI Online',
    sourceUrl: 'https://rtionline.gov.in',
  },

  // ------------------------------------------------------------- learn
  {
    id: 'r-indiacode',
    category: 'learn',
    name: 'India Code — Repository of Central Laws',
    number: null,
    about: 'The official repository of Acts, Rules and amendments of the Government of India. Use this to read the actual text of any law.',
    source: 'Legislative Department, Ministry of Law and Justice',
    sourceUrl: 'https://www.indiacode.nic.in',
  },
  {
    id: 'r-antiragging',
    category: 'learn',
    name: 'UGC Anti-Ragging Portal',
    number: null,
    about: 'Official University Grants Commission portal on ragging: the regulations, how to complain, and the anti-ragging helpline details. Read alongside your state anti-ragging law.',
    source: 'University Grants Commission',
    sourceUrl: 'https://www.antiragging.in',
  },
  {
    id: 'r-cert-in',
    category: 'learn',
    name: 'CERT-In Advisories',
    number: null,
    about: 'National Computer Emergency Response Team advisories on malware, scams and current cyber threats.',
    source: 'CERT-In, MeitY',
    sourceUrl: 'https://www.cert-in.org.in',
  },
  {
    id: 'r-meity',
    category: 'learn',
    name: 'MeitY — Digital Personal Data Protection',
    number: null,
    about:
      'Official pages on the Digital Personal Data Protection Act, 2023 and its rules. Check here for the current commencement and rule status.',
    source: 'Ministry of Electronics and Information Technology',
    sourceUrl: 'https://www.meity.gov.in',
  },
  {
    id: 'r-ncw',
    category: 'learn',
    name: 'National Commission for Women',
    number: null,
    about: 'Complaints and support for women, including violations of the Domestic Violence Act, 2005.',
    source: 'National Commission for Women',
    sourceUrl: 'https://ncw.gov.in',
  },
]

export const byCategory = (cat) => RESOURCES.filter((r) => r.category === cat)

export const DISCLAIMER =
  'LawLink provides legal awareness and educational information only. It is not a substitute for professional legal advice.'
