import type { CapacitorConfig } from '@capacitor/cli'

// No background color, status bar or keyboard style is set: Capacitor then follows the iOS light
// or dark appearance, like the app's theme
const config: CapacitorConfig = {
  appId: 'com.kipoui.app',
  appName: 'Kipoui',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      // Hidden by the app once its first screen is ready (main.ts)
      launchAutoHide: false,
      showSpinner: false
    }
  }
}

export default config
