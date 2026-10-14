/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'page-bg': '#F9FAFB',
        'surface-white': '#FFFFFF',
        surface: {
          DEFAULT: '#f8f9fa',
          dim: '#d9dadb',
          'container-lowest': '#ffffff',
          'container-low': '#f3f4f5',
          container: '#edeeef',
          'container-high': '#e7e8e9',
          'container-highest': '#e1e3e4',
        },
        'on-surface': '#191c1d',
        'on-surface-variant': '#59413a',
        outline: {
          DEFAULT: '#8d7168',
          variant: '#e1bfb5',
        },
        // Brand action color (Orange-700) — CTAs, active states, badges
        primary: {
          DEFAULT: '#C2410C',
          container: '#c2410c',
          hover: '#9A3412',
        },
        // Basil green — freshness, success, secondary brand
        secondary: {
          DEFAULT: '#16A34A',
          container: '#82f5c1',
        },
        // Neutral text tokens
        'text-primary': '#111827',
        'text-secondary': '#4B5563',
        'text-tertiary': '#9CA3AF',
        // Border tokens
        'border-subtle': '#F3F4F6',
        'border-default': '#E5E7EB',
        'border-strong': '#D1D5DB',
        // Brand palette accents
        cream: '#FFF8EB',
        charcoal: '#1C1917',
        basil: '#16A34A',
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        price: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        hero: ['36px', { lineHeight: '44px', letterSpacing: '-0.02em', fontWeight: '800' }],
        'hero-mobile': ['28px', { lineHeight: '34px', letterSpacing: '-0.015em', fontWeight: '800' }],
        'headline-lg': ['30px', { lineHeight: '38px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-md': ['20px', { lineHeight: '28px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-sm': ['16px', { lineHeight: '24px', letterSpacing: '-0.005em', fontWeight: '600' }],
        'price-lg': ['22px', { lineHeight: '28px', letterSpacing: '-0.01em', fontWeight: '700' }],
        'price-md': ['16px', { lineHeight: '24px', letterSpacing: '0em', fontWeight: '600' }],
        'price-sm': ['14px', { lineHeight: '20px', letterSpacing: '0em', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '24px', letterSpacing: '0em', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '20px', letterSpacing: '0em', fontWeight: '400' }],
        'body-sm': ['12px', { lineHeight: '16px', letterSpacing: '0em', fontWeight: '400' }],
        'label-md': ['14px', { lineHeight: '20px', letterSpacing: '0.01em', fontWeight: '500' }],
        'label-sm': ['12px', { lineHeight: '16px', letterSpacing: '0.01em', fontWeight: '500' }],
        'badge-xs': ['11px', { lineHeight: '14px', letterSpacing: '0.02em', fontWeight: '600' }],
      },
      borderRadius: {
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        cardHover: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        overlay:
          '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
        bottomnav: '0 -1px 12px rgba(0, 0, 0, 0.05)',
        topbar: '0 1px 8px rgba(0, 0, 0, 0.04)',
      },
      keyframes: {
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'sheet-in': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'toast-in': 'toast-in 0.25s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'sheet-in': 'sheet-in 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        'scale-in': 'scale-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
