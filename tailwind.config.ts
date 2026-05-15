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
        doral: {
          navy: "#003366",
          gold: "#FDB913",
        },
        primary: {
          DEFAULT: "#003366",
          foreground: "#ffffff",
        },
        accent: {
          DEFAULT: "#FDB913",
          foreground: "#003366",
        },
      },
    },
  },
  plugins: [],
};
export default config;
