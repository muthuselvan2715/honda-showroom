/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Calm neutral greys used for text, borders and backgrounds
        slate: {
          50: '#f7f7f8',
          100: '#efeff1',
          200: '#e4e4e7',
          300: '#d1d2d6',
          400: '#9c9ea5',
          500: '#6d7079',
          600: '#50535b',
          700: '#3a3d44',
          800: '#26282d',
          900: '#18191d',
          950: '#0f1013',
        },
        // Honda red – used only as the accent colour
        red: {
          50: '#fdf3f3',
          100: '#fbe4e4',
          200: '#f6c6c6',
          300: '#ee9c9c',
          400: '#e15e5e',
          500: '#d63434',
          600: '#cc0000',
          700: '#a80000',
          800: '#880606',
          900: '#6d0b0b',
          950: '#3c0303',
        },
        honda: {
          50: '#fdf3f3',
          100: '#fbe4e4',
          500: '#d63434',
          600: '#cc0000',
          700: '#a80000',
          800: '#880606',
          900: '#6d0b0b',
          red: '#cc0000',
          dark: '#18191d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      // Slightly larger small sizes so every label is easy to read
      fontSize: {
        xs: ['0.78rem', { lineHeight: '1.15rem' }],
        sm: ['0.875rem', { lineHeight: '1.3rem' }],
        base: ['0.95rem', { lineHeight: '1.5rem' }],
        lg: ['1.075rem', { lineHeight: '1.6rem' }],
        xl: ['1.2rem', { lineHeight: '1.7rem' }],
        '2xl': ['1.45rem', { lineHeight: '1.95rem' }],
      },
      fontWeight: {
        bold: '600',
        extrabold: '650',
        black: '650',
      },
      letterSpacing: {
        tighter: '-0.015em',
        tight: '-0.01em',
        wide: '0.005em',
        wider: '0.01em',
        widest: '0.02em',
      },
      borderRadius: {
        lg: '0.45rem',
        xl: '0.6rem',
        '2xl': '0.75rem',
        '3xl': '0.9rem',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(16, 17, 20, 0.04)',
        DEFAULT: '0 1px 3px rgba(16, 17, 20, 0.06)',
        md: '0 2px 6px rgba(16, 17, 20, 0.06)',
        lg: '0 6px 16px rgba(16, 17, 20, 0.08)',
        xl: '0 10px 24px rgba(16, 17, 20, 0.10)',
        '2xl': '0 16px 40px rgba(16, 17, 20, 0.14)',
      },
    },
  },
  plugins: [],
};
