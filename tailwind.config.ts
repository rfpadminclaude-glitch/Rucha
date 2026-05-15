import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Actual cityofdoral.com palette (sampled from production CSS)
        doral: {
          navy: "#052942",
          slate: "#41596b",
          gold: "#FFCF4B",
          cream: "#fff8e6",
          gray: "#cfd8dc",
        },
        primary: {
          DEFAULT: "#052942",
          foreground: "#ffffff",
        },
        accent: {
          DEFAULT: "#FFCF4B",
          foreground: "#052942",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};
export default config;
