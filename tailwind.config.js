
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx,js,jsx}","./components/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: { brandA:'#0ea5e9', brandB:'#f97316', ink:'#0f172a' },
      borderRadius: { '3xl': '1.5rem' },
      animation: { 'slow-pan': 'pan 20s linear infinite' },
      keyframes: { pan: { '0%':{backgroundPosition:'0% 50%'}, '100%':{backgroundPosition:'100% 50%'} } }
    }
  },
  plugins: []
}
