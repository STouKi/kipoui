import type { Enums } from '@server/types/public'

// Same labels as the website's settings (app/components/dashboard/settings). Typed by the
// database enums: a new enum value won't compile until it has a label

export const GENDER_LABELS: Record<Enums<'gender'>, string> = {
  female: 'Femme',
  male: 'Homme'
}

export const DIET_LABELS: Record<Enums<'diet'>, string> = {
  vegan: 'Végétalien',
  vegetarian: 'Végétarien',
  pescatarian: 'Pescétarien'
}

export const RELIGIOUS_REGIME_LABELS: Record<Enums<'religious_regime'>, string> = {
  halal: 'Halal',
  kasher: 'Kasher',
  buddhist: 'Bouddhiste',
  religious_fasting: 'Jeûne religieux'
}

export const ALLERGY_LABELS: Record<Enums<'allergy'>, string> = {
  cereals_containing_gluten: 'Céréales contenant du gluten',
  crustaceans: 'Crustacés',
  eggs: 'Œufs',
  fish: 'Poisson',
  peanuts: 'Arachides',
  soybeans: 'Soja',
  milk: 'Lait',
  tree_nuts: 'Fruits à coque',
  celery: 'Céleri',
  mustard: 'Moutarde',
  sesame_seeds: 'Graines de sésame',
  sulphur_dioxide_and_sulphites: 'Dioxyde de soufre et sulfites',
  lupin: 'Lupin',
  molluscs: 'Mollusques'
}

export const EATING_DISORDER_LABELS: Record<Enums<'eating_disorders'>, string> = {
  anorexia: 'Anorexie',
  bulimia: 'Boulimie'
}

export const MEDICAL_REGIMEN_LABELS: Record<Enums<'medical_regimen'>, string> = {
  diabetes: 'Diabète',
  cholesterol: 'Cholestérol',
  hypertension: 'Hypertension',
  crohn: 'Maladie de Crohn'
}

// Object.entries types its keys as plain strings
export function options<T extends string>(labels: Record<T, string>) {
  return (Object.entries(labels) as [T, string][]).map(([value, label]) => ({ value, label }))
}
