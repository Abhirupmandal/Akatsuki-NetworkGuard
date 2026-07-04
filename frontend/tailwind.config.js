/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0E14",
        critical: "#EF4444",
        high: "#F97316",
        medium: "#EAB308",
        low: "#3B82F6",
        benign: "#22C55E",
        surface: "#1A1D24",
        surfaceHover: "#252830",
        border: "#2A2D35",
        textMain: "#E2E8F0",
        textMuted: "#94A3B8"
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
