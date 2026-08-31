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
        // Sampled directly from the reference screenshots (a dark navy-blue
        // fintech UI) — this is a blue palette, not teal-green.
        ink: {
          950: '#08171e', // page/body background (sampled #08171e)
          900: '#0c1e26', // header / input bar, one step up from page bg
          800: '#1a3139', // elevated card surface (sampled #1a3139)
          700: '#24404a', // card border
          600: '#345866',
          500: '#456e7c',
        },
        accent: {
          // Blue-teal surface/accent family (sampled #3e7480 / #558d99)
          300: '#9cc8d2',
          400: '#5fa3b3',
          500: '#3e7480',
        },
        sand: {
          // Warm cream card color (sampled #cfc6c1)
          100: '#e3dad2',
          200: '#cfc6c1',
          300: '#b6aca4',
        },
        warn: {
          // Muted warm tone for risk/warning callouts — the reference itself
          // has no red/orange, so this stays desaturated to fit alongside it.
          300: '#dab08f',
          400: '#c99b7c',
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
