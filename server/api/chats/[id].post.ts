import { streamText } from 'ai'
import { createWorkersAI } from 'workers-ai-provider'
import { requireAuth } from '../../repositories/baseRepository'
import { getFullProfileData } from '../../repositories/profileRepository'
import { updateChatTitle, getChatWithMessages } from '../../repositories/chatRepository'
import { addMessage } from '../../repositories/messageRepository'

defineRouteMeta({
  openAPI: {
    description: 'Chat with AI.',
    tags: ['ai']
  }
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const fullProfile = await getFullProfileData(event, user.id)

  let age = 0
  if (fullProfile?.physicalData?.birth_date) {
    const birthDate = new Date(fullProfile.physicalData.birth_date)
    const today = new Date()
    age = today.getFullYear() - birthDate.getFullYear()
    if (
      today.getMonth() < birthDate.getMonth()
      || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
    ) {
      age--
    }
  }
  const sex = fullProfile?.physicalData?.gender === 'male' ? 'masculin' : 'féminin'

  const systemPrompt = `
  Contexte :
  Je m'appelle ${fullProfile?.profile?.username}, je suis de sexe ${sex}, j'ai ${age} ans, je mesure ${fullProfile?.physicalData?.height_cm}cm pour ${fullProfile?.physicalData?.weight_kg}kg, et je souhaite atteindre les ${fullProfile?.goals?.target_weight} kilos de façon saine, durable et sans pression inutile.
  Voici mon profil santé et habitudes actuelles :
    - Activité physique : Je fais du sport ${fullProfile?.habits?.sport_week_frequency} fois par semaine
    ${fullProfile?.habits?.compulsive_habits ? '- Habitudes compulsives : grignotages, fringales, envies de sucre' : ''}
    ${fullProfile?.habits?.diet ? '- Régime : ' + fullProfile?.habits?.diet : ''}
    ${fullProfile?.habits?.religious_regime ? '- Régime religieux : ' + fullProfile?.habits?.religious_regime : ''}
    ${fullProfile?.medicalData?.medical_regimen ? '- Régime médical : ' + fullProfile?.medicalData?.medical_regimen : ''}
    ${fullProfile?.medicalData?.allergies ? '- Allergies : ' + fullProfile?.medicalData?.allergies.join(', ') : ''}
    ${fullProfile?.medicalData?.eating_disorders ? '- troubles alimentaires : ' + fullProfile?.medicalData?.eating_disorders.join(', ') : ''}
    ${fullProfile?.preferences?.dislikes ? '- Je n\'aime pas : ' + fullProfile?.preferences?.dislikes.join(', ') : ''}
    ${fullProfile?.profile?.profile_detail ? '- Infos supplémentaires : ' + fullProfile?.profile?.profile_detail : ''}

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
    await updateChatTitle(event, Number(id), cleaned)
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
