module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        'telegram': {
          'bg-main': '#FFFFFF',
          'bg-secondary': '#F5F7FA',
          'bg-chat': '#EAEFF5',
          'primary': '#2AABEE',
          'primary-dark': '#1E96D4',
          'text-primary': '#0F172A',
          'text-secondary': '#475569',
          'border': '#E2E8F0',
          'sent': '#2AABEE',
          'received': '#FFFFFF',
        },
        'telegram-dark': {
          'bg-main': '#0E1621',
          'bg-secondary': '#17212B',
          'bg-chat': '#0B141C',
          'primary': '#2AABEE',
          'primary-dark': '#1E96D4',
          'text-primary': '#E5E7EB',
          'text-secondary': '#9CA3AF',
          'border': '#1F2937',
          'sent': '#2AABEE',
          'received': '#17212B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'base': '14px',
        'chat': '14px',
        'sidebar': '15px',
      },
      spacing: {
        '18': '4.5rem',
      },
      borderRadius: {
        'bubble': '18px',
        'button': '10px',
        'modal': '14px',
      },
      maxWidth: {
        'content': '1280px',
      },
    },
  },
  plugins: [],
}
