/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#edf3ff',
          100: '#dbe7ff',
          200: '#b8cfff',
          300: '#8ab1ff',
          400: '#5b8ff5',
          500: '#2b60c4',
          600: '#224894',
          700: '#17397f',
          800: '#132f67',
          900: '#0f1f39',
        },
        accent: {
          green: '#2da84d',
          'green-light': '#e8f8ec',
          gold: '#f1ba42',
          'gold-light': '#fff6df',
          rose: '#f7837f',
          'rose-light': '#fff0ef',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f8f7f4',
          warm: '#f6f4ef',
          border: '#e8e6e1',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Sora', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '16px',
        'card-lg': '20px',
        'button': '14px',
        'chip': '999px',
        'section': '24px',
      },
      boxShadow: {
        'card': '0 4px 16px rgba(15, 31, 57, 0.06)',
        'card-hover': '0 8px 24px rgba(15, 31, 57, 0.1)',
        'button': '0 8px 20px rgba(23, 57, 127, 0.25)',
        'nav': '0 -2px 12px rgba(0, 0, 0, 0.06)',
        'header': '0 2px 8px rgba(0, 0, 0, 0.04)',
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
      },
    },
  },
  plugins: [],
};
