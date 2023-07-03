import { defineConfig } from 'vite'
import { join } from 'path'

export default defineConfig({
  root: join(__dirname, './'),
  publicDir: join(__dirname, './public'),
  server: {
    port: 3000
  },
  build: {
    target: 'esnext'
  }
})
