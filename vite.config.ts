import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '$modules/': './modules/'
    }
  },
  server: {
    port: 3000
  },
  build: {
    target: 'esnext'
  }
})
