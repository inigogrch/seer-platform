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
        'seer-primary': '#4ECDC4',
        'seer-primary-hover': '#45B7B8',
        'seer-primary-light': '#E8FFFE',
        'seer-primary-dark': '#3A9B96',
        'seer-accent': '#26D0CE',
        // Legacy aliases for backward compatibility
        'seer-teal': '#4ECDC4',
        'seer-teal-hover': '#45B7B8',
        'seer-light-teal': '#E8FFFE',
        'seer-dark-teal': '#3A9B96',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
  safelist: [
    'bg-seer-primary',
    'bg-seer-primary-hover',
    'bg-seer-primary-light',
    'bg-seer-primary-dark',
    'bg-seer-accent',
    'text-seer-primary',
    'text-seer-primary-hover',
    'text-seer-primary-dark',
    'border-seer-primary',
    'hover:bg-seer-primary-hover',
    'focus:ring-seer-primary',
    'focus:border-seer-primary',
    // Legacy
    'bg-seer-teal',
    'text-seer-teal',
    'border-seer-teal'
  ]
}
