import type { H3Event } from 'h3'
import { getSupabaseClient, handleError } from './baseRepository'

/**
 * Upload a file to Supabase Storage
 * @param event H3Event
 * @param bucketName Storage bucket name
 * @param filePath Path where the file will be stored
 * @param fileBuffer File buffer to upload
 * @param contentType MIME type of the file
 * @returns URL of the uploaded file or null if upload failed
 */
export async function uploadFile(
  event: H3Event,
  bucketName: string,
  filePath: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<string | null> {
  try {
    const supabase = await getSupabaseClient(event)

    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName)

    if (!bucketExists) {
      await supabase.storage.createBucket(bucketName, {
        public: true
      })
    }

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: true
      })

    if (error) throw error

    const expirySeconds = 10 * 365 * 24 * 60 * 60
    const { data } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, expirySeconds)

    if (!data || !data.signedUrl) {
      throw new Error('Impossible d\'obtenir l\'URL signée')
    }

    return data.signedUrl
  } catch (error) {
    handleError(error, 'Error uploading file')
    return null
  }
}

/**
 * Delete a file from Supabase Storage
 * @param event H3Event
 * @param bucketName Storage bucket name
 * @param filePath Path of the file to delete
 * @returns boolean indicating if deletion was successful
 */
export async function deleteFile(
  event: H3Event,
  bucketName: string,
  filePath: string
): Promise<boolean> {
  try {
    const supabase = await getSupabaseClient(event)

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath])

    if (error) throw error
    return true
  } catch (error) {
    handleError(error, 'Error deleting file')
    return false
  }
}
