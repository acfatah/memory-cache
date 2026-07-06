import { defineConfig, markdown, typescript } from '@acfatah/eslint-preset'

export default defineConfig(
  {
    formatters: true,
    type: 'lib',

    ignores: [
      '**/coverage/**',
      '**/dist/**',
      '**/logs/**',
      '**/tsconfig.*',
      'bun.lock',
    ],
  },

  typescript,
  markdown,
)
