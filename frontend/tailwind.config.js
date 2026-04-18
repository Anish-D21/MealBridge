/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: '#0D1117',
        light: '#FCF9F1',
        surface: '#161B22',
        border: '#21262D',
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