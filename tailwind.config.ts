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
        aizome: "#1D3461",
        "aizome-light": "#2C5282",
        kurenai: "#C8102E",
        matsu: "#355E3B",
        washi: "#F7F4EC",
        "washi-panel": "#EFEBDE",
        sumi: "#2B2B2B",
      },
    },
  },
  plugins: [],
};
export default config;
