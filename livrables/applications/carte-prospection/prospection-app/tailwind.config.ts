import type { Config } from 'tailwindcss'

// Palette inspirée d'Edrington :
//  - teal / petrol profond (fonds sombres, identité)
//  - bronze / cuivre (accent, repris du filigrane "vague" du logo)
//  - crème (fonds clairs, texte sur sombre)
const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#0E3F40',
          light: '#17605E',
          dark: '#072A2B',
          deep: '#041E1F',
        },
        bronze: {
          DEFAULT: '#BC7A4A',
          light: '#D2A06E',
          dark: '#8F5A30',
        },
        cream: {
          DEFAULT: '#F2EEE7',
          dark: '#E5DED2',
        },
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
