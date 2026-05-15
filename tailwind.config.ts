import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        noxias: {
          bg: "#0a0a0a",
          surface: "#141414",
          surfaceSoft: "#1c1c1f",
          secondary: "#221932",
          secondaryHover: "#2d2240",
          secondaryActive: "#1a1228",
          green: "#3cc879",
          greenDark: "#2fa861",
          border: "#262626",
          borderSoft: "#1f1f1f",
          text: "#e5e5e5",
          textMuted: "#9ca3af",
        },
        // Aliases used throughout the UI.
        sidebar: "#221932",
        sidebarHover: "#2d2240",
        sidebarActive: "#3cc879",
        accent: "#3cc879",
      },
    },
  },
  plugins: [],
};

export default config;
