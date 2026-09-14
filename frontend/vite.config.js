import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  root: fileURLToPath(new URL('.', import.meta.url)),
  resolve: {
    preserveSymlinks: true,
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5180,
    strictPort: true,
    open: true,
    // 开发期把 /api 代理到本地 Laravel 后端，避免跨域（上线走 VITE_API_BASE_URL 指真实域名）
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // 面向现代浏览器，产物更小、无多余兼容代码
    target: 'es2018',
    // 使用 esbuild 压缩（默认，速度快）
    minify: 'esbuild',
    // 提高分包阈值告警门限，避免噪音
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // 将第三方依赖拆分为独立 chunk，利于浏览器长期缓存
        manualChunks: {
          vue: ['vue', 'vue-router'],
          chart: ['chart.js'],
        },
      },
    },
  },
  // 生产环境移除 console 和 debugger，减小体积
  esbuild: {
    drop: ['console', 'debugger'],
  },
})
