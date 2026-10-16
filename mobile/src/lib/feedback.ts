import { alertController, toastController } from '@ionic/vue'

export async function showAlert(header: string, message: string) {
  const alert = await alertController.create({ header, message, buttons: ['OK'] })
  await alert.present()
}

export async function showErrorToast(message: string) {
  const toast = await toastController.create({
    message,
    duration: 3000,
    position: 'top',
    color: 'destructive'
  })
  await toast.present()
}

export function showSaveError() {
  return showErrorToast('Modification non enregistrée. Vérifiez votre connexion internet.')
}
