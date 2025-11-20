/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'background': 'var(--color-background)',
        'foreground': 'var(--foreground)',
        'surface': 'var(--color-surface)',
        'border-color': 'var(--color-border)',
      },
      backgroundColor: {
        'card': 'linear-gradient(to bottom right, var(--color-background), var(--color-surface))',
      },
    },
  },
  plugins: [],
};