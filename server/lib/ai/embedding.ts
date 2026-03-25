import { embed, embedMany } from 'ai'
import { openai } from '@ai-sdk/openai'
import type { H3Event } from 'h3'
import { getVecsSupabaseClient, getAuthUser } from '../../repositories/supabaseRepository'

const embeddingModel = openai.embedding('text-embedding-3-small')

const generateChunks = (input: string): string[] => {
  return input
    .trim()
    .split('.')
    .filter(i => i !== '')
}

export const generateEmbeddings = async (
  value: string
): Promise<Array<{ embedding: number[], content: string }>> => {
  const chunks = generateChunks(value)
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks
  })

  return embeddings.map((e, i) => ({
    content: chunks[i]!,
    embedding: e
  }))
}

export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll('\\n', ' ')
  const { embedding } = await embed({
    model: embeddingModel,
    value: input
  })
  return embedding
}

/**
 * Trouve le contenu pertinent dans la base de données Supabase en utilisant le schéma 'vecs'
 * @param event - L'événement H3 pour accéder au client Supabase
 * @param userQuery - La requête de l'utilisateur pour laquelle trouver du contenu pertinent
 * @returns Un tableau des ressources pertinentes
 */
type EmbeddingResult = {
  id: string
  content: string
  resource_id: string | null
  similarity?: number
  resources?: Record<string, unknown>
}

export const findRelevantContent = async (
  event: H3Event,
  userQuery: string
) => {
  try {
    console.log('Début de findRelevantContent avec query:', userQuery)
    const userQueryEmbedding = await generateEmbedding(userQuery)
    console.log('Embedding généré:', userQueryEmbedding.length, 'dimensions')

    const supabase = await getVecsSupabaseClient(event)
    console.log('Client Supabase obtenu')

    const user = await getAuthUser(event)

    const queryParams = {
      query_embedding: JSON.stringify(userQueryEmbedding),
      similarity_threshold: 0.3,
      match_count: 4,
      user_id: user?.id ?? null
    }
    console.log('Paramètres RPC:', queryParams)

    const { data, error } = await supabase
      .schema('vecs')
      .rpc('match_documents', queryParams)

    console.log('Réponse RPC reçue, data:', data, 'error:', error)

    if (error) {
      console.error('Error finding relevant content:', error)
      throw new Error('Failed to find relevant content')
    }

    console.log('Nombre de résultats trouvés:', data?.length || 0)

    if (data && data.length > 0) {
      console.log('Premier résultat:', data[0])
      const resourceIds = data
        .map((item: EmbeddingResult) => item.resource_id)
        .filter((id): id is string => id !== null)
      console.log('ResourceIds extraits:', resourceIds)

      if (resourceIds.length > 0) {
        console.log('Récupération des ressources pour les IDs:', resourceIds)
        const { data: resources, error: resourcesError } = await supabase
          .schema('vecs')
          .from('resources')
          .select('*')
          .in('id', resourceIds)

        console.log('Ressources récupérées:', resources, 'Erreur:', resourcesError)

        if (resourcesError) {
          console.error('Erreur lors de la récupération des ressources:', resourcesError)
        }

        if (!resourcesError && resources) {
          console.log('Nombre de ressources trouvées:', resources.length)
          const result = data.map((item: EmbeddingResult) => {
            const matchingResource = resources.find(r => r.id === item.resource_id)
            console.log(`Ressource trouvée pour ${item.resource_id}:`, matchingResource || 'Aucune correspondance')
            return {
              ...item,
              resources: matchingResource
            }
          })
          console.log('Résultat final:', result)
          return result
        }
      }
    }

    return data || []
  } catch (error) {
    console.error('Error in findRelevantContent:', error)
    throw error
  }
}
