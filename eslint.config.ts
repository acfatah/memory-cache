import antfu from '@antfu/eslint-config'

export default antfu(
  {
    formatters: true,
  },

  {
    rules: {
      'no-console': 'off',
      'sort-imports': 'off',
      'perfectionist/sort-imports': [
        'error',
        {
          partitionByNewLine: true,
          newlinesBetween: 'ignore',
        },
      ],
    },
  },

  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/coverage/**', 'logs', 'tsconfig.*'],
  },
)
