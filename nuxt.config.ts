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
    },
    // Subscriptions bought in the iOS app (server/lib/revenuecat.ts)
    revenuecat: {
      secretKey: process.env.REVENUECAT_SECRET_KEY,
      webhookSecret: process.env.REVENUECAT_WEBHOOK_SECRET
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
    // The pages for the iOS app (/app/...) aren't linked from the site, so the crawler can't find them
    prerender: {
      routes: ['/', '/app/confidentialite', '/app/conditions-utilisation', '/app/compte-confirme'],
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
      // Exact paths, unless they end with a * wildcard. Prerendering runs without a session, so a
      // public page missing here is generated as a redirection to the login page
      exclude: ['/', '/tarifs', '/blog', '/blog/*', '/a-propos', '/conditions-utilisation', '/confidentialite', '/contact', '/inscription', '/mot-de-passe-oublie', '/nouveau-mot-de-passe', '/app/*']
    }
  }
})
