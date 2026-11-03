/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        apple: {
          bg: '#F5F5F7',
          card: '#FFFFFF',
          cardSubtle: '#FBFBFD',
          surface: '#F2F2F7',
          border: '#E5E5EA',
          borderLight: '#EBEBF0',
          text: '#1D1D1F',
          textSecondary: '#6E6E73',
          muted: '#86868B',
          blue: '#0071E3',
          blueHover: '#0077ED',
          red: '#FF3B30',
          amber: '#FF9500',
          emerald: '#34C759',
          purple: '#AF52DE',
        },
        cyber: {
          bg: '#F5F5F7',
          card: '#FFFFFF',
          cardSubtle: '#FBFBFD',
          surface: '#F2F2F7',
          border: '#E5E5EA',
          borderLight: '#D1D1D6',
          cyan: '#0071E3',
          cyanGlow: 'rgba(0, 113, 227, 0.1)',
          red: '#FF3B30',
          redGlow: 'rgba(255, 59, 48, 0.1)',
          amber: '#FF9500',
          amberGlow: 'rgba(255, 149, 0, 0.1)',
          emerald: '#34C759',
          emeraldGlow: 'rgba(52, 199, 89, 0.1)',
          slate: '#86868B',
          muted: '#6E6E73',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"SF Mono"', 'JetBrains Mono', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'apple-sm': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'apple-card': '0 2px 12px rgba(0, 0, 0, 0.04), 0 0 1px rgba(0, 0, 0, 0.06)',
        'apple-hover': '0 8px 24px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0, 0, 0, 0.08)',
        'apple-modal': '0 20px 48px rgba(0, 0, 0, 0.12), 0 0 1px rgba(0, 0, 0, 0.08)',
      }
    },
  },
  plugins: [],
}
