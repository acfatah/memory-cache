import { config, markdown, preset } from '@acfatah/eslint-preset'

export default config(
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

  {
    rules: {
      ...preset,
      ...markdown,
    },
  },
)
