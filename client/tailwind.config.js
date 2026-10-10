/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#120F1A',
        surface: '#1B1626',
        'surface-raised': '#261F35',
        line: '#352B49',
        text: '#F2EEF8',
        'text-muted': '#A296B5',
        brand: '#9D84FF',
        sos: '#FF4D5E',
        safe: '#36D6AA',
        warn: '#FFB547',
      },
      fontFamily: {
        sora: ['Sora', 'system-ui', 'sans-serif'],
        manrope: ['Manrope', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '12px', // buttons, inputs
        card: '20px',
        sheet: '28px',
        full: '9999px', // SOS
      },
      spacing: {
        // base on 4px grid
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
        16: '64px',
        20: '80px',
        24: '96px',
      },
      fontSize: {
        xs: ['12px', '16px'],
        sm: ['14px', '20px'],
        base: ['16px', '24px'],
        lg: ['20px', '28px'],
        xl: ['24px', '32px'],
        '2xl': ['32px', '40px'],
        '3xl': ['44px', '52px'],
      }
    },
  },
  plugins: [],
}
