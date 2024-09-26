/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'Arial', 'sans-serif'],
      },
      colors: {
        'pastel-green': '#c1e1c1',
        'pastel-blue': '#c6e4ee',
        'pastel-red': '#f6c6c6',
        'pastel-orange': '#ffd5b9',
        'pastel-purple': '#d6aaff',
        'pastel-gray': '#e3e3e3',
      },
    },
  },
  plugins: [],
}
