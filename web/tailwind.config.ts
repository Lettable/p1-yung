import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        black: '#000000',
        background: '#000000',
        surface: '#111111',
        surfaceLight: '#1a1a1a',
        accent: '#10b981',
        accentHover: '#059669',
        danger: '#ef4444',
        dangerHover: '#dc2626',
        border: '#1e293b',
        textPrimary: '#ffffff',
        textSecondary: '#94a3b8',
      },
      backgroundColor: {
        primary: '#000000',
        secondary: '#111111',
        tertiary: '#1a1a1a',
      },
      borderColor: {
        primary: '#1e293b',
      },
      textColor: {
        primary: '#ffffff',
        secondary: '#94a3b8',
      },
    },
  },
  plugins: [],
};
export default config;
