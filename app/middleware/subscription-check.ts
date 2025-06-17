import { useSubscriptionStore } from '~/stores/subscription'

export default defineNuxtRouteMiddleware(async () => {
  const user = await useFetch('/api/profile/simple-get')

  const customer = await useFetch('/api/customer/get', {
    params: {
      profileId: user.data.value?.id
    }
  })

  const allowedStatuses = ['active', 'trial']
  const subscriptionStore = useSubscriptionStore()

  if (!customer || !customer.data.value?.subscription_status || !allowedStatuses.includes(customer.data.value?.subscription_status)) {
    subscriptionStore.setInvalid(customer.data.value?.subscription_status)
    return
  }

  subscriptionStore.setValid(customer.data.value?.subscription_status)
})
