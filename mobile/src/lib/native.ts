import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'

const isNative = Capacitor.isNativePlatform()

// Light vibrations that confirm an action, like native iOS apps
export function tapFeedback() {
  if (isNative) void Haptics.impact({ style: ImpactStyle.Light })
}

export function successFeedback() {
  if (isNative) void Haptics.notification({ type: NotificationType.Success })
}

export function warningFeedback() {
  if (isNative) void Haptics.notification({ type: NotificationType.Warning })
}

// Web pages open in the in-app browser (Safari view): the WebView only shows the app
export function openExternal(url: string) {
  if (isNative) {
    void Browser.open({ url })
  } else {
    window.open(url, '_blank', 'noopener')
  }
}
