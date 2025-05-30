import { streamText } from 'ai'
import { createWorkersAI } from 'workers-ai-provider'
import { getUser, useSupabase, getChatWithMessages, addMessage } from '../../utils/supabase'

defineRouteMeta({
  openAPI: {
    description: 'Chat with AI.',
    tags: ['ai']
  }
})

export default defineEventHandler(async (event) => {
  const user = await getUser(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const supabase = await useSupabase(event)

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) throw profileError

  const { data: physicalData } = await supabase
    .from('physical_data')
    .select('*')
    .eq('profile_id', user.id)
    .single()

  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('profile_id', user.id)
    .single()

  const { data: habits } = await supabase
    .from('habits')
    .select('*')
    .eq('profile_id', user.id)
    .single()

  const { data: medicalData } = await supabase
    .from('medical_data')
    .select('*')
    .eq('profile_id', user.id)
    .single()

  const { data: preferences } = await supabase
    .from('preferences')
    .select('*')
    .eq('profile_id', user.id)
    .single()

  const profileWithRelations = {
    ...profile,
    physical_data: physicalData || null,
    goals: goals || null,
    habits: habits || null,
    medical_data: medicalData || null,
    preferences: preferences || null
  }

  const age = profileWithRelations?.physical_data?.birth_date ? new Date().getFullYear() - new Date(profileWithRelations.physical_data.birth_date).getFullYear() : 0
  const sex = profileWithRelations?.physical_data?.gender === 'male' ? 'masculin' : 'féminin'

  const systemPrompt = `
  Contexte :
  Je m'appelle ${profileWithRelations?.username}, je suis de sexe ${sex}, j'ai ${age} ans, je mesure ${profileWithRelations?.physical_data?.height_cm}cm pour ${profileWithRelations?.physical_data?.weight_kg}kg, et je souhaite atteindre les ${profileWithRelations?.goals?.target_weight} kilos de façon saine, durable et sans pression inutile.
  Voici mon profil santé et habitudes actuelles :
    - Activité physique : Je fais du sport ${profileWithRelations?.habits?.sport_week_frequency} fois par semaine
    ${profileWithRelations?.habits?.compulsive_habits ? '- Habitudes compulsives : grignotages, fringales, envies de sucre' : ''}
    ${profileWithRelations?.habits?.diet ? '- Régime : ' + profileWithRelations?.habits?.diet : ''}
    ${profileWithRelations?.habits?.religious_regime ? '- Régime religieux : ' + profileWithRelations?.habits?.religious_regime : ''}
    ${profileWithRelations?.medical_data?.medical_regimen ? '- Régime médical : ' + profileWithRelations?.medical_data?.medical_regimen : ''}
    ${profileWithRelations?.medical_data?.allergies ? '- Allergies : ' + profileWithRelations?.medical_data?.allergies.join(', ') : ''}
    ${profileWithRelations?.medical_data?.eating_disorders ? '- troubles alimentaires : ' + profileWithRelations?.medical_data?.eating_disorders.join(', ') : ''}
    ${profileWithRelations?.preferences?.dislikes ? '- Je n\'aime pas : ' + profileWithRelations?.preferences?.dislikes.join(', ') : ''}
    ${profileWithRelations?.profile_detail ? '- Infos supplémentaires : ' + profileWithRelations?.profile_detail : ''}

  Rôle :
  Tu es mon coach personnel, un nutritionniste expérimenté avec plus de 20 ans de pratique.
  Tu es à la fois un professionnel ultra-compétent et un allié chaleureux, capable de proposer des plans simples, adaptables et agréables à vivre.

  Action :
  À partir de mon profil, tu vas :
    1. Me proposer chaque jour des idées de repas adaptés à mes besoins (sains, équilibrés, nourrissants)
    2. Me fournir des messages de motivation réguliers (petits boosts bienveillants)
    3. Me donner des conseils psycho-émotionnels, adaptés à mon âge et à ma réalité (hormones, énergie, motivation)
    4. M’aider à suivre mes calories de façon non obsessionnelle (idéalement avec des repères visuels ou approximations faciles)
    5. Analyser les photos de mes repas (si je t’en envoie) pour les corriger ou les valider
    6. Me rappeler que tout progrès compte et que l’objectif est le bien-être, pas la perfection

  Format :
  Tu t’exprimes à travers différents formats ludiques et réutilisables :
    - Tableaux (ex. : idées de menus, calories, routines)
    - Listes à puces ou numérotées
    - Emojis pour rythmer et rendre agréable la lecture
    - Messages quotidiens courts (“Boost du jour”, “Le saviez-vous”, etc.)
    - Astuces visuelles (repères main/portion, schémas alimentaires simples)
    - Images si utiles (ex : pyramide alimentaire, assiette équilibrée)
    - Toujours en version facile à relire et copier/coller

  Ton :
  Tu me parles comme un bon copain bien informé :
    - Bienveillant, encourageant, compréhensif
    - Jamais culpabilisant, toujours orienté solutions
    - Un peu d’humour léger pour détendre
    - Capable de me remobiliser avec douceur si je flanche
    - Tu valorises les petits progrès, tu me rappelles que “ce n’est pas grave si tout n’est pas parfait”
  `

  const { id } = getRouterParams(event)
  const { messages } = await readBody(event)

  const gateway = process.env.CLOUDFLARE_AI_GATEWAY_ID && process.env.CLOUDFLARE_AI_API_KEY
    ? {
        id: process.env.CLOUDFLARE_AI_GATEWAY_ID,
        token: process.env.CLOUDFLARE_AI_API_KEY,
        cacheTtl: 60 * 60 * 24
      }
    : undefined
  const workersAI = createWorkersAI({ binding: hubAI(), gateway })

  const { chat, messages: chatMessages } = await getChatWithMessages(event, Number(id), user.id)
  if (!chat) {
    throw createError({ statusCode: 404, statusMessage: 'Chat not found' })
  }

  if (!chat.title) {
    const { response: title } = await hubAI().run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      stream: false,
      messages: [{
        role: 'system',
        content: `You are a title generator for a chat:
        - Generate a short title based on the first user's message
        - The title should be less than 30 characters long
        - The title should be a summary of the user's message
        - Do not use quotes (' or ") or colons (:) or any other punctuation
        - Do not use markdown, just plain text`
      }, {
        role: 'user',
        content: chatMessages[0].content!
      }]
    }, {
      gateway
    })

    const cleaned = title.replace(/:/g, '').split('\n')[0]
    setHeader(event, 'X-Chat-Title', cleaned)
    const supabaseClient = await useSupabase(event)
    await supabaseClient
      .from('chats')
      .update({ title: cleaned })
      .eq('id', Number(id))
  }

  const lastMessage = messages[messages.length - 1]
  if (lastMessage.role === 'user' && messages.length > 1) {
    await addMessage(event, Number(id), 'user', lastMessage.content)
  }

  return streamText({
    model: workersAI('@cf/meta/llama-4-scout-17b-16e-instruct'),
    system: systemPrompt,
    messages,
    maxTokens: 10000,
    async onFinish(response) {
      await addMessage(event, Number(id), 'assistant', response.text)
    }
  }).toDataStreamResponse()
})
