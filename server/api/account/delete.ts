import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../types/public'
import { getAuthUser } from '../../repositories/supabaseRepository'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()

    const supabaseAdmin = createClient<Database>(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const user = await getAuthUser(event)

    const { error } = await supabaseAdmin.auth.admin.deleteUser(user!.id)

    if (error) {
      console.error('Error deleting user:', error)

      throw createError({
        statusCode: 500,
        message: 'Erreur lors de la suppression du compte'
      })
    }

    return { success: true, message: 'Compte supprimé avec succès' }
  } catch (error: unknown) {
    console.error('Error in delete account handler:', error)

    const err = error as { statusCode?: number, message?: string }
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || 'Une erreur est survenue lors de la suppression du compte'
    })
  }
})
