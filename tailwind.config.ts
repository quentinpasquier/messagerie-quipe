import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        sidebar: "#19171D",
        sidebarHover: "#27242C",
        sidebarActive: "#1164A3",
        accent: "#007a5a",
      },
    },
  },
  plugins: [],
};

export default config;
