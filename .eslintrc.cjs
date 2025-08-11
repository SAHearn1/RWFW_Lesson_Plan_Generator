// .eslintrc.cjs
module.exports = {
  root: true,
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'public/',
    'dist/',
    '**/__tests__/**',
    '**/__mocks__/**',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'unused-imports', 'simple-import-sort', 'react'],
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'prettier',
  ],
  rules: {
    // stop current errors
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/no-empty-function': 'off',

    // keep warnings (won’t fail build)
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'unused-imports/no-unused-imports': 'warn',
    'simple-import-sort/imports': 'warn',
    'simple-import-sort/exports': 'warn',
    'no-console': 'warn',
    '@typescript-eslint/no-explicit-any': 'off',
    '@next/next/no-page-custom-font': 'off',
  },
  settings: { react: { version: 'detect' } },
};
