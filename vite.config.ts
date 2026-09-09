import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative paths work from both local Vite and a project GitHub Pages URL.
  base: './',
  // Keep user-editable visual files outside src so content can be replaced
  // without changing React components.
  publicDir: 'ASSETS',
})
