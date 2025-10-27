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
        'seer-primary': '#60A5FA',
        'seer-primary-hover': '#3B82F6',
        'seer-primary-light': 'rgba(96, 165, 250, 0.15)',
        'seer-primary-dark': '#2563EB',
        'seer-accent': '#818CF8',
        // Legacy aliases for backward compatibility
        'seer-teal': '#60A5FA',
        'seer-teal-hover': '#3B82F6',
        'seer-light-teal': 'rgba(96, 165, 250, 0.15)',
        'seer-dark-teal': '#2563EB',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
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
