import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import process from 'node:process'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: process.env.PORT ?  Number(process.env.PORT) : 5001,
    headers: {
      'Cross-Origin-Opener-Policy': 'unsafe-none',
      'Cross-Origin-Embedder-Policy': 'unsafe-none'
    }
  },

  preview: {
    host: '0.0.0.0',
    port: process.env.PORT ? Number(process.env.PORT) : 5001,
    strictPort: false,
    // Try disabling host checking entirely
    allowedHosts: true,  // ← This allows all hosts
    headers: {
      'Cross-Origin-Opener-Policy': 'unsafe-none',
      'Cross-Origin-Embedder-Policy': 'unsafe-none'
    }
  },

  plugins: [
    react({
      jsxRuntime: 'automatic',
      jsxImportSource: 'react'
    }),
    tailwindcss()
  ]
})
