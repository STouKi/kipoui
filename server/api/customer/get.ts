import { getCustomerByProfileId } from '../../repositories/customerRepository'

export default defineEventHandler(async (event) => {
  const { profileId } = getQuery(event)

  const customer = await getCustomerByProfileId(event, profileId as string)

  return customer
})
