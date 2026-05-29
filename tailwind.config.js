/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        alarm: {
          red: "#dc2626",
          dark: "#0f172a",
        },
      },
    },
  },
  plugins: [],
};
