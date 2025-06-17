import { randomUUID } from 'crypto'
import { requireAuth } from '../../../repositories/supabaseRepository'
import { uploadFile } from '../../../repositories/fileRepository'
import { updateProfile } from '../../../repositories/profileRepository'

export default defineEventHandler(async (event) => {
  const { id } = await requireAuth(event)

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Aucun fichier n\'a été envoyé'
    })
  }

  const file = formData[0]
  if (!file.filename || !file.data || !file.type) {
    throw createError({
      statusCode: 400,
      message: 'Format de fichier invalide'
    })
  }

  if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
    throw createError({
      statusCode: 400,
      message: 'Type de fichier non supporté. Utilisez JPG, PNG ou GIF.'
    })
  }

  // Vérifier la taille du fichier (max 1MB)
  if (file.data.length > 1024 * 1024) {
    throw createError({
      statusCode: 400,
      message: 'Le fichier est trop volumineux. La taille maximale est de 1MB.'
    })
  }

  // Générer un nom de fichier unique
  const fileExt = file.filename.split('.').pop()
  const uniqueFilename = `${id}-${randomUUID()}.${fileExt}`

  // Télécharger le fichier vers Supabase Storage
  const avatarUrl = await uploadFile(
    event,
    'avatars',
    uniqueFilename,
    file.data,
    file.type
  )

  if (!avatarUrl) {
    throw createError({
      statusCode: 500,
      message: 'Erreur lors du téléchargement de l\'avatar'
    })
  }

  const updatedProfile = await updateProfile(event, id, {
    avatar_url: avatarUrl
  })

  if (!updatedProfile) {
    throw createError({
      statusCode: 500,
      message: 'Erreur lors de la mise à jour du profil'
    })
  }

  return {
    success: true,
    avatarUrl
  }
})
