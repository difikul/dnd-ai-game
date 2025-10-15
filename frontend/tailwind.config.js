/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef5ee',
          100: '#fde9d7',
          200: '#fbd0ae',
          300: '#f8af7a',
          400: '#f58544',
          500: '#f97316', // Fantasy orange
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        dark: {
          900: '#0a0a0f', // Near black
          800: '#1a1a2e',
          700: '#16213e',
          600: '#1f2937',
          500: '#374151',
        },
        fantasy: {
          gold: '#ffd700',
          ruby: '#e0115f',
          emerald: '#50c878',
          sapphire: '#0f52ba',
        },
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'dice-roll': 'diceRoll 0.6s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        diceRoll: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(90deg)' },
          '50%': { transform: 'rotate(180deg)' },
          '75%': { transform: 'rotate(270deg)' },
        },
      },
    },
  },
  plugins: [],
}
