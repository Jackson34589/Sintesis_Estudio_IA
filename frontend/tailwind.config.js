/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#dce7ff',
          500: '#4f6ef7',
          600: '#3b5bf6',
          700: '#2a45e0',
        },
      },
    },
  },
  plugins: [],
}
