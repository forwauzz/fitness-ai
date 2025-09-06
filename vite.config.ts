import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      template: 'treemap',
      gzipSize: true,
      brotliSize: true,
      open: false,
    })
  ],
  build: {
    minify: 'esbuild',
    sourcemap: false,
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('chart.js')) return 'vendor_chartjs'
            if (id.includes('react')) return 'vendor_react'
            if (id.includes('dayjs')) return 'vendor_dayjs'
            return 'vendor'
          }
        },
      },
    },
    terserOptions: undefined,
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
})
