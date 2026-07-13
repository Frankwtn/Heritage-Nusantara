/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary – Deep Terracotta
        terracotta: {
          50:  '#fdf3ef',
          100: '#fbe4d8',
          200: '#f6c4ab',
          300: '#f09c75',
          400: '#e8703f',
          500: '#c0522a', // main brand
          600: '#a6431f',
          700: '#89341a',
          800: '#702b18',
          900: '#5e2518',
        },
        // Background – Warm Cream/Beige
        cream: {
          50:  '#fefdfb',
          100: '#fdf8f0',
          200: '#faf0e0',
          300: '#f5e6cb',
          400: '#edd5a7',
          500: '#e2c07e',
        },
        // Accent – Gold/Brass
        gold: {
          300: '#f0d080',
          400: '#d4aa50',
          500: '#b8902a',
          600: '#9a7520',
        },
        // Text – Dark Slate
        slate: {
          850: '#1e2a38',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:  ['"Inter"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'batik-pattern': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23c0522a' fill-opacity='0.04'%3E%3Cpath d='M20 0L40 20L20 40L0 20Z'/%3E%3C/g%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}
