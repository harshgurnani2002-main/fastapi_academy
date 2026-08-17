import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          100: '#FFEDD5',
          200: '#FED7AA',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
        },
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        blue: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3B82F6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        purple: {
          50: '#faf5ff',
          100: '#f3e8ff',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7C3AED',
        },
        red: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#DC2626',
          700: '#b91c1c',
        },
        green: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16A34A',
          700: '#15803d',
        },
        yellow: {
          50: '#fefce8',
          100: '#fef9c3',
          500: '#eab308',
          600: '#CA8A04',
          700: '#a16207',
        },
        emerald: {
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        }
      },
    },
  },
  plugins: [],
};
export default config;
