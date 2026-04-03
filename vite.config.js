import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '/tree/',
  server: {
    port: 5173,
    proxy: {
      // 将 /tree/api 请求代理到后端 Express 服务器
      '/tree/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tree/, '')
      },
      // 代理上传的图片
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
