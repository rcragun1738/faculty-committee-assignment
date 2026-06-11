/** @type {import('tailwindcss').Config} */
module.exports = {
  // Enable dark mode using class strategy
  // Dark mode is toggled by adding 'dark' class to the html element
  darkMode: 'class',

  content: [
    './public/index.html',
    './src/renderer/**/*.{js,ts,jsx,tsx}',
  ],

  theme: {
    extend: {
      colors: {
        // Custom color palette for professional appearance
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c3d66',
        },
      },
      fontFamily: {
        // Use system fonts for better performance and consistency
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          '"Roboto"',
          '"Oxygen"',
          '"Ubuntu"',
          '"Cantarell"',
          '"Fira Sans"',
          '"Droid Sans"',
          '"Helvetica Neue"',
          'sans-serif',
        ],
      },
    },
  },

  plugins: [],
};
