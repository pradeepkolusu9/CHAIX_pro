import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

export default [
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'docs/**'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // The new JSX transform makes these obsolete.
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      // A stray apostrophe in copy is not a correctness problem, and `&rsquo;`
      // in a string literal is worse than a bare quote. Curly-quote it instead.
      'react/no-unescaped-entities': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    // One-off maintenance scripts. These are `.cjs` CommonJS, so they are the only
    // files in the repo that are NOT modules — and the only ones that need the
    // Node globals. The build configs stay ESM: `package.json` sets
    // "type": "module", so `vite.config.js` legitimately uses `import`/`export`.
    files: ['scripts/**/*.cjs'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
  },
]
