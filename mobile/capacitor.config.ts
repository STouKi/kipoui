import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.kipoui.app',
  appName: 'Kipoui',
  webDir: 'dist',
  ios: {
    backgroundColor: '#FFFFFF'
  },
  plugins: {
    SplashScreen: {
      // Hidden by the app once its first screen is ready (main.ts)
      launchAutoHide: false,
      backgroundColor: '#FFFFFF',
      showSpinner: false
    },
    // The app only has a light theme for now: dark status bar text and a light keyboard,
    // even when iOS is in dark mode
    StatusBar: {
      style: 'LIGHT'
    },
    Keyboard: {
      style: 'LIGHT'
    }
  }
}

export default config
