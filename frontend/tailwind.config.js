import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#6d4aff",
          dark: "#4f2ed6",
          light: "#9481ff",
        },
        surface: {
          DEFAULT: "#0f1014",
          light: "#1a1b21",
          dark: "#07070b",
          card: "#14151c",
        },
        accent: {
          success: "#16c782",
          warning: "#ffc857",
          info: "#4fd1c5",
        },
      },
      fontFamily: {
        sans: ["'Space Grotesk'", ...defaultTheme.fontFamily.sans],
      },
      boxShadow: {
        card: "0 10px 35px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};