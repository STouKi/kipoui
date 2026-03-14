// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxt/content',
    '@nuxtjs/mdc',
    '@vueuse/nuxt',
    'nuxt-og-image',
    '@nuxtjs/supabase',
    '@unlok-co/nuxt-stripe',
    '@pinia/nuxt',
    '@vercel/analytics'
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
      appUrl: process.env.APP_URL,
      stripe: {
        key: process.env.STRIPE_PUBLIC_KEY
      },
      pricing: {
        customAICoachingAnnualPrice: process.env.STRIPE_CUSTOM_AI_COACHING_ANNUAL_PRICE,
        customAICoachingMonthlyPrice: process.env.STRIPE_CUSTOM_AI_COACHING_MONTHLY_PRICE,
        customAICoachingTrimestrialPrice: process.env.STRIPE_CUSTOM_AI_COACHING_TRIMESTRIAL_PRICE
      }
    },
    stripe: {
      key: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
    },
    supabase: {
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      url: process.env.SUPABASE_URL
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY
    },
    exa: {
      apiKey: process.env.EXASEARCH_API_KEY
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY
    },
    groq: {
      apiKey: process.env.GROQ_API_KEY
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

  vite: {
    optimizeDeps: {
      include: ['debug']
    },
    build: {
      commonjsOptions: {
        transformMixedEsModules: true
      }
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
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
