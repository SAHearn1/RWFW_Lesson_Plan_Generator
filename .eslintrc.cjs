// .eslintrc.cjs
module.exports = {
  root: true,
  extends: ["next/core-web-vitals"],
  plugins: ["simple-import-sort", "unused-imports"],
  rules: {
    // keep these as "warn" so builds never fail on style issues
    "simple-import-sort/imports": "warn",
    "unused-imports/no-unused-imports": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "no-console": "warn",
  },
};
