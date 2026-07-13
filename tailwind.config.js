/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F5F7FA',
        ink: '#0F172A',
        muted: '#64748B',
        line: '#E2E8F0',
        'sky-wash': '#E8F4F8',
        accent: {
          DEFAULT: '#0D9488',
          hover: '#0F766E',
          soft: '#CCFBF1',
        },
      },
      fontFamily: {
        display: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.06)',
      },
      keyframes: {
        'flip-in': {
          '0%': { transform: 'rotateY(90deg)', opacity: '0' },
          '100%': { transform: 'rotateY(0)', opacity: '1' },
        },
        'progress-fill': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
        'tile-pop': {
          '0%': { transform: 'scale(0.96)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'flip-in': 'flip-in 0.35s ease',
        'progress-fill': 'progress-fill 0.4s ease forwards',
        'tile-pop': 'tile-pop 0.2s ease',
      },
    },
  },
  plugins: [],
};
