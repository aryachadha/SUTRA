/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4f9',
          100: '#e1e8f2',
          200: '#c2d2e5',
          300: '#94b2d3',
          400: '#5f8ebd',
          500: '#3b70a7',
          600: '#2b578b',
          700: '#234671',
          800: '#1e3a5d',
          850: '#162843',
          900: '#0f1f35',
          950: '#091220',
        },
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
      },
    },
  },
  plugins: [],
};
