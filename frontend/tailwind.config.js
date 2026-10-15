/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#EFEEF9",
          100: "#E3E1F4",
          200: "#CAC7EA",
          300: "#A9A4DC",
          400: "#7E79C9",
          500: "#5553B7",
          600: "#48469F",
          700: "#3D3B87",
          800: "#343271",
          900: "#2D2C5D",
        },
        ink: {
          primary: "#252735",
          muted: "#747683",
        },
        surface: {
          editorial: "#EFEEF9",
          note: "#F7F7F4",
          border: "#E5E6EB",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
