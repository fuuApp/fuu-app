import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        fuu: {
          pink:    '#E91E63',
          dpink:   '#880E4F',
          lpink:   '#FCE4EC',
          mpink:   '#F48FB1',
          rose:    '#C2185B',
        },
      },
      fontFamily: {
        sans: ['Hiragino Kaku Gothic Pro', 'Yu Gothic', 'Meiryo', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
