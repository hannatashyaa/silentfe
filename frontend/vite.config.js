
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  server: {
    port: 3000,
    host: true,
    cors: true,
    

    middlewareMode: false,
    

    headers: {
      'Cross-Origin-Embedder-Policy': 'cross-origin',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  },
  

  publicDir: 'public',
  
  assetsInclude: ['**/*.bin', '**/*.pb'],

  define: {
    global: 'globalThis',
    'process.env.VITE_API_BASE_URL': JSON.stringify(
      process.env.VITE_API_BASE_URL || 'https://silenbek-production.up.railway.app'
    ),
    'process.env.VITE_API_URL': JSON.stringify(
      process.env.VITE_API_URL || 'https://silenbek-production.up.railway.app'
    )
  },
  
  build: {
    copyPublicDir: true,
    assetsDir: 'assets',
    
    rollupOptions: {
      output: {
        manualChunks: {
          'tensorflow': ['@tensorflow/tfjs'],
          'mediapipe': ['@mediapipe/hands']
        }
      }
    }
  },
  
  optimizeDeps: {
    include: [
      '@tensorflow/tfjs',
      '@tensorflow/tfjs-backend-webgl',
      '@tensorflow/tfjs-backend-cpu',
      '@mediapipe/hands'
    ],
    exclude: []
  }
})
