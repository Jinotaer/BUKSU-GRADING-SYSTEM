/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      fontFamily: {
        'outfit': ['Outfit', 'sans-serif'],
      },
      colors: {
        buksu: {
          primary: '#0b5fff',
          secondary: '#3b82f6',
        },
        blue: {
          25: 'rgba(59,130,246,0.03)',
        }
      },
      backgroundImage: {
        'login-bg': "url('./src/assets/loginBackground.svg')",
      },
      spacing: {
        '76': '19rem', // 304px
        '20': '5rem',  // 80px
        '65': '16.25rem', // 260px
        '16': '4rem',  // 64px for collapsed sidebar
        '35': '8.75rem', // 140px for image height
      },
      textShadow: {
        'lg': '0 6px 18px rgba(0,0,0,0.35)',
      },
      zIndex: {
        '1999': '1999',
        '2000': '2000',
        '2001': '2001',
      }
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.text-shadow-lg': {
          textShadow: '0 6px 18px rgba(0,0,0,0.35)',
        },
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
      })
    }
  ],
}