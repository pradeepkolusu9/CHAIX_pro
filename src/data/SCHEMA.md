# LawLink content schema (authoritative)

Every topic file in `src/data/topics/` MUST `export default` a single object matching this shape.
No extra top-level keys. Keep copy plain Indian-English — short sentences, no legalese.

```js
export default {
  id: 'consumer',                       // must equal filename
  sigil: 'consumer',                    // key of the module's mark in the UI (no emoji field)
  name: 'Consumer Rights',              // display name
  tagline: 'One line, max ~60 chars',   // card subtitle
  difficulty: 'Foundation' | 'Intermediate' | 'Advanced',
  minutes: 12,                          // estimated minutes, integer
  accent: 'electric' | 'violet' | 'xp', // maps to design tokens
  blurb: 'One sentence shown on the Learn grid.',

  // ---------------------------------------------------------------- intro
  intro: {
    heading: 'Why this matters to you',
    body: ['para', 'para'],             // 2–3 SHORT paragraphs. Never a wall of text.
    keyPoints: ['bullet', 'bullet'],   // 3–4 bullets, max 12 words each
  },

  // ------------------------------------------------------- legal trust block
  legalBasis: {
    law: 'Consumer Protection Act, 2019',
    section: 'Section 2(7) — who is a "consumer"',   // max ~70 chars
    note: 'one short plain sentence on what it does for a student',
  },
  authority: {
    name: 'District Consumer Disputes Redressal Commission',
    role: 'Where consumer complaints are formally heard',
    link: 'https://consumerhelpline.gov.in',
  },
  source: 'https://www.indiacode.nic.in',
  lastVerified: '2026-09-30',           // ISO date — the date the content was AUTHORED (draft).
                                        // NOT a legal sign-off. UI should label it 'Drafted'
                                        // (see LAST_VERIFIED_LABEL in src/lib/review.js).

  // -------------------------------------------------------------- lessons
  lessons: [                             // 2 short "read" cards, each worth 20 XP
    {
      id: 'ls-co-1',                     // must be prefixed ls-<moduleShort>-
      title: 'Short title',
      body: ['para', 'para'],            // 2–3 SHORT paragraphs
      takeaway: 'One sentence you would tell a friend.',
    },
  ],

  // ------------------------------------------------------------ scenarios
  scenarios: [                           // 5 per module, each worth 50 XP
    {
      id: 'sc-co-1',                     // must be prefixed sc-<moduleShort>-
      title: '4–6 word title',
      situation: 'The story. 2–4 sentences, second person, concrete numbers.',
      options: [
        { id: 'a', text: 'Option A' },   // 4 options
        { id: 'b', text: 'Option B' },
        { id: 'c', text: 'Option C' },
        { id: 'd', text: 'Option D' },
      ],
      correct: 'b',                      // the option id that is RIGHT
      why: 'WHY this is right. 2–3 sentences. Name the right, not just the option.',
      rights: ['Right you have', 'Right you have'],          // 2–3 bullets
      doThis: [                                               // 3–4 practical steps
        { step: 1, text: 'Concrete action the student takes today.' },
      ],
      law: 'Consumer Protection Act, 2019 — s.35',            // shown in trust block
      source: 'https://consumerhelpline.gov.in',
      lastVerified: '2026-09-30',           // authored/drafted date, not a legal check
      hint: 'Optional one-line nudge shown before answering.',
    },
  ],

  // ----------------------------------------------------------------- quiz
  quiz: [                                // 8 per module, 25 XP each when correct; EXACTLY 4 options each
    {
      id: 'q-co-1',                      // must be prefixed q-<moduleShort>-
      question: 'A question a student would actually ask.',
      options: ['Text A', 'Text B', 'Text C', 'Text D'],     // plain strings
      correct: 1,                         // INDEX into options
      why: 'Explanation shown after answering. 2–3 sentences.',
      law: 'Consumer Protection Act, 2019 — s.2(7)',
      source: 'https://consumerhelpline.gov.in',
    },
  ],

  // ------------------------------------------------------------ resources
  resources: [                           // 2–4 verified links
    { label: 'National Consumer Helpline — 1915', href: 'https://consumerhelpline.gov.in' },
  ],

  // ------------------------------------------------------------ emergency
  emergency: [                           // 0–3, only real numbers
    { label: 'Police emergency', number: '100', note: 'Police control room' },
  ],
}
```

## Hard rules

1. **Never invent** a law, section number, helpline, authority, URL, or procedure. If you are not
   certain a section number is right, write the Act name and describe the provision in words instead.
2. Every scenario/quiz object that states a legal position MUST carry `law`, `source`, `lastVerified`.
3. Only these emergency numbers may be used anywhere in the app:
   `112, 100, 101, 108, 1076, 1073, 1091, 1098, 181, 1930, 1915, 1033`.
   Anything else must be a website link, not a number.
   Meanings: 112 all-in-one, 100 police, 101 FIRE, 108 ambulance, 1091 women helpline (run with the
   police), 181 Women Helpline (Ministry of Women and Child Development), 1098 Childline, 1930 cyber
   fraud, 1915 consumer helpline, 1033 highway helpline (NHAI). 101 is NOT an ambulance number.
4. Options must be plausible. Never make a wrong answer obviously silly ("ignore it completely").
5. Spread the correct answer across all four positions (0-3) roughly evenly. The correct option must
   not be identifiable by length: keep it the uniquely longest in well under a third of the questions.
   Every option must be a complete sentence — never cut mid-sentence (tests/option-grammar.test.js).
6. Keep the tone calm and practical. No scolding, no jokes at the user's expense.
7. No lorem ipsum, no TODOs, no "coming soon". Every field must be real content.
8. Statutes that were replaced: cite the current law. The Indian Evidence Act, 1872 (s.65B) is now the
   Bharatiya Sakshya Adhiniyam, 2023 (s.63); the CrPC is 1973 and BNSS/BNS/BSA are in force from
   1 July 2024. There is no central "Ragging Prohibition Act" — cite the UGC Regulations on Curbing the
   Menace of Ragging in Higher Educational Institutions, 2009 and state laws.
9. Where a point of law is contested, soften the sentence so it is true under either reading and add a
   `// needsLawyer:` comment; list it in LAWYER_FLAGS in src/lib/review.js.
