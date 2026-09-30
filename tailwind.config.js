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
        // Tonal surface ladder — replaces white-alpha borders as the separation method.
        surface: {
          0: '#06080E',
          1: '#0D1220',
          2: '#131A29',
          3: '#1A2231',
          4: '#232D3F',
        },
        ink: {
          950: '#06080E',
          900: '#080B14',
          850: '#0B0F1A',
          800: '#0F1420',
          700: '#151B2B',
          600: '#1D2436',
        },
        line: 'rgba(255,255,255,0.07)',

        electric: {
          50: '#EEF3FF',
          100: '#DCE6FF',
          200: '#B9CCFF',
          300: '#8FA9FF',
          400: '#6A8BFF',
          500: '#4D7CFE',
          600: '#2F5FE0',
          700: '#2449AE',
          800: '#1B3784',
          900: '#152A63',
        },
        violet2: {
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7442E0',
          700: '#5B32B4',
        },
        xp: {
          200: '#FFE7A8',
          300: '#FFD570',
          400: '#F5B942',
          500: '#E5A320',
          600: '#B87E12',
        },
        good: '#22C55E',
        warn: '#F97316',
        danger: '#EF4444',

        fg: '#E9EDF7',
        'fg-muted': '#98A2B8',
        // Retuned from #6B7691, which failed 4.5:1 on raised surfaces for caption text.
        'fg-dim': '#7A85A3',
        // Decorative, non-load-bearing marks only (lock glyphs, disabled).
        'fg-faint': '#5C6780',
      },

      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        body: ['Inter', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        // The "law" half of legal literacy. Four permitted roles only — see council doc R4.
        serif: ['Newsreader', 'Georgia', 'serif'],
      },

      // Bound scale. `display` is words-only and max 1 per screen.
      fontSize: {
        display: ['64px', { lineHeight: '0.92', letterSpacing: '-0.045em', fontWeight: '800' }],
        t1: ['34px', { lineHeight: '1.06', letterSpacing: '-0.032em', fontWeight: '700' }],
        t2: ['21px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        t3: ['16px', { lineHeight: '1.35', letterSpacing: '-0.012em', fontWeight: '600' }],
        lead: ['16px', { lineHeight: '1.62', letterSpacing: '-0.006em' }],
        body: ['13.5px', { lineHeight: '1.55' }],
        caption: ['12px', { lineHeight: '1.45' }],
        micro: ['11px', { lineHeight: '1.35' }],
        'num-xl': ['56px', { lineHeight: '0.9', letterSpacing: '-0.04em', fontWeight: '800' }],
        'num-lg': ['30px', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '700' }],
        num: ['15px', { lineHeight: '1.4', letterSpacing: '-0.01em', fontWeight: '600' }],
      },

      borderRadius: {
        '4xl': '28px',
      },

      boxShadow: {
        // Depth is tonal + one inset highlight + one soft drop. No outer border.
        sheet: 'inset 0 1px 0 0 rgba(255,255,255,.055), 0 28px 56px -34px rgba(0,0,0,.85)',
        'sheet-lg': 'inset 0 1px 0 0 rgba(255,255,255,.07), 0 40px 80px -32px rgba(0,0,0,.9)',
        overlay: 'inset 0 1px 0 0 rgba(255,255,255,.08), 0 48px 96px -28px rgba(0,0,0,.95)',
        glow: '0 0 28px -8px rgba(77,124,254,.60)',
        'glow-violet': '0 0 24px -10px rgba(139,92,246,.50)',
        'glow-xp': '0 0 26px -8px rgba(245,185,66,.55)',
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
