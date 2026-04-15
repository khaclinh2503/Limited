import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-be-vietnam)", "sans-serif"],
      },
      colors: {
        zps: {
          red: "#E8341A",
          orange: "#F5A623",
          green: "#00D68F",
          purple: "#7C4DFF",
          blue: "#4A90D9",
          bg: "#13151F",
          surface: "#252836",
          elevated: "#2E3148",
          muted: "#8A8FA8",
        },
        quality: {
          do: "#E8341A",
          cam: "#F5A623",
          tim: "#7C4DFF",
          "xanh-lac": "#00D68F",
          "xanh-lam": "#4A90D9",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
