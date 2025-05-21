// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui-pro',
    '@nuxt/content',
    '@vueuse/nuxt',
    'nuxt-og-image',
    '@nuxtjs/supabase',
    '@nuxthub/core'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  future: {
    compatibilityVersion: 4
  },

  compatibilityDate: '2024-07-11',

  nitro: {
    prerender: {
      routes: [
        '/'
      ],
      crawlLinks: true
    }
  },

  hub: {
    ai: true
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  image: {
    dir: 'assets/images'
  },

  supabase: {
    redirectOptions: {
      login: '/connexion',
      callback: '/confirm',
      exclude: ['/', '/tarifs', '/blog', '/a-propos', '/inscription', '/mot-de-passe-oublie', '/nouveau-mot-de-passe']
    }
  }
})
