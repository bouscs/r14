import { defineConfig } from 'vite'
import { join } from 'path'
import viteBabel from 'vite-plugin-babel'

export default defineConfig({
  root: join(__dirname, './'),
  publicDir: join(__dirname, './public'),
  plugins: [
    viteBabel({
      filter: /\.tsx?$/,
      loader: path => {
        return path.endsWith('.ts') ? 'ts' : 'tsx'
      },
      babelConfig: {
        assumptions: {
          setPublicClassFields: false
        },
        plugins: [
          // Transform TypeScript to JavaScript
          [
            '@babel/plugin-transform-typescript',
            {
              isTSX: true,
              allowDeclareFields: true
            }
          ],
          // Transform JSX to Repeater14
          '@babel/plugin-syntax-jsx',
          [
            '@babel/plugin-transform-react-jsx',
            {
              runtime: 'automatic',
              importSource: 'repeater14'
            }
          ],
          // Enable transpiling decorators
          [
            '@babel/plugin-proposal-decorators',
            {
              version: '2023-05'
            }
          ],
          '@babel/plugin-proposal-class-properties',
          '@babel/plugin-transform-class-static-block'
        ]
      }
    })
  ],
  server: {
    port: 3000
  },
  build: {
    target: 'esnext'
  }
})
