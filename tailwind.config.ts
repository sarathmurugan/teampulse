import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f7ff',
          100: '#e0effe',
          200: '#b9dffe',
          300: '#7cc4fd',
          400: '#36a5f9',
          500: '#0c88ea',
          600: '#006bc8',
          700: '#0055a2',
          800: '#044886',
          900: '#0a3d6f',
        },
        warm: {
          50:  '#faf9f7',
          100: '#f5f2ee',
          200: '#ebe5dd',
          300: '#d9ceC1',
          400: '#c4b39e',
          500: '#b09880',
          600: '#9a7e68',
          700: '#806758',
          800: '#69554b',
          900: '#574840',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
