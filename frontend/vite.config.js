import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 5001, // Specify your desired port here
    // host: true, // Optional: allows access from other devices on network
    headers: {
      "Cross-Origin-Opener-Policy": "unsafe-none",
      "Cross-Origin-Embedder-Policy": "unsafe-none",
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
