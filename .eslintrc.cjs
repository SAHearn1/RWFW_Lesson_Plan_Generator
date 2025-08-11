// .eslintrc.cjs
module.exports = {
  root: true,
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'public/',
    'dist/',
    '**/__tests__/**',
    '**/__mocks__/**'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'unused-imports', 'simple-import-sort', 'react'],
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'prettier'
  ],
  rules: {
    // Keep build green; we can tighten later
    '@typescript-eslint/no-explicit-any': 'off',
    'react/display-name': 'off',

    // Quality niceties
    'unused-imports/no-unused-imports': 'warn',
    'simple-import-sort/imports': 'warn',
    'simple-import-sort/exports': 'warn',
    'no-console': 'warn'
  },
  settings: {
    react: { version: 'detect' }
  }
};
