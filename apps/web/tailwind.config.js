// 從共用套件導入設計 tokens
const { COLORS, FONT_FAMILY } = require('@nobodyclimb/constants')

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
        sans: [FONT_FAMILY.sans, 'sans-serif'],
        mono: [FONT_FAMILY.mono, 'monospace'],
        display: [FONT_FAMILY.display, FONT_FAMILY.sans, 'sans-serif'],
      },
      colors: {
        // ========================================
        // 品牌色彩系統 (Brand Color System)
        // 從 @nobodyclimb/constants 導入
        // 注意：必須先展開 COLORS，再定義 CSS 變數顏色
        // 這樣 CSS 變數版本才能正確覆蓋 COLORS 中的衝突鍵值
        // ========================================
        ...COLORS,

        // ========================================
        // shadcn/ui CSS 變數顏色
        // 必須在 ...COLORS 之後定義以覆蓋衝突的鍵值
        // ========================================
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
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
      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-body': '#1B1A1A',
            '--tw-prose-headings': '#1B1A1A',
            '--tw-prose-links': '#1B1A1A',
            '--tw-prose-bold': '#1B1A1A',
            '--tw-prose-counters': '#6D6C6C',
            '--tw-prose-bullets': '#8E8C8C',
            '--tw-prose-hr': '#EBEAEA',
            '--tw-prose-quotes': '#3F3D3D',
            '--tw-prose-quote-borders': '#EBEAEA',
            '--tw-prose-captions': '#6D6C6C',
            '--tw-prose-th-borders': '#EBEAEA',
            '--tw-prose-td-borders': '#EBEAEA',
            lineHeight: '1.8',
            a: {
              color: '#1B1A1A',
              textDecoration: 'underline',
              textDecorationColor: '#C8C5C5',
              textUnderlineOffset: '3px',
              fontWeight: '500',
              transition: 'text-decoration-color 0.2s',
              '&:hover': {
                textDecorationColor: '#1B1A1A',
              },
            },
            h2: {
              fontWeight: '700',
              letterSpacing: '-0.01em',
              marginTop: '2em',
              marginBottom: '0.8em',
              paddingBottom: '0.3em',
              borderBottom: '1px solid #EBEAEA',
            },
            h3: {
              fontWeight: '600',
              marginTop: '1.6em',
              marginBottom: '0.6em',
            },
            table: {
              fontSize: '0.875em',
              lineHeight: '1.5',
            },
            thead: {
              borderBottomWidth: '2px',
            },
            'thead th': {
              fontWeight: '600',
              backgroundColor: '#FAFAFA',
              paddingTop: '0.75em',
              paddingBottom: '0.75em',
            },
            'tbody td': {
              paddingTop: '0.625em',
              paddingBottom: '0.625em',
            },
            blockquote: {
              fontStyle: 'normal',
              borderLeftColor: '#EBEAEA',
              borderLeftWidth: '3px',
              color: '#3F3D3D',
            },
            strong: {
              fontWeight: '600',
            },
            'ul > li::marker': {
              color: '#8E8C8C',
            },
            'ol > li::marker': {
              color: '#6D6C6C',
            },
            hr: {
              borderColor: '#EBEAEA',
              marginTop: '2em',
              marginBottom: '2em',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
  ],
}
