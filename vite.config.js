import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  server: {
    // bind to all interfaces so the dev server can listen locally and be exposed via a tunnel
    host: '0.0.0.0'
  },
  plugins: [
    tailwindcss(),
    react()
  ],
})
