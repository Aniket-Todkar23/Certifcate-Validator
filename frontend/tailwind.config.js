/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'primary': {
          DEFAULT: '#3b82f6',
          dark: '#2563eb',
          light: '#60a5fa',
        },
        'secondary': {
          DEFAULT: '#6366f1',
          dark: '#4f46e5',
        },
        'accent': {
          DEFAULT: '#06b6d4',
          dark: '#0891b2',
        },
        'success': {
          DEFAULT: '#10b981',
          dark: '#059669',
        },
        'warning': {
          DEFAULT: '#f59e0b',
          dark: '#d97706',
        },
        'danger': {
          DEFAULT: '#ef4444',
          dark: '#dc2626',
        },
        'dark': {
          DEFAULT: '#0f172a',
          light: '#1e293b',
        },
        'slate': {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        }
      },
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Inter', 'sans-serif'],
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
      }
    },
  },
  plugins: [],
}