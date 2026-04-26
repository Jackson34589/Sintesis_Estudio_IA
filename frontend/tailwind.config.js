/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#e6f7f5',
          100: '#b3e8e3',
          500: '#34b3a3',
          600: '#2A9D8F',
          700: '#218276',
        },
        secondary: {
          50:  '#e8f4f8',
          100: '#c2dfe9',
          600: '#6AAFC8',
          700: '#5796ac',
        },
        accent: '#F4A261',
        danger: {
          DEFAULT: '#E76F51',
          50:      '#fdf1ed',
        },
        success: {
          DEFAULT: '#81C784',
          50:      '#f0f8f0',
        },
        ink: {
          DEFAULT: '#2C3E50',
          muted:   '#6C757D',
        },
        surface: '#F5F7FA',
      },
    },
  },
  plugins: [],
}
