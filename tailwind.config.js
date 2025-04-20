/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) translateX(0) rotate(0deg)' },
          '33%': { transform: 'translateY(-20px) translateX(10px) rotate(2deg)' },
          '66%': { transform: 'translateY(10px) translateX(-10px) rotate(-2deg)' }
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
      },
      animation: {
        float: 'float 8s ease-in-out infinite',
        fadeIn: 'fadeIn 0.5s ease-out'
      }
    },
  },
  plugins: [],
}

