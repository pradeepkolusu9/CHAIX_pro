import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
  build: {
    outDir: 'dist',
    // Real limit, not a raised one to hide the problem. If a chunk exceeds this,
    // something is wrong — the previous 900 KB setting was masking a 770 KB main
    // bundle that shipped every page to the landing screen.
    chunkSizeWarningLimit: 350,
    rollupOptions: {
      output: {
        // Split the two heaviest vendors so a page that never opens the chat or
        // the 60-second run does not pay for them.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
        },
      },
    },
  },
})
