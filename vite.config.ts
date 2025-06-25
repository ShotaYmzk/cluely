// vite.config.ts
import { defineConfig } from 'vite'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'

export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        // Main-process entry file of the Electron App.
        entry: 'electron/main.ts',
      },
      preload: {
        // Preload-script entry file of the Electron App.
        input: path.join(__dirname, 'electron/preload.ts'),
      },
      // Optional: Use Node.js API in the Renderer-process
      renderer: {},
    }),
  ],
})