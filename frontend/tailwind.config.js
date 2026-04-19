/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: 'var(--bg-primary)',
        light: 'var(--text-primary)',
        surface: 'var(--surface-bg)',
        border: 'var(--border-color)',
        green: {
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
        },
        amber: {
          400: '#FBBF24',
        },
      },
      borderRadius: {
        '2xl': '20px',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};