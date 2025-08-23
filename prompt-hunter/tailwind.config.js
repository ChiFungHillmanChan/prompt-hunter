/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}"
  ],
  theme: {
    extend: {
      // optional: helpers for pixel look
      spacing: { '128': '32rem' },
    },
  },
  plugins: [],
}
