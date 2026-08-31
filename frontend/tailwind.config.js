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
        // Same dark navy-blue family as the reference, pushed for more
        // contrast/depth (darker base, richer card surfaces) so the UI
        // doesn't read as flat, plus a brighter, more saturated accent blue
        // instead of the muted teal-blue from the first pass.
        ink: {
          950: '#050e15', // page background
          900: '#0a1a24', // header / input bar
          800: '#12232f', // card surface
          700: '#1c3546', // card border
          600: '#2a4d63', // hover borders / dividers
          500: '#3c6a85', // muted text on dark
        },
        accent: {
          // Vivid sky-blue family — brighter and more saturated than the
          // sampled reference tone, used for actions, highlights, and glow.
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
        },
        sand: {
          100: '#f0e8e1',
          200: '#dad0c7',
          300: '#b6aca4',
        },
        warn: {
          300: '#f2b689',
          400: '#e2996a',
        },
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        glow: '0 0 28px -4px rgba(56, 189, 248, 0.5)',
        'glow-sm': '0 0 14px -3px rgba(56, 189, 248, 0.45)',
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #7dd3fc 0%, #38bdf8 45%, #0284c7 100%)',
        'brand-gradient': 'linear-gradient(135deg, #f0e8e1 0%, #dad0c7 100%)',
      },
    },
  },
  plugins: [],
};
