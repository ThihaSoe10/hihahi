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
        aizome: "#173E3F",
        "aizome-light": "#2B6665",
        kurenai: "#A34E3D",
        matsu: "#52745E",
        washi: "#F6F7F3",
        "washi-panel": "#E8EEEA",
        sumi: "#202D2E",
      },
    },
  },
  plugins: [],
};
export default config;
