/**
 * LawLink AI — curated awareness knowledge base.
 *
 * This is a deterministic intent engine over verified content, not a live LLM.
 * Every response is assembled from data that has been checked against an
 * official source, and always carries a disclaimer.
 *
 * The response shape is fixed:
 *   POSSIBLE LEGAL AREA → what this means → WHAT YOU CAN DO (steps)
 *   → RELEVANT RESOURCE → SOURCE → DISCLAIMER
 */
import { DISCLAIMER } from './resources.js'

export const QUICK_CATEGORIES = [
  { key: 'cybercrime', label: 'Cybercrime', q: 'I lost money to a scam — what do I do?' },
  { key: 'consumer', label: 'Consumer', q: 'My online order was never delivered. What can I do?' },
  { key: 'student', label: 'Student', q: 'I am being harassed in college. What are my rights?' },
  { key: 'workplace', label: 'Workplace', q: 'My salary was not paid on time. Is that legal?' },
  { key: 'road', label: 'Road', q: 'I was caught drink-driving. What happens now?' },
  { key: 'privacy', label: 'Privacy', q: 'An app is asking for my Aadhaar number. Should I?' },
  { key: 'safety', label: 'Safety', q: 'Someone is stalking me online. Help.' },
]

export const GREETING = {
  area: 'LawLink AI',
  meaning:
    'Ask me a situation in plain words — what happened, and I will point you to the legal area it falls under, what your rights are, and the exact next steps to take today.',
  steps: [],
}

/**
 * Each intent carries its own verified legal basis. `keywords` are matched
 * against the user's message; higher weight keywords are matched on stems.
 */
export const INTENTS = [
  // ------------------------------------------------------------- consumer
  {
    id: 'c-order-missing',
    area: 'Consumer Rights — defective / undelivered goods',
    module: 'consumer',
    keywords: [
      'order', 'delivery', 'delivered', 'refund', 'money back', 'not received', 'never arrived',
      'online order', 'flipkart', 'amazon', 'myntra', 'tracking', 'cancelled', 'return',
      'didnt come', 'did not come', 'not delivered', 'never delivered', 'never came',
      'waiting for delivery', 'waiting for my order',
    ],
    meaning:
      'When you pay for a product or service online, you become a consumer under the Consumer Protection Act, 2019. A product that never arrives, arrives damaged, or is not what was described is a deficiency in service or a defective product — it is not something you have to just accept.',
    rights: [
      'A refund or replacement for a product that was not delivered as promised',
      'Information about the delivery timeline, the seller and the terms of sale',
      'A complaint to a Consumer Disputes Redressal Commission if the seller refuses',
    ],
    steps: [
      { step: 1, text: 'Check the order page and the seller\'s stated delivery timeline. Most platforms allow a window to report a missing order.' },
      { step: 2, text: 'Raise it on the platform with photos of the product and the order ID. Keep screenshots of every message.' },
      { step: 3, text: 'If the platform refuses or does not respond, call the National Consumer Helpline on 1915.' },
      { step: 4, text: 'For a claim above the District Commission limit, file with a Consumer Disputes Redressal Commission under the Consumer Protection Act, 2019.' },
    ],
    resource: { label: 'National Consumer Helpline — 1915', href: 'https://consumerhelpline.gov.in', number: '1915' },
    source: { label: 'Consumer Protection Act, 2019', href: 'https://www.indiacode.nic.in' },
    urgent: false,
  },
  {
    id: 'c-defective',
    area: 'Consumer Rights — defective product or warranty',
    module: 'consumer',
    keywords: [
      'defective', 'warranty', 'broken', 'not working', 'damaged', 'repair', 'replacement',
      'service centre', 'service center', 'exchange', 'faulty', 'stopped working',
    ],
    meaning:
      'A product that fails within its advertised or promised life is a defect. A manufacturer or seller who refuses to repair or replace it can be taken to a Consumer Disputes Redressal Commission, and compensation can be awarded for the cost of the product and the loss from its failure.',
    rights: [
      'Repair or replacement of a product that fails within its promised life',
      'Refund if replacement is not possible within a reasonable time',
      'Compensation for the loss caused by the defective product',
    ],
    steps: [
      { step: 1, text: 'Write to the seller or the manufacturer in writing with the invoice and a description of the defect.' },
      { step: 2, text: 'Keep the written complaint and any reply — a complaint you never sent is difficult to prove.' },
      { step: 3, text: 'If there is no response, call the National Consumer Helpline on 1915 and file online.' },
      { step: 4, text: 'Escalate to a District / State / National Consumer Disputes Redressal Commission. Keep every bill for the repair or replacement.' },
    ],
    resource: { label: 'National Consumer Helpline — 1915', href: 'https://consumerhelpline.gov.in', number: '1915' },
    source: { label: 'Consumer Protection Act, 2019', href: 'https://www.indiacode.nic.in' },
    urgent: false,
  },
  {
    id: 'c-fees',
    area: 'Consumer Rights — coaching / course fees',
    module: 'consumer',
    keywords: [
      'coaching', 'course fee', 'course', 'institute', 'tuition', 'batch', 'admission fee',
      'refund fee', 'fees refund', 'training fee', 'education service', 'college fee',
    ],
    meaning:
      'Fees paid for coaching or a course that was never delivered can often be taken to a consumer forum under the Consumer Protection Act, 2019, though courts have treated some education matters differently. A refund that was promised and not given is a grievance you can put in writing — you are not simply at the mercy of the institute.',
    rights: [
      'A refund of fees for a service that was not delivered',
      'Information about the refund policy before you paid',
      'A complaint to a Consumer Disputes Redressal Commission for deficiency in service',
    ],
    steps: [
      { step: 1, text: 'Put your refund request in writing, by email or a letter, and ask for a specific date.' },
      { step: 2, text: 'Keep the fee receipt, the admission letter or the agreement you signed, and every message.' },
      { step: 3, text: 'Escalate to the National Consumer Helpline on 1915 and file the complaint online.' },
      { step: 4, text: 'If a large amount is involved, consult a District Consumer Disputes Redressal Commission.' },
    ],
    resource: { label: 'National Consumer Helpline — 1915', href: 'https://consumerhelpline.gov.in', number: '1915' },
    source: { label: 'Consumer Protection Act, 2019', href: 'https://www.indiacode.nic.in' },
    urgent: false,
  },

  // ------------------------------------------------------------ cybercrime
  {
    id: 'cy-money-lost',
    area: 'Cybercrime — financial fraud and money debited',
    module: 'cybercrime',
    keywords: [
      'scam', 'fraud', 'fraudulent', 'money debited', 'debited', 'money gone', 'lost money', 'upi',
      'upi fraud', 'transfer', 'cheating', 'lost rs', 'paid by mistake', 'unauthorized',
      'unauthorised', 'stolen money', 'wrong account', 'bank fraud',
    ],
    meaning:
      'Cheating you by deception online is an offence under the Information Technology Act, 2000, and the RBI circular on limiting customer liability (2017) protects you when you report an unauthorised electronic transaction promptly. The single most important thing is the first hour.',
    rights: [
      'Limited liability for an electronic payment made without your authorisation, if you report it promptly',
      'A written fraud report from your bank',
      'A complaint record from the National Cyber Crime Reporting Portal',
    ],
    steps: [
      { step: 1, text: 'From another phone, call your bank immediately. Ask them to freeze the account and block UPI for now.' },
      { step: 2, text: 'Call 1930 or file on cybercrime.gov.in. Note down the complaint number they give you.' },
      { step: 3, text: 'Screenshot everything — the payment, the sender ID, the messages, the time. Do not delete anything.' },
      { step: 4, text: 'If money was sent to a mobile number or a UPI ID, give that to the police along with your complaint number. Early reports can freeze the account the money went to.' },
    ],
    resource: { label: 'National Cyber Crime Reporting Portal — helpline 1930', href: 'https://cybercrime.gov.in', number: '1930' },
    source: { label: 'Information Technology Act, 2000', href: 'https://www.indiacode.nic.in' },
    urgent: true,
  },
  {
    id: 'cy-otp',
    area: 'Cybercrime — OTP, PIN and fake calls',
    module: 'cybercrime',
    keywords: [
      'otp', 'pin', 'cvv', 'call from bank', 'fake call', 'bank called', 'kyc', 'vkyc',
      'share otp', 'asked for otp', 'card details', 'password',
    ],
    meaning:
      'No bank, government office or support agent will ever ask you to read out an OTP, a PIN or a CVV. Anyone who asks already has what they need to move your money, and a genuine caller never has a reason to need it.',
    rights: [
      'No obligation to disclose an OTP, PIN or CVV to anyone, including someone claiming to be your bank',
      'A right to a fraud report from your bank if money is moved without your consent',
    ],
    steps: [
      { step: 1, text: 'If you have not shared it, you are safe — just end the call. Never read an OTP out loud.' },
      { step: 2, text: 'If you already shared it, call your bank right away and ask them to freeze the account and block UPI.' },
      { step: 3, text: 'Change your banking password and your email password, and turn on two-step verification.' },
      { step: 4, text: 'Report the call on cybercrime.gov.in so the number is investigated.' },
    ],
    resource: { label: 'Report on cybercrime.gov.in', href: 'https://cybercrime.gov.in', number: '1930' },
    source: { label: 'Information Technology Act, 2000', href: 'https://www.indiacode.nic.in' },
    urgent: true,
  },
  {
    id: 'cy-phishing',
    area: 'Cybercrime — phishing links and fake profiles',
    module: 'cybercrime',
    keywords: [
      'phishing', 'fake link', 'suspicious link', 'lottery', 'prize', 'free money', 'free gift',
      'voucher', 'impersonat', 'fake profile', 'fake account', 'someone using my name', 'cloned',
      'part time job', 'job offer', 'recruiter',
    ],
    meaning:
      'Creating a false identity to trick you is covered by the Information Technology Act, 2000, which criminalises cheating by personation. Winning a prize you never entered, or being asked to pay a fee to get a job, are the two most common shapes of it.',
    rights: [
      'Protection against cheating by personation under the Information Technology Act, 2000',
      'A right to have a fake profile removed through platform reporting and a police complaint',
    ],
    steps: [
      { step: 1, text: 'Do not click the link and do not enter any details. Delete it and block the number.' },
      { step: 2, text: 'Take a full-screen screenshot first — with the date, the number and the full message — before you delete it.' },
      { step: 3, text: 'If a fake profile is using your identity, report it in the app and tighten the privacy of your ID photo.' },
      { step: 4, text: 'If any money moved, follow the financial fraud route: bank first, then 1930 / cybercrime.gov.in.' },
    ],
    resource: { label: 'Report on cybercrime.gov.in', href: 'https://cybercrime.gov.in', number: '1930' },
    source: { label: 'Information Technology Act, 2000', href: 'https://www.indiacode.nic.in' },
    urgent: false,
  },
  {
    id: 'cy-stolen',
    area: 'Cybercrime — stolen phone or hacked account',
    module: 'cybercrime',
    keywords: [
      'phone stolen', 'phone lost', 'mobile stolen', 'stolen phone', 'lost my phone',
      'account hacked', 'hacked', 'someone logged in', 'unauthorised access', 'instagram hacked',
      'whatsapp hacked', 'taken over', 'new device', 'sim swap',
    ],
    meaning:
      'Unauthorised access into an electronic record is an offence under the Information Technology Act, 2000. If your phone was stolen, remember that your bank and mail apps on that phone are still logged in, so the money is the bigger risk.',
    rights: [
      'A right to have unauthorised access to your devices and accounts treated as an offence',
      'Limited liability for transactions made without your authorisation, if you report them promptly',
    ],
    steps: [
      { step: 1, text: 'Call your bank first from another phone and freeze the account and UPI.' },
      { step: 2, text: 'Block your SIM through the carrier, and reset your email password first — email is how attackers get back in.' },
      { step: 3, text: 'Change passwords on every account that used the same one, and turn on two-step verification.' },
      { step: 4, text: 'File on cybercrime.gov.in with screenshots. Remote-wipe the phone if it is still on your Google or Apple account.' },
    ],
    resource: { label: 'Report on cybercrime.gov.in', href: 'https://cybercrime.gov.in', number: '1930' },
    source: { label: 'Information Technology Act, 2000', href: 'https://www.indiacode.nic.in' },
    urgent: true,
  },

  // ------------------------------------------------------------- privacy
  {
    id: 'pv-data',
    area: 'Digital Privacy — apps, Aadhaar and personal data',
    module: 'privacy',
    keywords: [
      'privacy', 'personal data', 'aadhaar', 'aadhar', 'camera access', 'mic access',
      'permissions', 'leak', 'breach', 'data breach', 'sold my data', 'spam call',
      'face recognition', 'scraped', 'facial',
    ],
    meaning:
      'The Digital Personal Data Protection Act, 2023 sets out how your personal data may be processed and gives you the right to access, correct and erase it. Under the Information Technology Act, 2000, publishing private information without consent is an offence. Your consent has to be free, specific, informed and unambiguous — and you can withdraw it.',
    rights: [
      'A right to know what data an organisation holds about you and to have it corrected',
      'A right to have data erased and to nominate someone to exercise your rights',
      'A grievance route to a Data Protection Board through the organisation\'s grievance officer',
    ],
    steps: [
      { step: 1, text: 'Do not upload Aadhaar or documents to an app unless it is genuinely required — a college app usually needs a masked number, not the full document.' },
      { step: 2, text: 'Review app permissions on your phone. Deny camera, microphone and contacts unless the feature needs them.' },
      { step: 3, text: 'If your data was misused, send a written grievance to the organisation\'s grievance officer and keep the acknowledgement.' },
      { step: 4, text: 'If the response is unsatisfactory, escalate through the Data Protection Board process published by MeitY. Note that the DPDP Act comes into force in stages — check the current status at meity.gov.in.' },
    ],
    resource: { label: 'MeitY — Digital Personal Data Protection', href: 'https://www.meity.gov.in' },
    source: { label: 'Digital Personal Data Protection Act, 2023', href: 'https://www.meity.gov.in' },
    urgent: false,
  },

  // ------------------------------------------------------------- student
  {
    id: 'st-ragging',
    area: 'Student Rights — ragging and harassment on campus',
    module: 'student',
    keywords: [
      'ragging', 'ragged', 'senior', 'hostel', 'junior', 'pushed', 'forced', 'targeted',
      'anti ragging', 'college harassment', 'outcast', 'not allowed in hostel',
      'harassed in college', 'harassed in my college', 'harassed at college',
      'harassment in college', 'harassment at college', 'bullied in college',
    ],
    meaning:
      'Ragging is prohibited under the UGC Regulations on Curbing the Menace of Ragging in Higher Educational Institutions, 2009, and several states have their own anti-ragging laws. Every institution is required to have an anti-ragging committee. If the harassment is sexual in nature, the Sexual Harassment of Women at Workplace Act, 2013 and its Internal Complaints Committee may also apply. You are not required to tolerate it, and you do not have to fix it alone.',
    rights: [
      'Protection against ragging under the UGC anti-ragging regulations and state law',
      'The right to complain to the institution\'s anti-ragging committee and to the police',
      'A right to be informed of the action taken on your complaint',
    ],
    steps: [
      { step: 1, text: 'Write down the dates, names, what was said or done, and who witnessed it, while it is fresh.' },
      { step: 2, text: 'Complaint to the anti-ragging committee of the institution. Ask for it in writing and ask for a receipt.' },
      { step: 3, text: 'If the institution does not act, complain to the affiliating university and the relevant regulatory authority.' },
      { step: 4, text: 'If there is a threat to your safety, call 112 or 100 and say so plainly. You do not have to wait for the committee to respond first.' },
    ],
    resource: { label: 'UGC anti-ragging portal', href: 'https://www.antiragging.in' },
    source: { label: 'UGC Regulations on Curbing the Menace of Ragging, 2009', href: 'https://www.ugc.gov.in' },
    urgent: false,
  },
  {
    id: 'st-grievance',
    area: 'Student Rights — exams, marksheets and fees',
    module: 'student',
    keywords: [
      'marksheet', 'marks sheet', 're evaluation', 'reevaluation', 'result', 'grievance',
      'exam grievance', 'transcript', 'transfer certificate', 'withholding', 'detention',
      'fees not returned', 'refund of fees', 'hostel mess', 'university not responding',
      'expelled', 'detained',
    ],
    meaning:
      'A university owes you its rules, and the marksheet and transcript are documents you are entitled to receive. If a grievance process exists, you are entitled to use it and to a response. Holding back an academic document to pressure a fee is widely regarded as improper and can be challenged.',
    rights: [
      'A right to the marksheet and other academic documents once the process is complete',
      'A right to use the examination grievance or re-evaluation process of your institution',
      'A right to complain to the affiliating university and the regulator if the institution is not following its own rules',
    ],
    steps: [
      { step: 1, text: 'Put the complaint in writing to the office of the Controller of Examinations or the Head of Department, and keep a copy.' },
      { step: 2, text: 'Ask for the date of the next examination board meeting — most institutions are required to consider grievances there.' },
      { step: 3, text: 'If there is no response, escalate to the affiliating university. Use the RTI Act, 2005 to ask for the records you are not being given.' },
      { step: 4, text: 'For fees paid to a private institute, ask whether a consumer complaint under the Consumer Protection Act, 2019 is possible — the National Consumer Helpline is 1915.' },
    ],
    resource: { label: 'UGC — regulations and student grievance information', href: 'https://www.ugc.gov.in' },
    source: { label: 'Right to Information Act, 2005', href: 'https://www.indiacode.nic.in' },
    urgent: false,
  },

  // ---------------------------------------------------------- workplace
  {
    id: 'wp-salary',
    area: 'Workplace Rights — unpaid salary, contract and hours',
    module: 'workplace',
    keywords: [
      'salary', 'not paid', 'unpaid', 'salary delay', 'wages', 'pending salary', 'no contract',
      'working hours', 'overtime', 'weekly off', 'holiday', 'night shift', 'internship',
      'unpaid internship', 'fired', 'terminated', 'notice', 'provident fund', 'gratuity',
      'minimum wage', 'labour', 'employee',
    ],
    meaning:
      'India\'s four labour codes — the Code on Wages, 2019, the Industrial Relations Code, 2020, the Code on Social Security, 2020 and the Occupational Safety, Health and Working Conditions Code, 2020 — bring together earlier laws on wages, hours, leave, provident fund and termination, and how far they have been brought into force can affect which rule applies to you. Minimum wages and shop and establishment rules are set by your state, so the exact entitlement depends on where the job is.',
    rights: [
      'Payment of wages as agreed, and equal wages for equal work regardless of gender',
      'Rest periods and weekly off as required by the applicable state rules',
      'Provident fund cover under the Employees\' Provident Funds and Miscellaneous Provisions Act, 1952 where applicable',
      'Gratuity under the Payment of Gratuity Act, 1972 on completing five years of continuous service',
    ],
    steps: [
      { step: 1, text: 'Ask for your appointment letter or contract in writing, and keep every payslip, bank credit and message.' },
      { step: 2, text: 'Put the grievance in writing to the employer and to HR, and ask for a written response.' },
      { step: 3, text: 'Raise it with the office of the relevant labour authority for your state, and use the Shram Suvidha portal where applicable.' },
      { step: 4, text: 'For provident fund issues, raise a grievance on the EPFO Grievance portal. For an unpaid internship, get the terms in writing, because the label alone does not decide your rights.' },
    ],
    resource: { label: 'Ministry of Labour and Employment', href: 'https://labour.gov.in' },
    source: { label: 'Code on Wages, 2019 / EPF Act, 1952', href: 'https://labour.gov.in' },
    urgent: false,
  },
  {
    id: 'wp-maternity',
    area: 'Workplace Rights — maternity benefit',
    module: 'workplace',
    keywords: [
      'maternity', 'maternity leave', 'pregnant', 'pregnancy', 'baby', 'childbirth',
      'not allowed to work', 'maternity benefit', '26 weeks',
    ],
    meaning:
      'The Maternity Benefit (Amendment) Act, 2017 raised the period of paid maternity leave for the first two children to 26 weeks for establishments covered by the Maternity Benefit Act. Employers cannot dismiss a woman by reason of pregnancy or because of the period of absence connected with maternity, and an antenatal examination is part of working hours.',
    rights: [
      'Maternity leave and maternity benefit for covered establishments',
      'Protection from dismissal because of pregnancy or maternity absence',
      'The right to an antenatal examination during working hours',
    ],
    steps: [
      { step: 1, text: 'Give written notice to your employer in the form the Act requires, keeping a copy.' },
      { step: 2, text: 'If the employer refuses, put the complaint in writing to the Inspector appointed under the Maternity Benefit Act.' },
      { step: 3, text: 'For a medical emergency, do not wait for paperwork — use 112 and then complain in writing.' },
    ],
    resource: { label: 'Ministry of Labour and Employment', href: 'https://labour.gov.in' },
    source: { label: 'Maternity Benefit (Amendment) Act, 2017', href: 'https://labour.gov.in' },
    urgent: false,
  },

  // ---------------------------------------------------------------- road
  {
    id: 'rd-dui',
    area: 'Road Laws — drink driving and licence issues',
    module: 'road',
    keywords: [
      'drunk', 'drink', 'driving', 'dui', 'alcohol', 'booze', 'bac', 'breath test', 'breathalyzer',
      'refused test', 'licence suspended', 'license suspended', 'no licence', 'helmet',
      'seat belt', 'seatbelt', 'accident', 'third party', 'insurance claim', 'e-challan',
      'challan', 'traffic police', 'speed', 'number plate', 'drink driving', 'drunk driving',
      'drink and drive',
    ],
    meaning:
      'The Motor Vehicles Act, 1988 governs this. The prescribed limit is 30 mg of alcohol per 100 ml of blood. Riding or driving after drinking is an offence under section 185, and the court may also disqualify your driving licence. Riding without a valid licence or registration is an offence in its own right, and third-party motor insurance is compulsory.',
    rights: [
      'A right to a lawful, reasoned process — a challan can be challenged before the designated authority or in court',
      'The benefit of a third-party insurance policy, which is compulsory under the Motor Vehicles Act',
      'Compensation in an accident where you are not at fault, through the insurer and the Motor Accident Claims Tribunal',
    ],
    steps: [
      { step: 1, text: 'Keep the challan and any notice. You can respond to it before the authority specified in the notice.' },
      { step: 2, text: 'For a third-party accident you did not cause, tell the police, take photos, and note the vehicle number and insurance details.' },
      { step: 3, text: 'Make the claim to the insurer. If the insurer does not settle, the matter can be taken to the Motor Accident Claims Tribunal.' },
      { step: 4, text: 'On national highways, the NHAI highway helpline is 1033.' },
    ],
    resource: { label: 'Parivahan — challan, licence and vehicle services', href: 'https://parivahan.gov.in' },
    source: { label: 'Motor Vehicles Act, 1988', href: 'https://www.indiacode.nic.in' },
    urgent: false,
  },

  // -------------------------------------------------------------- safety
  {
    id: 'sf-stalking',
    area: "Women's Safety — stalking, threats and unsafe situations",
    module: 'safety',
    keywords: [
      'stalking', 'stalker', 'stalked', 'stalking me', 'being stalked', 'following me',
      'eve teasing', 'followed', 'threat', 'threatening', 'unsafe', 'late night',
      'travelling alone', 'helpless', 'scared', 'blackmail', 'exposing', 'photos of me', 'revenge',
      'cyberstalking', 'abusive',
    ],
    meaning:
      'Stalking and criminal intimidation are offences under the Bharatiya Nyaya Sanhita, 2023, which replaced the Indian Penal Code with effect from 1 July 2024. You do not have to wait until something happens. Support is free, confidential and available at any hour.',
    rights: [
      'Protection against stalking, criminal intimidation and assault or criminal force',
      'A complaint that the police are expected to register as an FIR for a cognizable offence — you may ask for a Zero FIR, which can be registered at any police station and later transferred',
      'A protection order and residence order under the Domestic Violence Act, 2005 where the person is a domestic partner',
      'Free legal aid under section 12(c) of the Legal Services Authorities Act, 1987',
    ],
    steps: [
      { step: 1, text: 'If you are in immediate danger, call 112. If you prefer a women operator, call the Women Helpline on 181 or the police women helpline on 1091.' },
      { step: 2, text: 'Preserve the evidence — messages, call logs, photos, CCTV. Do not delete anything.' },
      { step: 3, text: 'Report at your local police station. You can ask for an FIR, and for a Zero FIR if the station is not in your area of jurisdiction.' },
      { step: 4, text: 'Ask your local Legal Services Authority about free legal aid, and about a protection order under the Domestic Violence Act, 2005.' },
    ],
    resource: { label: 'Women Helpline — 181  ·  Women helpline (police) — 1091', href: 'https://wcd.gov.in', number: '181' },
    source: { label: 'Bharatiya Nyaya Sanhita, 2023 / Domestic Violence Act, 2005', href: 'https://www.indiacode.nic.in' },
    urgent: true,
  },
  {
    id: 'sf-workplace',
    area: "Women's Safety — sexual harassment",
    module: 'safety',
    keywords: [
      'harassment', 'harassed', 'sexual harassment', 'unwanted', 'inappropriate', 'touching',
      'misbehaving', 'teacher', 'colleague', 'icc', 'internal committee', 'catcalling',
      'commented on my body', 'touched me', 'icc complaint',
    ],
    meaning:
      'The Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013 covers educational institutions as workplaces and requires an Internal Complaints Committee. A complaint can be made in writing or by email, and the institution is required to act on it.',
    rights: [
      'The right to file a complaint with the Internal Complaints Committee of the institution or employer',
      'A right to the option of filing with the Local Complaints Committee where the ICC has not been constituted',
      'Confidentiality — the identity of the complainant is protected',
    ],
    steps: [
      { step: 1, text: 'Write the complaint down. Note the date, place, what happened and who was present.' },
      { step: 2, text: 'File it with the ICC of your institution in writing or by email, and keep a copy.' },
      { step: 3, text: 'Ask for the outcome in writing within the period the Act allows.' },
      { step: 4, text: 'If the ICC is not constituted or does not act, approach the Local Complaints Committee, or the police. You can also contact the Women Helpline on 181 for support.' },
    ],
    resource: { label: 'Women Helpline — 181', href: 'https://wcd.gov.in', number: '181' },
    source: { label: 'Sexual Harassment of Women at Workplace Act, 2013', href: 'https://www.indiacode.nic.in' },
    urgent: true,
  },

  // ----------------------------------------------------- general / rights
  {
    id: 'g-free-legal-aid',
    area: 'Free legal aid and how to reach a lawyer',
    module: 'fundamental',
    keywords: [
      'legal aid', 'free lawyer', 'free legal', 'afford', 'poverty', 'nalsa', 'lawyer', 'advocate',
      'fir', 'zero fir', 'file a complaint', 'police station',
    ],
    meaning:
      'Free legal services are a statutory right, not a favour. Section 12(c) of the Legal Services Authorities Act, 1987 guarantees free legal services to women and children among others. There is a Legal Services Authority in every district, and lok adalats are organised regularly to settle cases.',
    rights: [
      'Free legal services under the Legal Services Authorities Act, 1987',
      'Lok Adalat, where a settlement is treated as a decree of a civil court',
      'Access to the courts — Article 32 of the Constitution for fundamental rights, Article 226 for High Courts',
    ],
    steps: [
      { step: 1, text: 'Visit your district Legal Services Authority for an eligibility check and a lawyer.' },
      { step: 2, text: 'Check whether the next lok adalat covers your matter at the NALSA site.' },
      { step: 3, text: 'For an urgent police complaint, go to the police station — an FIR can be registered at any station for a cognizable offence, and you may ask for a Zero FIR.' },
      { step: 4, text: 'Use eCourts for case status and filings, and LawLink AI to identify the legal area before you go.' },
    ],
    resource: { label: 'NALSA — National Legal Services Authority', href: 'https://nalsa.gov.in' },
    source: { label: 'Legal Services Authorities Act, 1987', href: 'https://www.indiacode.nic.in' },
    urgent: false,
  },
  {
    id: 'g-emergency',
    area: 'Emergency numbers and where to complain',
    module: 'fundamental',
    keywords: [
      'emergency', 'urgent', 'helpline', 'police number', 'call police', 'ambulance',
      'ambulance number', 'fire brigade', 'fire station', 'medical emergency', 'emergency number',
      'emergency numbers', 'heart attack', 'on fire', 'immediate', 'accident now',
    ],
    meaning:
      'You do not need a lawyer to handle an emergency. 112 connects to police, fire and ambulance. 100 is the police control room, 101 is the fire service, 108 is the ambulance, and 1091 or 181 if you need a woman to answer.',
    rights: [
      'Emergency response without any precondition — no fee, no paperwork',
      'A police complaint that is expected to be registered for a cognizable offence',
      'Free legal aid afterwards through the district Legal Services Authority',
    ],
    steps: [
      { step: 1, text: 'Call 112 for any emergency. If 112 does not connect, call 100 for police, 101 for fire or 108 for an ambulance.' },
      { step: 2, text: 'For a woman in distress, the Women Helpline on 181 and the police women helpline on 1091 are available.' },
      { step: 3, text: 'For cyber fraud, call 1930 — it is free and staffed 24x7.' },
      { step: 4, text: 'For a consumer complaint, call 1915. Once things are safe, use LawLink AI to work out the legal area.' },
    ],
    resource: { label: 'All-in-one emergency response — 112', href: 'https://112.gov.in', number: '112' },
    source: { label: 'National Emergency Response Centre', href: 'https://112.gov.in' },
    urgent: true,
  },
  {
    id: 'g-rights',
    area: 'Fundamental Rights — which right is at play',
    module: 'fundamental',
    keywords: [
      'fundamental right', 'constitution', 'article', 'equality', 'discrimination', 'reservation',
      'speech', 'freedom of speech', 'religion', 'education', 'rti', 'right to information',
      'information', 'privacy right', 'constitutional',
    ],
    meaning:
      'The Constitution of India guarantees a set of fundamental rights in Part III, and the courts can enforce them. For a student the most immediate ones are equality before the law, freedom of speech, the right to education, the right to information, and the right to life and personal liberty, which also covers privacy and dignity.',
    rights: [
      'Equality before the law and protection against discrimination — Articles 14, 15 and 16',
      'Freedom of speech and expression, and freedom to practise a profession — Article 19',
      'The right to life, personal liberty, privacy and dignity — Article 21',
      'The right to ask a public authority for information — Right to Information Act, 2005',
      'The right to a remedy, by approaching the Supreme Court or a High Court — Articles 32 and 226',
    ],
    steps: [
      { step: 1, text: 'Name the right you think is affected before you look for a remedy — it makes the complaint far clearer.' },
      { step: 2, text: 'For a public institution, use the Right to Information Act, 2005 to ask for the records you are not being shown.' },
      { step: 3, text: 'For something a private party did, the civil or consumer route usually fits better than a fundamental rights complaint.' },
      { step: 4, text: 'A public interest litigation can be filed in the Supreme Court or a High Court, usually through a lawyer. Read the actual text of any law on India Code before you rely on it.' },
    ],
    resource: { label: 'India Code — the actual text of central laws', href: 'https://www.indiacode.nic.in' },
    source: { label: 'Constitution of India, Part III', href: 'https://www.indiacode.nic.in' },
    urgent: false,
  },
]

// ------------------------------------------------------------------ matching
const STOP = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'i', 'my', 'me', 'to', 'of', 'and', 'in', 'on', 'it',
  'do', 'did', 'can', 'should', 'would', 'what', 'how', 'for', 'with', 'that', 'this', 'be',
])

// Apostrophes are dropped (didn't -> didnt) and hyphens become spaces (e-challan -> e challan)
// BEFORE the general punctuation strip, so contractions and hyphenated words still match.
function normalise(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/['\u2018\u2019`]/g, '')
    .replace(/[-\u2010-\u2015]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Single words that appear in many unrelated messages ("order", "senior", "speed").
 * A weak word scores 1, so it can support a match but never make one on its own;
 * a strong word ("aadhaar", "stalking", "ragging") scores 3 and can.
 */
const WEAK = new Set([
  'order', 'delivery', 'return', 'cancelled', 'tracking', 'exchange', 'repair', 'damaged', 'broken',
  'course', 'institute', 'batch', 'transfer', 'pin', 'password', 'permissions', 'leak',
  'senior', 'hostel', 'junior', 'pushed', 'forced', 'targeted', 'result', 'grievance', 'withholding',
  'detention', 'holiday', 'notice', 'labour', 'employee', 'fired', 'baby', 'drink', 'driving',
  'accident', 'speed', 'threat', 'unsafe', 'helpless', 'scared', 'abusive', 'followed', 'exposing',
  'unwanted', 'inappropriate', 'touching', 'teacher', 'colleague', 'afford', 'poverty', 'advocate',
  'helpline', 'urgent', 'immediate', 'article', 'equality', 'speech', 'religion', 'education', 'information',
].map(normalise))

function tokens(text) {
  return normalise(text).split(' ').filter((t) => t.length > 2 && !STOP.has(t))
}

/**
 * Score every intent against the message. Multi-word keywords get a strong
 * weight so "never delivered" beats a stray "order".
 */
export function matchIntent(message, allowedModules = null) {
  const text = normalise(message)
  const padded = ` ${text} `
  const words = new Set(tokens(message))

  let best = null
  let bestScore = 0
  let bestHits = 0

  INTENTS.forEach((intent) => {
    if (allowedModules && !allowedModules.includes(intent.module)) return
    let score = 0
    let hits = 0
    for (const raw of intent.keywords) {
      const kw = normalise(raw)
      if (kw.includes(' ')) {
        if (padded.includes(` ${kw} `)) { score += 5; hits += 1 }
      } else if (words.has(kw)) {
        score += WEAK.has(kw) ? 1 : 3
        hits += 1
      } else if (!WEAK.has(kw) && kw.length > 4 && text.includes(kw)) {
        score += 1 // stem hit, e.g. "seniors" for "senior"
        hits += 1
      }
    }
    // Deterministic tie-break: score, then distinct hits, then urgent intents, then list order.
    const better =
      score > bestScore ||
      (score === bestScore && score > 0 && (hits > bestHits || (hits === bestHits && intent.urgent && !best?.urgent)))
    if (better) {
      best = intent
      bestScore = score
      bestHits = hits
    }
  })

  return { intent: bestScore >= 3 ? best : null, score: bestScore }
}

/** Build the structured reply the chat UI renders. */
export function buildReply(intent, question) {
  if (!intent) return null
  return {
    id: intent.id,
    area: intent.area,
    module: intent.module,
    meaning: intent.meaning,
    rights: intent.rights || [],
    steps: intent.steps,
    resource: intent.resource,
    source: intent.source,
    urgent: intent.urgent,
    disclaimer: DISCLAIMER,
    asked: question,
  }
}

export const suggestedFollowUps = (intent) => {
  if (!intent) return []
  const map = {
    'c-order-missing': ['What if the seller refuses the refund?', 'How long does a consumer case take?'],
    'c-defective': ['What if the company says the warranty expired?', 'How do I write the complaint?'],
    'cy-money-lost': ['Will I get the money back?', 'What evidence should I keep?'],
    'cy-otp': ['I already shared the OTP. What now?', 'How do I report a fake bank call?'],
    'st-ragging': ['Who can I tell about this?', 'What if my college does nothing?'],
    'wp-salary': ['What if I have no written contract?', 'How do I claim provident fund?'],
    'rd-dui': ['Can I challenge the challan?', 'What if I caused the accident?'],
    'sf-stalking': ['What is a Zero FIR?', 'How do I get free legal aid?'],
    'sf-workplace': ['What is the ICC and how do I file?', 'Can my identity stay confidential?'],
    'pv-data': ['Can a college app ask for my Aadhaar?', 'How do I get my data deleted?'],
    'g-free-legal-aid': ['Am I eligible for free legal aid?', 'What is a lok adalat?'],
    'g-rights': ['What is Article 21?', 'How do I use the RTI Act?'],
  }
  return map[intent.id] || []
}

