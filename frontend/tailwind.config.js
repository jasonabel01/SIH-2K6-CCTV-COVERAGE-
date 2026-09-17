/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tactical: {
          bg: '#0A0B0E',
          panel: '#13151B',
          card: '#1A1C23',
          border: '#262933',
          borderLight: '#323644',
          primary: '#E2E8F0',
          primaryHover: '#FFFFFF',
          accent: '#F59E0B',
          success: '#10B981',
          warning: '#F59E0B',
          critical: '#EF4444',
          textPrimary: '#FFFFFF',
          textSecondary: '#E2E8F0',
          textMuted: '#CBD5E1'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Orbitron', 'sans-serif'],
        sans: ['Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
}
