/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        crm: {
          primary: '#0066cc',
          slate: '#0f172a',
        },
      },
    },
  },
  plugins: [],
};
