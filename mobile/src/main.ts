import { createApp } from 'vue'
import { IonicVue } from '@ionic/vue'
import { Capacitor } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen'
import App from './App.vue'
import router from './router'
import { initSession } from './lib/session'

import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'
import '@fontsource/fredoka/latin-400.css'
import '@fontsource/fredoka/latin-500.css'
import '@fontsource/fredoka/latin-600.css'
import './theme/variables.css'
import './theme/global.css'

async function start() {
  try {
    await initSession()

    // The iOS look everywhere, including in the browser during development
    const app = createApp(App).use(IonicVue, { mode: 'ios' }).use(router)
    await router.isReady()
    app.mount('#app')
  } finally {
    if (Capacitor.isNativePlatform()) {
      await SplashScreen.hide()
    }
  }
}

void start()
