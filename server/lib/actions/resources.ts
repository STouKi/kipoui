import type { H3Event } from 'h3'
import type { Database } from '../../types/vecs'
import { generateEmbeddings } from '../ai/embedding'
import { getVecsSupabaseClient, getAuthUser } from '../../repositories/supabaseRepository'

export type NewResourceParams = Database['vecs']['Tables']['resources']['Insert']

export const createResource = async (event: H3Event, input: NewResourceParams) => {
  console.log('Creating resource:', input)
  try {
    const { content } = input

    const user = await getAuthUser(event)

    const supabase = await getVecsSupabaseClient(event)

    const { data: resource, error: resourceError } = await supabase.schema('vecs')
      .from('resources')
      .insert({
        content,
        profile_id: user?.id || null
      })
      .select()
      .single()

    if (resourceError) {
      console.error('Error creating resource:', resourceError)
      throw new Error('Failed to create resource')
    }

    const embeddings = await generateEmbeddings(content)

    const { error: embeddingsError } = await supabase.schema('vecs')
      .from('embeddings')
      .insert(
        embeddings.map(embedding => ({
          resource_id: resource.id,
          content: embedding.content,
          embedding: JSON.stringify(embedding.embedding)
        }))
      )

    if (embeddingsError) {
      console.error('Error creating embeddings:', embeddingsError)
      throw new Error('Failed to create embeddings')
    }

    return 'Resource successfully created and embedded.'
  } catch (error) {
    console.error('Error in createResource:', error)
    return error instanceof Error && error.message.length > 0
      ? error.message
      : 'An unknown error occurred'
  }
}
