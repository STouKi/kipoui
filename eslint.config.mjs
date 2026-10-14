// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  // Generated files: the native project and its build output (cap sync, cap run), and the
  // database types from `supabase gen types`
  ignores: ['ios/**', 'server/types/public.ts', 'server/types/vecs.ts']
})
