import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        blush: "#f6a8c7",
        roseInk: "#6f3554",
        cream: "#fff7f3",
        berry: "#d7568c"
      },
      boxShadow: {
        dreamy: "0 24px 60px rgba(116, 45, 74, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
