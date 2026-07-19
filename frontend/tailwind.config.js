/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#22C55E",
          dark: "#16A34A",
        },
        secondary: "#34D399",
        accent: "#FACC15",
        danger: "#EF4444",
        background: "#F8FAFC",
        card: "#FFFFFF",
        text: {
          DEFAULT: "#111827",
          secondary: "#6B7280",
        },
        border: "#E5E7EB",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        premium: '0 10px 30px -10px rgba(0, 0, 0, 0.04), 0 1px 1px 0 rgba(0, 0, 0, 0.02)',
        'premium-hover': '0 20px 40px -15px rgba(0, 0, 0, 0.08), 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.04)',
      },
      backdropBlur: {
        glass: '8px',
      },
    },
  },
  plugins: [],
}
