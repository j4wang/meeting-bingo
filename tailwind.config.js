/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      keyframes: {
        fillPop: {
          '0%':   { transform: 'scale(0.9)' },
          '60%':  { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1.0)' },
        },
      },
      animation: {
        fillPop: 'fillPop 200ms ease-out forwards',
      },
    },
  },
  plugins: [],
}

