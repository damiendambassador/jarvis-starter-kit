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
        navy: {
          DEFAULT: '#0A1628',
          light: '#112040',
          dark: '#060D1A',
        },
        gold: {
          DEFAULT: '#C9A84C',
          light: '#D4B96A',
          dark: '#9A7B2E',
        },
        cream: '#EDF3FC',
        blue: '#2D6FE0',
        'blue-gray': '#E8EDF5',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
