// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      colors: {
        brand: {
          50:  '#f5f6ff',
          100: '#eceeff',
          200: '#d9dcff',
          300: '#b9bdff',
          400: '#8f93ff',
          500: '#605fff', // primary
          600: '#4f4fe0',
          700: '#3f3fb3',
          800: '#2f3085',
          900: '#22245f',
        },
        accent: {
          500: '#22c55e', // emerald accent
        },
      },
      boxShadow: {
        brand: '0 12px 30px -12px rgba(96,95,255,0.45)',
      },
      borderRadius: {
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
