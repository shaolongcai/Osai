import type { Config } from 'tailwindcss'

/**
 * Tailwind CSS V4 配置文件
 * 
 * 注意：Tailwind CSS V4 主要使用 CSS 變量進行配置
 * 此配置文件用於自定義主題和擴展功能
 */
const config: Config = {
  content: [
    './index.html',
    './search-bar.html',
    './setting.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  // 启用 important 模式，确保 Tailwind 样式优先级最高
  important: true,
  theme: {
    extend: {
      // 自定義顏色（基於項目現有的 SCSS 樣式）
      colors: {
        // 主色調
        primary: {
          DEFAULT: '#1976d2',
          light: '#E3F2FD',
          dark: '#1565c0',
        },
        // 背景色
        background: {
          DEFAULT: '#FAFDFC',
          light: '#FFFFFF',
          gray: '#F5F5F5',
        },
        // 邊框色
        border: {
          DEFAULT: '#F0F2F5',
          light: '#E0E0E0',
        },
        // 文字顏色
        text: {
          primary: '#000000',
          secondary: 'rgba(255, 255, 255, 0.65)',
          tertiary: 'rgba(0, 0, 0, 0.45)',
          disabled: 'rgba(0, 0, 0, 0.25)',
        },
      },
      // 自定義間距
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      // 自定義圓角
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
      },
      // 自定義陰影
      boxShadow: {
        'sm': '0px 2px 4px rgba(25, 33, 61, 0.25)',
        'md': '0px 4px 8px rgba(25, 33, 61, 0.25)',
        'lg': '0px 8px 16px rgba(25, 33, 61, 0.25)',
      },
      // 自定義字體大小
      fontSize: {
        'xs': ['12px', { lineHeight: '1.5' }],
        'sm': ['14px', { lineHeight: '1.5' }],
        'base': ['16px', { lineHeight: '1.5' }],
        'lg': ['18px', { lineHeight: '1.5' }],
        'xl': ['24px', { lineHeight: '1.3' }],
      },
      // 自定義過渡效果
      transitionDuration: {
        '200': '200ms',
        '300': '300ms',
      },
      transitionTimingFunction: {
        'ease': 'ease',
      },
    },
  },
  plugins: []
}

export default config

