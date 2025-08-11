/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81"
        }
      },
      boxShadow: {
        // <-- This creates the `shadow-brand` class you’re using in globals.css
        brand:
          "0 12px 28px -8px rgba(79,70,229,0.35), 0 8px 12px -10px rgba(79,70,229,0.25)"
      },
      typography: ({ theme }) => ({
        brand: {
          css: {
            "--tw-prose-body": theme("colors.slate.700"),
            "--tw-prose-headings": theme("colors.slate.900"),
            "--tw-prose-links": theme("colors.brand.700"),
            "--tw-prose-bold": theme("colors.slate.900"),
            "--tw-prose-quotes": theme("colors.slate.900"),
            "--tw-prose-code": theme("colors.slate.900"),
            "--tw-prose-hr": theme("colors.slate.200"),
          },
        },
      }),
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
};
