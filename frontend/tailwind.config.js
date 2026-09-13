/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        aura: {
          bg: '#0A0E17',
          card: '#111827',
          surface: '#1F2937',
          hover: '#374151',
          border: '#1F2937',
          accent: '#3B82F6',
          accentHover: '#2563EB',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#6366F1',
          text: '#F9FAFB',
          muted: '#9CA3AF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
