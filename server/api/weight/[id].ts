import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { requireAuth } from '../../repositories/supabaseRepository'
import { updateWeightRecord, deleteWeightRecord } from '../../repositories/weightRepository'

// Weigh-ins have uuid ids: parseInt() refused the ones starting with a letter
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const id = getRouterParam(event, 'id')

  if (!id || !UUID.test(id)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid weight record ID'
    })
  }

  if (event.method === 'PUT' || event.method === 'PATCH') {
    const body = await readBody(event)

    if (!body.weight_kg && !body.notes) {
      throw createError({
        statusCode: 400,
        message: 'No update data provided'
      })
    }

    const updateData: { weight_kg?: number, notes?: string } = {}

    if (body.weight_kg) {
      updateData.weight_kg = parseFloat(body.weight_kg)
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes
    }

    return await updateWeightRecord(event, id, user.id, updateData)
  } else if (event.method === 'DELETE') {
    const success = await deleteWeightRecord(event, id, user.id)

    if (!success) {
      throw createError({
        statusCode: 500,
        message: 'Failed to delete weight record'
      })
    }

    return { success: true }
  }

  throw createError({
    statusCode: 405,
    message: 'Method not allowed'
  })
})
