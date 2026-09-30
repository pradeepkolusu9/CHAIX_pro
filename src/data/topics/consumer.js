export default {
  id: 'consumer',
  sigil: 'consumer',
  name: 'Consumer Rights',
  tagline: 'When you are short-changed, and what to do about it',
  difficulty: 'Foundation',
  minutes: 12,
  accent: 'electric',
  blurb: 'Refunds, defects, hidden fees and vanished coaching fees — the law on your side.',

  intro: {
    heading: 'Why this matters to you',
    body: [
      'Every order you place, every course you pay for and every fee on a checkout page makes you a consumer under Indian law. That word carries rights — including the right to be told the real price and the right to complain when the service is bad.',
      'The Consumer Protection Act, 2019 replaced the older 1986 law and widened those rights. Buying online is covered, and a coaching institute, a gym membership or a recharge plan is a "service" in exactly the way a phone is a "good".',
      'Most students never complain, so most bad sellers never get corrected. You do not need a lawyer to start. An invoice, a few screenshots and a complaint on the National Consumer Helpline are usually enough to move a seller.',
    ],
    keyPoints: [
      'Buying online makes you a consumer too',
      'Keep invoices, order IDs and screenshots',
      'A refused refund is a legal grievance, not a favour',
      'National Consumer Helpline: 1915',
    ],
  },

  legalBasis: {
    law: 'Consumer Protection Act, 2019',
    section: 'Section 2(7) — who counts as a "consumer"',
    note: 'Gives you a legal right against a seller who will not deliver, repair or refund.',
  },
  authority: {
    name: 'District Consumer Disputes Redressal Commission',
    role: 'Where consumer complaints are formally heard',
    link: 'https://consumerhelpline.gov.in',
  },
  source: 'https://www.indiacode.nic.in',
  lastVerified: '2026-09-30',

  lessons: [
    {
      id: 'ls-co-1',
      title: 'You are a consumer, even online',
      body: [
        'Section 2(7) of the Consumer Protection Act, 2019 defines a consumer as someone who buys goods or hires or avails services for a consideration that is paid, promised or partly paid. Buying a laptop on a shopping app counts. So does paying an institute for a course you have not started yet.',
        'Section 6 sets out your core rights: safety, being informed, being able to choose, and seeking redressal when a seller falls short. The same rights apply to a physical shop and to a website, because the Act does not care how the payment was made.',
        'The rules made under the Act for e-commerce sellers require them to show the total price clearly, publish a return, refund and cancellation policy, and name a grievance officer. A seller who hides charges or will not state a return policy is already breaking the rules, before you have argued a single word.',
      ],
      takeaway: 'Paid or promised, online or offline — if it is a good or a service, the Act is on your side.',
    },
    {
      id: 'ls-co-2',
      title: 'Bad goods, worse service, unfair terms',
      body: [
        'Section 29 gives you remedies when a seller fails to deliver or supplies defective goods, including a refund of the price and, where a defect is not cured, a replacement. Section 34 deals with deficiency in service: a course that is never taught, a laptop nobody will repair, a complaint that gets no reply.',
        'Section 38 lets a Commission declare a contract term unfair where it puts your rights at a serious disadvantage. Locked-in fees, auto-renewals and blanket "no refunds" clauses are the usual examples. Section 69 separately catches false or misleading information in advertisements.',
        'The route runs from the National Consumer Helpline on 1915, to a written complaint to the seller, to the Consumer Disputes Redressal Commissions at District, State and National level. Each level is more formal, and the National level can be approached directly in certain complaints.',
      ],
      takeaway: 'Refund, repair, replacement or compensation — the Act gives you a menu, not a favour.',
    },
  ],

  scenarios: [
    {
      id: 'sc-co-1',
      title: 'The order that never came',
      situation:
        'You paid ₹18,500 for a laptop on a marketplace app on 3 September. The listing promised delivery in four days. It is now 2 October, the seller has stopped replying, and the app still shows "order confirmed".',
      options: [
        { id: 'a', text: 'Keep waiting — sellers often take a month to deliver' },
        { id: 'b', text: 'Save the order page, payment receipt and chats' },
        { id: 'c', text: 'Cancel the payment from your bank and keep the money' },
        { id: 'd', text: 'Leave a review on the app warning other buyers' },
      ],
      correct: 'b',
      why: 'Once the promised delivery date has passed and the seller has gone quiet, this is a failure to deliver, which Section 29 lets you claim on. Your payment receipt and the order page are the proof, so capture them before anything disappears. E-commerce rules also require the seller to have a named grievance officer you can write to.',
      rights: [
        'Section 29 gives you remedies when a seller fails to deliver the goods you paid for',
        'An e-commerce seller must have a grievance officer and a published refund policy',
        'You can claim a refund of the price, not just a replacement',
      ],
      doThis: [
        { step: 1, text: 'Screenshot the order page, the payment success message, the delivery promise and every chat, with the dates visible.' },
        { step: 2, text: 'Send a written complaint to the seller and to the grievance contact given in the app\'s terms and conditions.' },
        { step: 3, text: 'Call the National Consumer Helpline on 1915 or file the complaint online, and note the reference number.' },
        { step: 4, text: 'If the refund still does not come, file before the District Commission in your area with all receipts.' },
      ],
      law: 'Consumer Protection Act, 2019 — s.29 (failure to deliver goods) and e-commerce seller duties',
      source: 'https://consumerhelpline.gov.in',
      lastVerified: '2026-09-30',
      hint: 'Preserve the proof first — order pages and receipts can be deleted.',
    },
    {
      id: 'sc-co-2',
      title: 'Warranty refused, refund declined',
      situation:
        'Your phone screen cracked three weeks after you bought it. The seller took the phone in for repair, then said the damage was pre-existing and returned it unrepaired. They now say refunds are only for items returned within seven days.',
      options: [
        { id: 'a', text: 'Accept it — a seven-day window in a policy you did not read is' },
        { id: 'b', text: 'Push back in the app chat until the seller admits the crack was' },
        { id: 'c', text: 'Buy a new screen yourself and stop pursuing the matter' },
        { id: 'd', text: 'Complain in writing citing the defect and the missing return' },
      ],
      correct: 'd',
      why: 'A return window can limit a genuine change-of-mind return, but it cannot be used to switch off your remedy for a defect. Section 29 covers defective goods and Section 34 covers a repair that is refused or botched. A clause that works that way is the kind of term Section 38 allows a Commission to treat as unfair.',
      rights: [
        'Section 29: defective goods can mean refund, repair, replacement or a lower price',
        'Section 34: a refused or botched repair is a deficiency in service',
        'Section 38: a blanket no-refund clause can be declared an unfair contract term',
      ],
      doThis: [
        { step: 1, text: 'Get a written or photographed condition report of the phone at the moment the seller took it in.' },
        { step: 2, text: 'Write to the seller\'s grievance officer with the defect, the dates and your invoice number.' },
        { step: 3, text: 'Call 1915 or complain online if there is no reply within a reasonable time.' },
        { step: 4, text: 'If it is still unresolved, file before the District Commission with the receipt and the chats.' },
      ],
      law: 'Consumer Protection Act, 2019 — s.29, s.34 and s.38',
      source: 'https://consumerhelpline.gov.in',
      lastVerified: '2026-09-30',
      hint: 'A change-of-mind window is not a licence to ignore a defect.',
    },
    {
      id: 'sc-co-3',
      title: 'The coaching fee that vanished',
      situation:
        'You paid ₹12,000 as a "processing fee" to a coaching centre for a six-month batch. Three weeks later the office is shut, the phone number is switched off, and the founder has not replied to the twelve other students asking the same question.',
      options: [
        { id: 'a', text: 'Collect everyone\'s receipts, complain on 1915' },
        { id: 'b', text: 'Post the founder\'s photos and number online to create' },
        { id: 'c', text: 'Keep messaging the WhatsApp centre until they reply' },
        { id: 'd', text: 'File only with the police and wait for their reply' },
      ],
      correct: 'a',
      why: 'Coaching is a service, so paying a fee makes you a consumer, and an unexplained failure to provide that service is a deficiency in service under Section 34. A group complaint with matching documents carries far more weight than twelve separate ones. The police route matters for cheating, but the consumer route is usually faster for getting the money back.',
      rights: [
        'Section 34: a fee paid for a service that is never delivered is a deficiency in service',
        'Affected students can generally be allowed to pursue a complaint together',
        'You may claim a refund, and compensation where the loss can be shown',
      ],
      doThis: [
        { step: 1, text: 'Save every receipt, payment screenshot, admission message and a photo of the closed office.' },
        { step: 2, text: 'Put the other students in one group and collect each person\'s documents into a single folder.' },
        { step: 3, text: 'Call the National Consumer Helpline on 1915, file the complaint online, and note the reference number.' },
        { step: 4, text: 'If there is no response, file before the District Commission where the centre is registered.' },
      ],
      law: 'Consumer Protection Act, 2019 — s.2(7) and s.34 (deficiency in service)',
      source: 'https://consumerhelpline.gov.in',
      lastVerified: '2026-09-30',
      hint: 'A group complaint with matching documents moves faster than many small ones.',
    },
    {
      id: 'sc-co-4',
      title: 'The fee that was never listed',
      // The cold open. A scenario with no time and no place has no "now" to act
      // in, so the ₹36 reads as a fact rather than a threat.
      stamp: 'Tonight · the recharge confirmation screen',
      situation:
        'Your mobile recharge of ₹299 shows a "service fee" of ₹36 on the bill, and the operator\'s plan page mentioned no such charge. A friend on the same plan shows no fee at all.',
      options: [
        { id: 'a', text: 'Write to the operator and ask for the ₹36 back' },
        { id: 'b', text: 'Pay it quietly — the bill is the final word and arguing' },
        { id: 'c', text: 'Deduct the ₹36 from next month\'s payment and leave it there' },
        { id: 'd', text: 'Cancel the recharge and move to a different operator' },
      ],
      correct: 'a',
      why: 'A charge you were not told about before you paid is what the right to be informed under Section 6 is meant to prevent. Two bills for the same plan showing different charges is strong, simple evidence. Reversing a small undeclared charge usually happens at the grievance stage, without a Commission.',
      rights: [
        'The right to be informed is one of the core consumer rights under Section 6',
        'Section 69 catches false or misleading information about what is being sold',
        'A written grievance to the seller is a step you can take before any formal complaint',
      ],
      doThis: [
        { step: 1, text: 'Screenshot the operator\'s plan page and both bills, and keep them dated.' },
        { step: 2, text: 'Use the operator\'s in-app grievance channel and note the ticket number.' },
        { step: 3, text: 'If the charge is not reversed, call the National Consumer Helpline on 1915.' },
        { step: 4, text: 'If it is still not reversed, file before the District Commission with both bills attached.' },
      ],
      law: 'Consumer Protection Act, 2019 — s.6 (right to be informed) and s.69 (misleading information)',
      source: 'https://consumerhelpline.gov.in',
      lastVerified: '2026-09-30',
      hint: 'Two bills, same plan, different charges — that comparison is your evidence.',
    },
    {
      id: 'sc-co-5',
      title: 'A gym that will not refund',
      situation:
        'You cancelled a six-month gym membership in writing inside the trial period, exactly as the contract allows. The gym says the amount can only be used for future months, never refunded, and the plan auto-renews unless you cancel again within seven days.',
      options: [
        { id: 'a', text: 'Accept the credit on offer, since it is an alternative to cash' },
        { id: 'b', text: 'Cancel every seven days from now on and hope the auto-renewal eventually stops' },
        { id: 'c', text: 'Send a fresh written cancellation, ask them to name the clause they rely on' },
        { id: 'd', text: 'Stay quiet and use the membership so the auto-renewal looks justified' },
      ],
      correct: 'c',
      why: 'A clause that blocks a refund you are entitled to, paired with a rolling seven-day auto-renewal you never clearly agreed to, is the pattern Section 38 lets a Commission examine as unfair. Making the gym point to the exact clause turns an argument into a record. Repeatedly cancelling without ever writing to them leaves you with no complaint on file.',
      rights: [
        'Section 38: unfair contract terms can be declared void by a Commission',
        'A contract is enforced as written, not as the seller now wishes it to read',
        'A grievance you never actually made is not a grievance you can rely on later',
      ],
      doThis: [
        { step: 1, text: 'Read the contract for the cancellation clause, the notice method and any cooling-off period.' },
        { step: 2, text: 'Send the cancellation by the method the contract specifies — email beats a phone call — and save proof of sending.' },
        { step: 3, text: 'Write again asking for the clause number relied on and a written refund confirmation.' },
        { step: 4, text: 'If the reply is vague or absent, complain on 1915 and then approach the District Commission.' },
      ],
      law: 'Consumer Protection Act, 2019 — s.38 (unfair contract terms)',
      source: 'https://consumerhelpline.gov.in',
      lastVerified: '2026-09-30',
      // Neutral: names the tension without handing over the tactic. The previous
      // wording ("ask them to name the clause") was 50% of the correct option's
      // vocabulary, so the hint was a compressed answer key.
      hint: 'You signed something. What does it actually say, and who decides that?',
    },
  ],

  quiz: [
    {
      id: 'q-co-1',
      question: 'Your online order arrived with a cracked screen. Which step makes your complaint strongest?',
      options: [
        'Photograph it and message the seller informally on social media',
        'Save the invoice, order ID, photos and chat history before anything is returned',
        'Send it back with no note, so the seller cannot tie it to your account',
      ],
      correct: 1,
      why: 'A complaint is only as strong as its paperwork. Invoice, order ID, photos and chats together show what was bought, what you paid and what went wrong. An informal social media message is not part of the record a Commission can rely on.',
      law: 'Consumer Protection Act, 2019 — s.29 (remedies for defective goods)',
      source: 'https://consumerhelpline.gov.in',
    },
    {
      id: 'q-co-2',
      question: 'Under the Consumer Protection Act, 2019, which of these is a "consumer"?',
      options: [
        'Only someone who buys in a physical shop with a printed bill',
        'Only someone whose purchase is above a fixed value',
        'Anyone who buys goods or avails services for a consideration paid, promised or partly paid, including online',
        'Only someone who has taken a loan to pay for the purchase',
      ],
      correct: 2,
      why: 'Section 2(7) covers goods and services, and the payment may be paid, promised or partly paid. Online and e-tailing purchases are expressly included, so the same rule applies on an app as in a shop. The definition itself does not attach to a minimum value.',
      law: 'Consumer Protection Act, 2019 — s.2(7)',
      source: 'https://www.indiacode.nic.in',
    },
    {
      id: 'q-co-3',
      question: 'A coaching centre took your ₹12,000 processing fee and has shut down. Which provision fits best?',
      options: [
        'Section 34 — deficiency in service',
        'Section 2(7) — the definition of a consumer',
        'Section 69 — misleading advertisement',
      ],
      correct: 0,
      why: 'Coaching is a service, and taking the fee without providing it is a deficiency in service. Section 34 is where that is addressed, and it also covers services promised and never delivered. Section 2(7) only tells you that you qualify, and Section 69 is about advertisements.',
      law: 'Consumer Protection Act, 2019 — s.34',
      source: 'https://consumerhelpline.gov.in',
    },
    {
      id: 'q-co-4',
      question: 'A gym auto-renews every month unless you cancel within seven days, and never refunds cash. What is the strongest move?',
      options: [
        'Keep using the gym so the auto-renewal looks reasonable',
        'Accept the credit offered instead of a refund',
        'Keep cancelling silently every seven days without writing to them',
        'Cancel in writing, ask them to name the clause relied on, and complain to the helpline if the answer is unclear',
      ],
      correct: 3,
      why: 'Unfair contract terms are dealt with under Section 38, and a term that defeats a refund you are entitled to is a standard example. Making the seller point to the exact clause is what turns an argument into a usable record. A Commission can declare such a term void.',
      law: 'Consumer Protection Act, 2019 — s.38 (unfair contract terms)',
      source: 'https://consumerhelpline.gov.in',
    },
    {
      id: 'q-co-5',
      question: 'What is 1915?',
      options: [
        'The police emergency number',
        'The National Consumer Helpline for consumer complaints',
        'The helpline for online financial fraud',
      ],
      correct: 1,
      why: '1915 is the National Consumer Helpline, and it is the fastest official first step for a grievance about a product or service. It is free and covers categories including e-commerce. Police on 100 and the cyber fraud helpline on 1930 do different jobs.',
      law: 'National Consumer Helpline (Department of Consumer Affairs)',
      source: 'https://consumerhelpline.gov.in',
    },
    {
      id: 'q-co-6',
      question: 'A site shows ₹2,499 for a course, then adds a ₹500 "processing fee" at checkout. How is this treated?',
      options: [
        'It is acceptable, as long as the fee appears on the final bill',
        'It is a failure to disclose the total price, because the price you agreed to was not the price you were charged',
        'It is acceptable only where the fee stays under ₹1,000',
      ],
      correct: 1,
      why: 'The right to be informed under Section 6, together with the e-commerce rules, requires the total price to be shown clearly. A charge added at checkout that changes the price you agreed to is exactly what that is meant to stop. There is no small amount that makes an undeclared charge fine.',
      law: 'Consumer Protection Act, 2019 — s.6 (right to be informed) and e-commerce rules',
      source: 'https://consumerhelpline.gov.in',
    },
    {
      id: 'q-co-7',
      question: 'Which body formally hears a consumer complaint after the helpline stage?',
      options: [
        'The District Court, under the Civil Code',
        'The Reserve Bank of India, for every kind of complaint',
        'The municipal corporation, which can order a refund from a shop',
        'The Consumer Disputes Redressal Commissions, starting at District level',
      ],
      correct: 3,
      why: 'The Consumer Disputes Redressal Commissions are set up by the Act specifically to hear consumer complaints, at District, State and National level. The helpline and the seller\'s grievance officer come before that, not instead of it. An order that does not settle the matter can be taken higher.',
      law: 'Consumer Protection Act, 2019 — s.47 (Consumer Disputes Redressal Commissions)',
      source: 'https://consumerhelpline.gov.in',
    },
    {
      id: 'q-co-8',
      question: 'A seller answers your complaint with "policy not applicable". What is the best response?',
      options: [
        'Accept the answer, since the seller wrote the policy',
        'Post the reply online so other buyers can warn people',
        'Ask which clause applies, keep the reply in writing, and add it to your complaint file',
        'Stop replying, because a written reply closes the matter',
      ],
      correct: 2,
      why: 'A policy only matters once the seller can point to the clause and show it was disclosed to you. Getting that clause named in writing lets you test it against the unfair contract terms provision. Silence, however long, does not end a complaint you never actually raised.',
      law: 'Consumer Protection Act, 2019 — s.38 (unfair contract terms)',
      source: 'https://consumerhelpline.gov.in',
    },
  ],

  resources: [
    { label: 'National Consumer Helpline — 1915', href: 'https://consumerhelpline.gov.in' },
    { label: 'India Code — Consumer Protection Act, 2019', href: 'https://www.indiacode.nic.in' },
    { label: 'Department of Consumer Affairs', href: 'https://consumeraffairs.nic.in' },
  ],

  emergency: [
    { label: 'National Consumer Helpline', number: '1915', note: 'Free national helpline for consumer complaints' },
    { label: 'Police emergency', number: '100', note: 'For fraud, threats or personal safety' },
    { label: 'All-in-one emergency response', number: '112', note: 'Police, fire, ambulance' },
  ],
}
