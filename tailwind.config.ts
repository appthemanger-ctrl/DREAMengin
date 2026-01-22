
import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:'#eef2ff',100:'#e0e7ff',200:'#c7d2fe',300:'#a5b4fc',400:'#818cf8',
          500:'#6366f1',600:'#4f46e5',700:'#4338ca',800:'#3730a3',900:'#312e81'
        }
      },
      boxShadow: {
        glass: '0 10px 30px rgba(0,0,0,0.08)'
      },
      backdropBlur: {
        xs: '2px'
      }
    }
  },
  plugins: []
};
export default config;
