import { createGroq } from '@ai-sdk/groq'
import { generateText } from 'ai'
import type { FullProfileData } from '../../repositories/profileRepository'
import type { Meal } from '../../repositories/mealRepository'
import { describeProfile } from './systemPrompt'

const MEAL_TYPES = { breakfast: 'petit-déjeuner', lunch: 'déjeuner', snack: 'collation', dinner: 'dîner' }

function foodsOf(meal: Meal) {
  return (Array.isArray(meal.items) ? meal.items : [])
    .map(item => (item as { name?: unknown } | null)?.name)
    .filter((name): name is string => typeof name === 'string')
    .join(', ')
}

export interface MealCommentInput {
  profile: FullProfileData
  meal: Meal
  // Every meal of the same day, the commented one included
  dayMeals: Meal[]
  // Estimated daily needs in kcal, computed by the app
  needs: number | null
  timeZone: string
}

// The coach's reaction to a meal just added to the journal: something positive, then a tip for
// the rest of the day. Users who declared an eating disorder get no figure at all
export async function commentMeal(apiKey: string, input: MealCommentInput) {
  const { profile, meal, dayMeals, needs, timeZone } = input
  const withFigures = !profile.medicalData?.eating_disorders?.length
  const time = new Intl.DateTimeFormat('fr-FR', { timeZone, hour: '2-digit', minute: '2-digit' })
  const { summary, details } = describeProfile(profile)

  const describe = (item: Meal) => {
    const figures = withFigures
      ? ` (${item.kcal} kcal, ${item.protein_g} g de protéines, ${item.carbs_g} g de glucides, ${item.fat_g} g de lipides)`
      : ''
    const foods = foodsOf(item)
    return `${MEAL_TYPES[item.meal_type]} de ${time.format(new Date(item.eaten_at))} : ${item.name}${foods ? ` [${foods}]` : ''}${figures}`
  }
  const others = dayMeals.filter(item => item.id !== meal.id)
  const totalKcal = dayMeals.reduce((sum, item) => sum + item.kcal, 0)
  const totalProtein = Math.round(dayMeals.reduce((sum, item) => sum + item.protein_g, 0))

  const figuresRule = withFigures
    ? 'Tu peux citer un chiffre s\'il aide vraiment, sans faire les comptes à sa place.'
    : 'Ne cite aucun chiffre (calories, grammes, poids) et ne parle ni de calories ni de poids : la personne a déclaré un trouble du comportement alimentaire. Parle d\'équilibre, de variété et de plaisir.'

  const system = `Tu es le coach nutrition de l'utilisateur dans l'application Kipoui : un nutritionniste bienveillant, concret et jamais culpabilisant, qui parle comme un bon copain bien informé et tutoie l'utilisateur.
L'utilisateur vient d'enregistrer un repas dans son journal. Réagis en deux phrases courtes au plus (40 mots en tout) :
- d'abord un point positif précis sur ce repas ;
- puis un conseil pratique pour la suite de sa journée (le prochain repas ou une collation), qui tient compte de ce qu'il a déjà mangé aujourd'hui, de son objectif et de son profil.
Respecte son régime, ses allergies et ses goûts. N'invente rien sur ce qu'il a mangé.
Texte brut uniquement : pas de markdown, pas de liste, pas de titre, un emoji au plus. Ne répète pas le nom du repas.
${figuresRule}`

  const prompt = [
    `Mon profil : ${summary.trim() || 'pas encore renseigné.'}`,
    ...details,
    withFigures && needs ? `Mon besoin estimé : environ ${needs} kcal par jour.` : '',
    others.length
      ? `Ce que j'ai déjà mangé aujourd'hui :\n${others.map(item => `- ${describe(item)}`).join('\n')}`
      : 'C\'est mon premier repas de la journée.',
    withFigures ? `Total de la journée avec ce repas : ${totalKcal} kcal, ${totalProtein} g de protéines.` : '',
    `Il est ${time.format(new Date())}.`,
    `Le repas que je viens d'enregistrer : ${describe(meal)}`
  ].filter(Boolean).join('\n')

  const groq = createGroq({ apiKey })
  const { text } = await generateText({
    model: groq('openai/gpt-oss-120b'),
    providerOptions: { groq: { reasoningEffort: 'low' } },
    system,
    prompt
  })
  return clean(text)
}

// Plain text of two sentences at most, whatever the model returned
function clean(text: string) {
  const plain = text.replace(/[*_#`>]/g, '').replace(/\s+/g, ' ').trim()
  if (plain.length <= 400) return plain
  const cut = plain.slice(0, 400)
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '))
  return end > 0 ? cut.slice(0, end + 1) : `${cut.slice(0, 399)}…`
}
