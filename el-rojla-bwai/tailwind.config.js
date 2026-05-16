/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        accent: {
          DEFAULT: '#7F77DD',
          hover: '#6B63C9',
          light: 'rgba(127, 119, 221, 0.12)',
          subtle: 'rgba(127, 119, 221, 0.06)',
        },
        surface: {
          light: '#F5F5F7',
          dark: '#1C1C1E',
          card: 'rgba(255, 255, 255, 0.72)',
          'card-dark': 'rgba(255, 255, 255, 0.06)',
        },
        glass: {
          border: 'rgba(255, 255, 255, 0.18)',
          'border-dark': 'rgba(255, 255, 255, 0.08)',
        },
      },
      borderRadius: {
        'glass': '18px',
        'input': '12px',
        'pill': '999px',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.08)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.12)',
        'glass-sm': '0 2px 16px rgba(0, 0, 0, 0.04)',
      },
      backdropBlur: {
        'glass': '20px',
        'input': '10px',
      },
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out forwards',
        'slide-up': 'slide-up 0.5s ease-out forwards',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'scale-in': 'scale-in 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
}
