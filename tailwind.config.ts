import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17243b",
        muted: "#65738a",
        line: "#e5eaf1",
        canvas: "#f6f8fc",
        blue: "#335dca",
        navy: "#142d5a",
      },
      boxShadow: {
        card: "0 10px 32px rgba(26, 47, 89, 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
