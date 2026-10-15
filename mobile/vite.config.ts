import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
    plugins: [vue()],
    build: {
      // The app loads its files from the device, not over the network
      chunkSizeWarningLimit: 1500
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      // In the browser, the app calls /api on its own origin and the dev server forwards the
      // calls: the API only accepts cross-origin calls from the native app
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'https://kipoui.com',
          changeOrigin: true
        }
      }
    }
  }
})
