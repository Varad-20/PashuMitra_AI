/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        brand: {
          50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac', 400: '#4ade80',
          500: '#22c55e', 600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#14532d',
        },
      },
      keyframes: {
        fadeUp: { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        slideIn: { '0%': { opacity: 0, transform: 'translateX(24px)' }, '100%': { opacity: 1, transform: 'translateX(0)' } },
        pop: { '0%': { opacity: 0, transform: 'scale(.96)' }, '100%': { opacity: 1, transform: 'scale(1)' } },
      },
      animation: { fadeUp: 'fadeUp .35s ease-out both', slideIn: 'slideIn .25s ease-out both', pop: 'pop .2s ease-out both' },
    },
  },
  plugins: [],
};
