// File: tailwind.config.ts (Corrected)

import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          evergreen: '#082A19',
          'deep-canopy': '#001C10',
          leaf: '#3B523A',
          'gold-leaf': '#D4C862',
          'olive-gold': '#96812A',
          'canvas-light': '#F2F4CA',
          charcoal: '#2B2B2B',
        },
      },
      fontFamily: {
        sans: ["Inter", ...fontFamily.sans],
        serif: ["Merriweather", ...fontFamily.serif],
      },
      boxShadow: {
        brand: "0 12px 28px -8px rgba(8, 42, 25, 0.35), 0 8px 12px -10px rgba(8, 42, 25, 0.25)",
      },
      // --- THIS SECTION IS CORRECTED ---
      // We explicitly type the object being destructured to resolve the 'any' type error.
      typography: ({ theme }: { theme: (path: string) => string }) => ({
        brand: {
          css: {
            "--tw-prose-body": theme("colors.brand.charcoal"),
            "--tw-prose-headings": theme("colors.brand.deep-canopy"),
            "--tw-prose-links": theme("colors.brand.leaf"),
            "--tw-prose-bold": theme("colors.brand.deep-canopy"),
            "--tw-prose-quotes": theme("colors.brand.evergreen"),
            "--tw-prose-code": theme("colors.brand.charcoal"),
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
export default config;
