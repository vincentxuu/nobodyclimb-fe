/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      xs: '375px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['Noto Sans TC', 'sans-serif'],
        mono: ['Allerta Stencil', 'monospace'],
        display: ['Glow Sans TC', 'Noto Sans TC', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',

        // ========================================
        // 品牌色彩系統 (Brand Color System)
        // 詳見 docs/color-system.md
        // ========================================

        // W&B 灰階系列 (White & Black)
        wb: {
          0: '#FFFFFF', // 純白
          10: '#F5F5F5', // 淺灰背景
          20: '#EBEAEA', // 邊框灰
          30: '#DBD8D8', // 淺灰
          50: '#B6B3B3', // 中灰
          60: '#8E8C8C', // 灰
          70: '#6D6C6C', // 深灰（次要文字）
          90: '#3F3D3D', // 更深灰（hover）
          100: '#1B1A1A', // 近黑（主要文字）
        },

        // Yellow 系列（品牌強調色）
        'brand-yellow': {
          100: '#FFE70C', // 主要黃色
          200: '#FA9F17', // 橘黃色
        },

        // Red 系列（警示/錯誤）
        'brand-red': {
          100: '#DA3737', // 紅色
        },

        // 語意化別名 (Semantic Aliases)
        // 頁面級別顏色
        'page-bg': '#F5F5F5', // wb-10
        'page-content-bg': '#F5F5F5', // wb-10
        'text-main': '#1B1A1A', // wb-100
        'text-subtle': '#6D6C6C', // wb-70

        // 表單相關顏色
        strong: '#3F3D3D', // wb-90，用於標籤文字: text-strong
        subtle: '#B6B3B3', // wb-50，用於邊框: border-subtle

        // 品牌顏色（向後相容）
        brand: {
          dark: '#1B1A1A', // wb-100 主色調深色
          'dark-hover': '#3F3D3D', // wb-90 深色 hover
          light: '#DBD8D8', // wb-30 淺灰色背景
          accent: '#FFE70C', // brand-yellow-100 黃色強調色
          'accent-hover': '#FA9F17', // brand-yellow-200 橘黃色 hover
          red: '#DA3737', // brand-red-100 紅色
          gray: {
            DEFAULT: '#EBEAEA', // wb-20 邊框灰色
            light: '#F5F5F5', // wb-10 淺灰色背景
          },
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
