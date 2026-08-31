/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Deep-teal fintech-style palette (matches the app's dark, rounded-card look)
        ink: {
          950: '#0e2624',
          900: '#122e2b',
          800: '#1a3835',
          700: '#234541',
          600: '#2f544e',
          500: '#42685f',
        },
        sand: {
          100: '#f6efe1',
          200: '#ede0c9',
          300: '#e2cfa8',
        },
        mint: {
          300: '#a9e6c2',
          400: '#7ed9a7',
          500: '#57c48e',
        },
        coral: {
          300: '#f0c39a',
          400: '#e2a37a',
        },
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
    },
  },
  plugins: [],
};
