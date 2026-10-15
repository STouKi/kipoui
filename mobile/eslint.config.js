// @ts-check
import { defineConfig } from 'eslint/config'
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import stylistic from '@stylistic/eslint-plugin'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig(
  // The native project and its build output (cap sync, cap run)
  { ignores: ['dist/**', 'ios/**'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser }
    },
    rules: {
      // TypeScript already checks names, including global types this rule doesn't know
      'no-undef': 'off'
    }
  },
  {
    rules: {
      // Ionic components are web components: `slot` is their native attribute, not Vue's
      // deprecated syntax, and the autofix to <template #slot> breaks them
      'vue/no-deprecated-slot-attribute': 'off'
    }
  },
  {
    languageOptions: {
      globals: { ...globals.browser }
    }
  },
  // Same code style as the website (@nuxt/eslint's stylistic rules with these options)
  stylistic.configs.customize({ commaDangle: 'never', braceStyle: '1tbs' })
)
