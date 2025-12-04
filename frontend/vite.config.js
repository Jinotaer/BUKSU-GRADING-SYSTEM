import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
server: {
  host: "0.0.0.0",
  port: process.env.PORT,
  headers: {
    "Cross-Origin-Opener-Policy": "unsafe-none",
    "Cross-Origin-Embedder-Policy": "unsafe-none"
  }
},
  plugins: [
    react({
      jsxRuntime: 'automatic',
      jsxImportSource: 'react'
    }), 
    tailwindcss()
  ],
})
