/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./modules/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      animation: {
        'hue': 'hue 10s linear infinite'
      },
      keyframes: {
        hue: {
          '0%': { filter: 'hue-rotate(0deg)' },
          '100%': { filter: 'hue-rotate(360deg)' }
        }
      }
    },
  },
  plugins: [],
};
