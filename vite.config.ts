import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative asset paths so dist/ can sit in a subdirectory (for example /grok-city/).
  base: './',
})
