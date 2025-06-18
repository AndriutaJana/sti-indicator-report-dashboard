import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  base: './',
  plugins: [
    tailwindcss(),
  ],

  server: {
    proxy: {
      '/api': 'http://localhost:5000',
      '/backend': 'http://localhost:5000'
    }
  }
})