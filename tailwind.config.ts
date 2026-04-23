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
          50:  '#fdf4ef',
          100: '#fae5d8',
          200: '#f5c9b0',
          300: '#eda47e',
          400: '#e07a4a',
          500: '#c4622d',
          600: '#a84e22',
          700: '#8a3e1c',
          800: '#713317',
          900: '#5c2a14',
        },
        warm: {
          50:  '#faf7f2',
          100: '#f5efe4',
          200: '#ebe0cc',
          300: '#d9caaf',
          400: '#c4b08e',
          500: '#b09070',
          600: '#967558',
          700: '#7a5e46',
          800: '#634d39',
          900: '#503e2f',
        },
      },
      fontFamily: {
        sans: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
