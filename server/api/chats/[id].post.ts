import { streamText } from 'ai'
import { createWorkersAI } from 'workers-ai-provider'
import { getUser } from '../../utils/getUser'

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

  const db = useDrizzle()
  const profile = await db.query.profiles.findFirst({
    where: (profile, { eq }) => eq(profile.id, user.id),
    with: {
      physicalData: true,
      goals: true,
      habits: true,
      medicalData: true,
      preferences: true
    }
  })

  const age = profile?.physicalData?.birthDate ? new Date().getFullYear() - new Date(profile.physicalData.birthDate).getFullYear() : 0
  const sex = profile?.physicalData?.gender === 'male' ? 'masculin' : 'féminin'

  const systemPrompt = `
  Contexte :
  Je m’appelle ${profile?.username}, je suis de sexe ${sex}, j’ai ${age} ans, je mesure ${profile?.physicalData?.heightCm}cm pour ${profile?.physicalData?.weightKg}kg, et je souhaite atteindre les ${profile?.goals?.targetWeight} kilos de façon saine, durable et sans pression inutile.
  Voici mon profil santé et habitudes actuelles :
    - Activité physique : Je fais du sport ${profile?.habits?.sportWeekFrequency} fois par semaine
    ${profile?.habits?.compulsivesHabits ? '- Habitudes compulsives : grignotages, fringales, envies de sucre' : ''}
    ${profile?.habits?.diet ? '- Régime : ' + profile?.habits?.diet : ''}
    ${profile?.habits?.religiousRegime ? '- Régime religieux : ' + profile?.habits?.religiousRegime : ''}
    ${profile?.medicalData?.medicalRegimen ? '- Régime médical : ' + profile?.medicalData?.medicalRegimen : ''}
    ${profile?.medicalData?.allergies ? '- Allergies : ' + profile?.medicalData?.allergies.join(', ') : ''}
    ${profile?.medicalData?.eatingDisorders ? '- troubles alimentaires : ' + profile?.medicalData?.eatingDisorders.join(', ') : ''}
    ${profile?.preferences?.dislikes ? '- Je n\'aime pas : ' + profile?.preferences?.dislikes.join(', ') : ''}
    ${profile?.profileDetail ? '- Infos supplémentaires : ' + profile?.profileDetail : ''}

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

  const gateway = process.env.CLOUDFLARE_AI_GATEWAY_ID
    ? {
        id: process.env.CLOUDFLARE_AI_GATEWAY_ID,
        cacheTtl: 60 * 60 * 24
      }
    : undefined
  const workersAI = createWorkersAI({ binding: hubAI(), gateway })

  const chat = await db.query.chats.findFirst({
    where: (chat, { eq }) => and(eq(chat.id, Number(id)), eq(chat.profileId, user.id)),
    with: {
      messages: true
    }
  })
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
        content: chat.messages[0]!.content
      }]
    }, {
      gateway
    })
    setHeader(event, 'X-Chat-Title', title.replace(/:/g, '').split('\n')[0])
    await db.update(tables.chats).set({ title }).where(eq(tables.chats.id, Number(id)))
  }

  const lastMessage = messages[messages.length - 1]
  if (lastMessage.role === 'user' && messages.length > 1) {
    await db.insert(tables.messages).values({
      chatId: Number(id),
      role: 'user',
      content: lastMessage.content
    })
  }

  return streamText({
    model: workersAI('@cf/meta/llama-4-scout-17b-16e-instruct'),
    system: systemPrompt,
    messages,
    maxTokens: 10000,
    async onFinish(response) {
      await db.insert(tables.messages).values({
        chatId: Number(id),
        role: 'assistant',
        content: response.text
      })
    }
  }).toDataStreamResponse()
})
