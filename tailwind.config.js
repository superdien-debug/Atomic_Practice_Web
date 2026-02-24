/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'vajra-gold': '#D4AF37',
        'vajra-burgundy': '#800000',
        'vajra-cream': '#FEF9EF',
        'vajra-gray': '#717171',
        'vajra-lightGray': '#F5F5F5',
        'vajra-dark': '#1A1A1A',
      },
      fontFamily: {
        serif: ["System"],
        sans: ["System"],
      },
    },
  },
  plugins: [],
}

