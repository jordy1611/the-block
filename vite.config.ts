import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
    // Fail loudly if 8080 is taken rather than silently moving to 8081.
    // A predictable URL matters more here than a server that always starts.
    strictPort: true,
  },
  preview: {
    port: 8080,
    strictPort: true,
  },
})
