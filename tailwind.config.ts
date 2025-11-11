import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        token: {
          signal: { green: '#22c55e', yellow: '#f59e0b', red: '#ef4444' },
          text: { primary: '#111827', secondary: '#6b7280' },
          bg: { base: '#ffffff', subtle: '#f9fafb' },
        },
      },
      borderRadius: {
        lg: '1rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
      },
      spacing: {
        card: '1rem',
        section: '1.5rem',
      },
    },
  },
  plugins: [],
}

export default config

