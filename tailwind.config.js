/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        primary: {
          DEFAULT: '#2563eb',
          50: '#eff6ff',
          100: '#dbeafe',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        secondary: {
          DEFAULT: '#7c3aed',
          600: '#7c3aed',
          700: '#6d28d9',
        },
        success: {
          DEFAULT: '#059669',
          50: '#ecfdf5',
          600: '#059669',
          700: '#047857',
        },
        danger: {
          DEFAULT: '#dc2626',
          50: '#fef2f2',
          600: '#dc2626',
          700: '#b91c1c',
        },
        warning: {
          DEFAULT: '#d97706',
          50: '#fffbeb',
          600: '#d97706',
          700: '#b45309',
        },
        info: {
          DEFAULT: '#0ea5e9',
          50: '#ecfeff',
          600: '#0ea5e9',
          700: '#0284c7',
        },
      },
    },
  },
  plugins: [],
};
