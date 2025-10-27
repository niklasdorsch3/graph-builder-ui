import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  if (mode === 'demo') {
    // Build the demo site for GitHub Pages
    return {
      plugins: [react()],
      base: '/graph-builder-ui/',
      build: {
        outDir: 'demo-dist',
        emptyOutDir: true
      }
    }
  }

  // Build the library for npm
  return {
    plugins: [react()],
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.jsx'),
        name: 'GraphBuilderUI',
        fileName: (format) => `graph-builder-ui.${format}.js`
      },
      rollupOptions: {
        external: ['react', 'react-dom', 'framer-motion'],
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
            'framer-motion': 'FramerMotion'
          }
        }
      }
    }
  }
})
