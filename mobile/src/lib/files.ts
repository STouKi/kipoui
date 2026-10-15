import type { FileUIPart } from 'ai'

// The API runs on Vercel, which refuses request bodies over 4.5 MB, and attachments travel in
// base64 (a third bigger): photos are resized and PDFs are limited
const MAX_PDF_SIZE = 3 * 1024 * 1024
const MAX_IMAGE_SIDE = 1600

export class AttachmentError extends Error {}

export async function prepareAttachment(file: File): Promise<File> {
  if (file.type === 'application/pdf') {
    if (file.size > MAX_PDF_SIZE) {
      throw new AttachmentError(`« ${file.name} » est trop lourd : un PDF peut faire 3 Mo au maximum.`)
    }
    return file
  }
  if (file.type.startsWith('image/')) {
    return resizeImage(file)
  }
  throw new AttachmentError(`« ${file.name} » n'est ni une photo ni un PDF.`)
}

// JPEG whose longest side is at most maxSide pixels
export async function resizeImage(file: File, maxSide = MAX_IMAGE_SIDE): Promise<File> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new AttachmentError(`Le format de « ${file.name} » n'est pas pris en charge.`)
  }

  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85))
  if (!blob) {
    throw new AttachmentError(`Impossible de préparer « ${file.name} ».`)
  }
  return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg' })
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

// Attachments of a message sent in an existing conversation travel as data URLs
export function toFileParts(files: File[]) {
  return Promise.all(files.map(async (file): Promise<FileUIPart> => ({
    type: 'file',
    mediaType: file.type,
    filename: file.name,
    url: await readAsDataUrl(file)
  })))
}
