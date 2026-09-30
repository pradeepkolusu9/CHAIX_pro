/**
 * LawLink design system — v2 (council-issued).
 *
 * Council doc: docs/council/01-visual-language.md
 *
 * Three structural changes from v1:
 *  1. A BOUND type scale. `.display` now carries its own size, so it can no longer be
 *     re-used as a weight class on whatever the author liked. Numerals get a separate
 *     ladder (num-xl / num-lg / num) because they are the load-bearing data here.
 *  2. Tonal SURFACES instead of outlined boxes. Depth comes from a tonal step + one
 *     inset highlight + one soft drop, never from a 1px white border on every element.
 *  3. Every hue mapped to exactly one job. See the colour table in the council doc.
 */

/** Semantic colour jobs — do not use these hues for anything else.
 *  electric = action & progress · xp = value earned · violet2 = level identity
 *  good = verified/correct · warn = heat (streak, time) · danger = urgent/limit */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // HEAVEN — luminous light theme. Neutrals are INDIGO-tinted (never grey) so every
        // wash, hairline and shadow sits in the same family as the brand blue.
        // `white` is the ink wash colour: bg-white/[.06] etc. become soft blue-ink tints.
        // `pure` is a literal white (text on solid brand fills).
        white: '#14224F',
        pure: '#FFFFFF',

        surface: {
          0: '#F4F7FF', // canvas
          1: '#FFFFFF', // cards
          2: '#F8FAFF',
          3: '#ECF1FF',
          4: '#E1E9FC',
        },
        ink: {
          950: '#0A1230',
          900: '#0F1B3D',
          850: '#1B2A57',
          800: '#2F3E66',
          700: '#3B4A6B',
          600: '#56668A',
        },
        line: 'rgba(20,34,79,0.08)',

        // 300 = readable blue TEXT (7:1 on white), 500 = action fill, 400 = light fill
        electric: {
          50: '#EEF3FF',
          100: '#DCE6FF',
          200: '#2748D8',
          300: '#2748D8',
          400: '#6C8DFF',
          500: '#3D63F5',
          600: '#3050E0',
          700: '#2440B8',
          800: '#1B3184',
          900: '#152563',
        },
        // level identity
        violet2: {
          300: '#5B3FD9',
          400: '#8E73FF',
          500: '#7C5CFC',
          600: '#6A49EE',
          700: '#5B3FD9',
        },
        // reward honey: 300 = readable amber TEXT, 400-600 = warm fills
        xp: {
          200: '#FFE9A8',
          300: '#9A4A08',
          400: '#F7B32B',
          500: '#F59E0B',
          600: '#D97706',
        },
        good: '#0A6E4A',
        warn: '#C2410C',
        danger: '#C81E45',

        fg: '#0F1B3D',
        'fg-muted': '#3B4A6B',
        'fg-dim': '#56668A',
        'fg-faint': '#52618A',
      },

      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        body: ['Inter', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        // The "law" half of legal literacy. Four permitted roles only — see council doc R4.
        serif: ['Newsreader', 'Georgia', 'serif'],
      },

      // Bound scale. `display` is words-only and max 1 per screen.
      fontSize: {
        display: ['64px', { lineHeight: '0.98', letterSpacing: '-0.038em', fontWeight: '800' }],
        t1: ['34px', { lineHeight: '1.1', letterSpacing: '-0.028em', fontWeight: '750' }],
        t2: ['21px', { lineHeight: '1.25', letterSpacing: '-0.018em', fontWeight: '700' }],
        t3: ['16px', { lineHeight: '1.35', letterSpacing: '-0.012em', fontWeight: '600' }],
        lead: ['17px', { lineHeight: '1.62', letterSpacing: '-0.006em' }],
        body: ['15px', { lineHeight: '1.6' }],
        caption: ['13px', { lineHeight: '1.45' }],
        micro: ['12px', { lineHeight: '1.35' }],
        'num-xl': ['56px', { lineHeight: '0.9', letterSpacing: '-0.04em', fontWeight: '800' }],
        'num-lg': ['30px', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '700' }],
        num: ['15px', { lineHeight: '1.4', letterSpacing: '-0.01em', fontWeight: '600' }],
      },

      borderRadius: {
        '4xl': '28px',
      },

      boxShadow: {
        // Layered, indigo-tinted, floating. Three depths.
        sheet: '0 1px 1px rgba(20,34,79,.04), 0 8px 24px -10px rgba(61,99,245,.12), 0 24px 48px -28px rgba(20,34,79,.12)',
        'sheet-lg': '0 2px 2px rgba(20,34,79,.04), 0 16px 40px -14px rgba(61,99,245,.18), 0 40px 80px -36px rgba(20,34,79,.16)',
        overlay: '0 32px 80px -20px rgba(15,27,61,.34)',
        glow: '0 10px 26px -8px rgba(61,99,245,.55), inset 0 1px 0 rgba(255,255,255,.28)',
        'glow-violet': '0 10px 26px -10px rgba(124,92,252,.50)',
        'glow-xp': '0 10px 28px -8px rgba(245,158,11,.55)',
      },

      keyframes: {
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(77,124,254,0.45)' },
          '70%': { boxShadow: '0 0 0 16px rgba(77,124,254,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(77,124,254,0)' },
        },
        // One of exactly two permitted infinite loops (the other is the journey
        // current-node pulse). The streak is the one thing allowed to feel alive.
        flame: {
          '0%,100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-1.5px) scale(1.06)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-500px 0' },
          '100%': { backgroundPosition: '500px 0' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.4,0,0.6,1) infinite',
        flame: 'flame 1.9s ease-in-out infinite',
        shimmer: 'shimmer 2.2s linear infinite',
      },
    },
  },
  plugins: [],
}
