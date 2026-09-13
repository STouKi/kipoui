import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.kipoui.app',
  appName: 'Kipoui',
  webDir: '.output/public',
  server: {
    allowNavigation: ['kipoui.com', '*.supabase.co']
  },
  ios: {
    contentInset: 'always',
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: true,
    backgroundColor: '#020618'
  },
  plugins: {
    StatusBar: {
      style: 'DEFAULT',
      overlaysWebView: true
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#020618',
      showSpinner: false
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true
    }
  }
}

export default config
