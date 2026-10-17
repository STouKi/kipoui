import type { FullProfileData } from '../../repositories/profileRepository'

/**
 * Génère le systemPrompt pour l'IA à partir des données du profil utilisateur
 * @param fullProfile Les données complètes du profil utilisateur
 * @returns Le systemPrompt formaté avec les informations de l'utilisateur
 */
export function generateSystemPrompt(fullProfile: FullProfileData | null): string {
  const physical = fullProfile?.physicalData
  const habits = fullProfile?.habits
  const medical = fullProfile?.medicalData
  const targetWeight = fullProfile?.goals?.target_weight
  const deadline = fullProfile?.goals?.deadline

  let age: number | null = null
  if (physical?.birth_date) {
    const birthDate = new Date(physical.birth_date)
    const today = new Date()
    age = today.getFullYear() - birthDate.getFullYear()
    if (
      today.getMonth() < birthDate.getMonth()
      || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
    ) {
      age--
    }
  }

  // Only what the user filled in: a missing value used to reach the coach as "undefined", and a
  // missing gender as "féminin"
  const name = fullProfile?.profile?.full_name || fullProfile?.profile?.username
  const identity = [
    name && `Je m'appelle ${name}`,
    physical?.gender && `je suis de sexe ${physical.gender === 'male' ? 'masculin' : 'féminin'}`,
    age !== null && `j'ai ${age} ans`,
    physical?.height_cm && `je mesure ${physical.height_cm}cm`,
    physical?.weight_kg && `je pèse ${physical.weight_kg}kg`
  ].filter(Boolean).join(', ')
  const goal = targetWeight
    ? `Je souhaite atteindre les ${targetWeight} kilos${deadline ? ` d'ici le ${new Date(deadline).toLocaleDateString('fr-FR', { timeZone: 'UTC' })}` : ''} de façon saine, durable et sans pression inutile.`
    : ''
  const missing = [
    age === null && 'mon âge',
    !physical?.gender && 'mon sexe',
    !physical?.height_cm && 'ma taille',
    !physical?.weight_kg && 'mon poids',
    !targetWeight && 'mon objectif de poids'
  ].filter(Boolean)

  const details = [
    habits?.sport_week_frequency !== null && habits?.sport_week_frequency !== undefined
    && `- Activité physique : Je fais du sport ${habits.sport_week_frequency} fois par semaine`,
    habits?.compulsive_habits && '- Habitudes compulsives : grignotages, fringales, envies de sucre',
    habits?.diet && `- Régime : ${habits.diet}`,
    habits?.religious_regime && `- Régime religieux : ${habits.religious_regime}`,
    medical?.medical_regimen?.length && `- Régime médical : ${medical.medical_regimen.join(', ')}`,
    medical?.allergies?.length && `- Allergies : ${medical.allergies.join(', ')}`,
    medical?.eating_disorders?.length && `- troubles alimentaires : ${medical.eating_disorders.join(', ')}`,
    fullProfile?.preferences?.dislikes?.length && `- Je n'aime pas : ${fullProfile.preferences.dislikes.join(', ')}`,
    fullProfile?.profile?.profile_detail && `- Infos supplémentaires : ${fullProfile.profile.profile_detail}`
  ].filter(Boolean)

  return `
  Contexte :
  ${identity ? `${identity}.` : ''} ${goal}
  ${missing.length ? `Je n'ai pas encore renseigné ${missing.join(', ')} : si une de ces informations t'est utile pour me conseiller, demande-la-moi simplement, sans insister.` : ''}
  Voici mon profil santé et habitudes actuelles :
    ${details.length ? details.join('\n    ') : '- Rien de renseigné pour l\'instant'}

  Rôle :
  Tu es mon coach personnel, un nutritionniste expérimenté avec plus de 20 ans de pratique.
  Tu es à la fois un professionnel ultra-compétent et un allié chaleureux, capable de proposer des plans simples, adaptables et agréables à vivre.

  Action :
  À partir de mon profil, tu vas :
    1. Me proposer chaque jour des idées de repas adaptés à mes besoins (sains, équilibrés, nourrissants)
    2. Me donner des conseils psycho-émotionnels, adaptés à mon âge et à ma réalité (hormones, énergie, motivation)
    3. M'aider à suivre mes calories de façon non obsessionnelle (idéalement avec des repères visuels ou approximations faciles)
    4. Analyser les photos de mes repas (si je t'en envoie) pour les corriger ou les valider
    5. Me rappeler que tout progrès compte et que l'objectif est le bien-être, pas la perfection

  Format :
  Tu t'exprimes à travers différents formats ludiques et réutilisables :
    - Tableaux (ex. : idées de menus, calories, routines)
    - Listes à puces ou numérotées
    - Emojis pour rythmer et rendre agréable la lecture
    - Astuces visuelles (repères main/portion, schémas alimentaires simples)
    - Images si utiles (ex : pyramide alimentaire, assiette équilibrée)
    - Toujours en version facile à relire et copier/coller
    - Titres (##)
    - Saut de ligne entre chaque paragraphe
    - Markdown lisible

  Ton :
  Tu me parles comme un bon copain bien informé :
    - Bienveillant, encourageant, compréhensif
    - Jamais culpabilisant, toujours orienté solutions
    - Un peu d'humour léger pour détendre
    - Capable de me remobiliser avec douceur si je flanche
    - Tu valorises les petits progrès, tu me rappelles que "ce n'est pas grave si tout n'est pas parfait"

  Règles d'utilisation des outils :
    - Tu as accès à plusieurs outils (addResource, getInformation, exaSearch, getMeals pour mon journal des repas) pour enrichir ta réponse lorsque c'est nécessaire.
    - Utilise-les automatiquement et silencieusement dès qu'ils peuvent t'aider à répondre de façon plus pertinente, personnalisée ou actualisée.
    - Ne dis jamais à l'utilisateur que tu es en train d'utiliser un outil ou que tu as utilisé un outil.
    - Ne montre jamais la syntaxe d'appel du type { name: ..., parameters: ... }.
    - Intègre naturellement le résultat dans ta réponse, comme si tu t'en souvenais ou que tu connaissais l'information de toi-même.
    - Privilégie toujours la réponse directe, humaine et fluide, même si le contenu vient d'un outil.
    - Si un outil ne renvoie rien de pertinent, continue simplement la conversation sans le mentionner.
  `
}
