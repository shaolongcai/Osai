import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vite.dev/config/
export default defineConfig({
  base: './', // 重要：Electron需要相对路径
  publicDir: 'public', // 確保 public 目錄會被複製到 dist
  optimizeDeps: {
    include: [
      '@emotion/react', 
      '@emotion/styled', 
      '@mui/material/Tooltip',
    ],
  },
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'public/locales',
          dest: ''
        }
      ]
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
       input: {
        main: resolve(__dirname, 'index.html'),
        searchBar: resolve(__dirname, 'search-bar.html')
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          // mui: ['@mui/material', '@mui/icons-material'], //分块加载优化性能
        }
      }
    }
  },
  server: {
    port: 5173,
    host: true,
    cors: true
  }
})
