// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui-pro',
    '@nuxt/content',
    '@nuxtjs/mdc',
    '@vueuse/nuxt',
    'nuxt-og-image',
    '@nuxtjs/supabase',
    '@nuxthub/core',
    '@unlok-co/nuxt-stripe',
    '@pinia/nuxt'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  mdc: {
    highlight: {
      shikiEngine: 'javascript'
    }
  },

  runtimeConfig: {
    public: {
      appUrl: process.env.APP_URL || 'http://localhost:3000'
    },
    stripe: {
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
    }
  },

  future: {
    compatibilityVersion: 4
  },

  compatibilityDate: '2024-07-11',

  nitro: {
    experimental: {
      openAPI: true
    },
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

  stripe: {
    server: {
      key: process.env.STRIPE_SECRET_KEY
    },
    client: {
      key: process.env.STRIPE_PUBLIC_KEY
    }
  },

  supabase: {
    redirectOptions: {
      login: '/connexion',
      callback: '/confirm',
      exclude: ['/', '/tarifs', '/blog', '/a-propos', '/conditions-utilisation', '/inscription', '/mot-de-passe-oublie', '/nouveau-mot-de-passe']
    }
  }
})