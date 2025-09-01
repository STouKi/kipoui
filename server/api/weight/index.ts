import { defineEventHandler, getQuery, readBody } from 'h3'
import { requireAuth } from '../../repositories/supabaseRepository'
import {
  addWeightRecord,
  getWeightRecords,
  getLatestWeightRecord,
  getWeightStats
} from '../../repositories/weightRepository'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const query = getQuery(event)
  const { action, limit, startDate, endDate } = query

  switch (action) {
    case 'list':
      return await getWeightRecords(event, user.id, {
        limit: limit ? parseInt(limit as string) : undefined,
        startDate: startDate as string,
        endDate: endDate as string
      })

    case 'latest':
      return await getLatestWeightRecord(event, user.id)

    case 'stats':
      return await getWeightStats(event, user.id)

    case 'add': {
      const body = await readBody(event)

      if (!body.weight_kg) {
        throw createError({
          statusCode: 400,
          message: 'Weight is required'
        })
      }

      return await addWeightRecord(event, user.id, {
        weight_kg: parseFloat(body.weight_kg)
      })
    }

    default:
      throw createError({
        statusCode: 400,
        message: 'Invalid action'
      })
  }
})
