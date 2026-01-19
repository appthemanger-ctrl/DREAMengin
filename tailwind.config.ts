import type { Config } from "tailwindcss";

export default {
  content: [
    "./client/index.html",
    "./client/src/**/*.{js,ts,jsx,tsx,md,mdx}",
    "./shared/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
} satisfies Config;
