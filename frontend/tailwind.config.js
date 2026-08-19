/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1B4332',
        accent: '#52B788',
        warning: '#F4A261',
        error: '#E76F51',
        background: '#F8FAF9',
        text: '#1A1A2E',
        paper: '#FFFFFF',
        hairline: '#D8E3DC',
      },
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(27, 67, 50, 0.06), 0 8px 24px -12px rgba(27, 67, 50, 0.18)',
      },
    },
  },
  plugins: [],
}
