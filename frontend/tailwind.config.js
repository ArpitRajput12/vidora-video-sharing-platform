/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vidora: {
          bg: '#0F172A',         // Primary Background: Deep Slate Navy
          card: '#111827',       // Primary Surface
          surface: '#162033',    // Secondary Surface
          border: '#1E293B',     // Subtle Borders
          borderLight: '#334155',// Slightly lighter border for hovers
          blue: '#3B82F6',       // Primary Accent: Vibrant Blue
          indigo: '#6366F1',     // Secondary Accent
          purple: '#8B5CF6',     // Secondary Accent
          dark: '#0B1120',       // Darker tone for inputs/bars
          text: '#F8FAFC',       // Primary Text
          muted: '#94A3B8',      // Muted Subtitle Text
          subtle: '#64748B',     // Subtle tertiary text
        },
      },
      borderRadius: {
        'btn': '10px',
        'card': '14px',
        'modal': '16px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
