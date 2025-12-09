import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0', // Allow access from network (needed for Android device)
    port: 5173,
    strictPort: false, // Try next available port if 5173 is taken
  },
})

