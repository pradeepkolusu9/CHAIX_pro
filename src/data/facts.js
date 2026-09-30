/**
 * Rotating "Did you know?" legal awareness cards.
 * Every fact is a verifiable, non-advice statement. Rotates daily + on demand.
 */
export const FACTS = [
  {
    id: 'f1',
    title: 'Not every dispute needs a court',
    body: 'Most consumer and service complaints are resolved earlier through a grievance officer or a lok adalat than in a courtroom. A lok adalat is a legal settlement meeting, and an award made there is treated as a decree of a civil court.',
    link: 'https://nalsa.gov.in',
    linkLabel: 'NALSA â€” National Legal Services Authority',
    module: 'consumer',
  },
  {
    id: 'f2',
    title: 'Your OTP is a lock, not a form',
    body: 'An OTP changes every minute and only comes to you. That is why no bank, support agent or government office will ever ask you to read it out. If someone does, it is a scam â€” full stop.',
    link: 'https://cybercrime.gov.in',
    linkLabel: 'National Cyber Crime Reporting Portal',
    module: 'cybercrime',
  },
  {
    id: 'f3',
    title: 'Section 65B decides if your screenshot counts',
    body: 'Digital records have to be produced in a form the law recognises. That is why a full-screen screenshot showing the time and sender is stronger evidence than a cropped one.',
    link: 'https://www.indiacode.nic.in',
    linkLabel: 'India Code â€” Information Technology Act, 2000',
    module: 'cybercrime',
  },
  {
    id: 'f4',
    title: 'Buying online still makes you a consumer',
    body: 'The Consumer Protection Act, 2019 covers online purchases and services. A defective product or a service you paid for but never received is a consumer complaint, and the helpline is 1915.',
    link: 'https://consumerhelpline.gov.in',
    linkLabel: 'National Consumer Helpline â€” 1915',
    module: 'consumer',
  },
  {
    id: 'f5',
    title: 'Ragging is a legal offence, not a tradition',
    body: 'Ragging is prohibited under the Ragging Prohibition Act, 2009. Every institution is required to have an anti-ragging committee, and ragging can attract punishment including fine and exclusion from the institution.',
    link: 'https://nios.ac.in',
    linkLabel: 'NIOS â€” anti-ragging guidance',
    module: 'student',
  },
  {
    id: 'f6',
    title: 'The legal BAC limit is 30 mg per 100 ml',
    body: 'That is 0.03% of alcohol in your blood, notified by the Ministry of Road Transport and Highways. Riding after drinking is an offence under section 185 of the Motor Vehicles Act, 1988, and the court can disqualify your licence.',
    link: 'https://morth.nic.in',
    linkLabel: 'Ministry of Road Transport and Highways',
    module: 'road',
  },
  {
    id: 'f7',
    title: 'Article 32 is the heart of the Constitution',
    body: 'Dr Ambedkar called it so. It is your right to go directly to the Supreme Court to enforce your fundamental rights â€” and the right to a remedy, not just a right on paper.',
    link: 'https://www.indiacode.nic.in',
    linkLabel: 'India Code â€” Constitution of India, Part III',
    module: 'fundamental',
  },
  {
    id: 'f8',
    title: 'Privacy sits inside the right to life',
    body: 'In K.S. Puttaswamy (2017) the Supreme Court held that privacy is intrinsic to Article 21. That case is the foundation for India\'s data protection law.',
    link: 'https://www.indiacode.nic.in',
    linkLabel: 'India Code â€” Constitution of India, Part III',
    module: 'privacy',
  },
  {
    id: 'f9',
    title: 'Equal pay for equal work is the law',
    body: 'The Code on Wages, 2019 prohibits discrimination in wages on the ground of gender, and lets an employee ask a designated authority to inspect the records of an employer.',
    link: 'https://labour.gov.in',
    linkLabel: 'Ministry of Labour and Employment',
    module: 'workplace',
  },
  {
    id: 'f10',
    title: 'Free legal aid is a right, not a favour',
    body: 'Section 12(c) of the Legal Services Authorities Act, 1987 guarantees free legal services to women and children among others. Ask any district Legal Services Authority.',
    link: 'https://nalsa.gov.in',
    linkLabel: 'NALSA â€” free legal aid',
    module: 'safety',
  },
  {
    id: 'f11',
    title: 'You can ask a government office for a record',
    body: 'The Right to Information Act, 2005 lets any citizen request information from a public authority. Ask the Public Information Officer, and you can appeal if the reply is unsatisfactory.',
    link: 'https://rtionline.gov.in',
    linkLabel: 'RTI Online',
    module: 'fundamental',
  },
  {
    id: 'f12',
    title: 'Keep the acknowledgement number',
    body: 'Whether it is a cybercrime complaint or a consumer complaint, the number they give you is the only thing that makes a follow-up possible. Screenshot it.',
    link: 'https://cybercrime.gov.in',
    linkLabel: 'Report and keep the number',
    module: 'cybercrime',
  },
]

/** Stable daily pick so the card is the same all day, but changes tomorrow. */
export function factForDate(date = new Date()) {
  const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()
  return FACTS[seed % FACTS.length]
}

