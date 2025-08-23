/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        spiritual: {
          25: '#FEFBF0',
          50: '#FDF8E1',
          100: '#F9E8B3',
          200: '#F4D885',
          300: '#EFC857',
          400: '#EAB829',
          500: '#D4AF37', // Primary gold
          600: '#B8942E',
          700: '#9C7925',
          800: '#805E1C',
          900: '#644313',
          950: '#8B4513', // Deep brown
        },
        earth: {
          50: '#FDF7F0',
          100: '#F9E8D1',
          200: '#F4D1A3',
          300: '#EFBA75',
          400: '#EAA347',
          500: '#E58C19',
          600: '#C17315',
          700: '#9D5A11',
          800: '#79410D',
          900: '#552809',
          950: '#8B4513', // Saddle brown
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
      },
      typography: {
        spiritual: {
          css: {
            '--tw-prose-body': '#8B4513',
            '--tw-prose-headings': '#8B4513',
            '--tw-prose-links': '#D4AF37',
            '--tw-prose-bold': '#8B4513',
            '--tw-prose-counters': '#8B4513',
            '--tw-prose-bullets': '#D4AF37',
            '--tw-prose-hr': '#F4D885',
            '--tw-prose-quotes': '#8B4513',
            '--tw-prose-quote-borders': '#D4AF37',
            '--tw-prose-captions': '#8B4513',
            '--tw-prose-code': '#8B4513',
            '--tw-prose-pre-code': '#8B4513',
            '--tw-prose-pre-bg': '#FDF8E1',
            '--tw-prose-th-borders': '#D4AF37',
            '--tw-prose-td-borders': '#F4D885',
          },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
