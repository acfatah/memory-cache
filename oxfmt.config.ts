import { defineConfig } from 'oxfmt'

// Matches the style of the old @acfatah/eslint-preset.
export default defineConfig({
  printWidth: 100,
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
  arrowParens: 'avoid',
  // Keep package.json in its hand-kept order.
  sortPackageJson: false,
  // The same groups as perfectionist's sort-imports defaults.
  sortImports: {
    ignoreCase: false,
    newlinesBetween: true,
    partitionByComment: true,
    groups: [
      'type-import',
      ['value-builtin', 'value-external'],
      'type-internal',
      'value-internal',
      ['type-parent', 'type-sibling', 'type-index'],
      ['value-parent', 'value-sibling', 'value-index'],
      'unknown',
    ],
  },
  ignorePatterns: [
    'coverage/**',
    'dist/**',
    'logs/**',
    'plan/**',
    '**/tsconfig.*',
    'bun.lock',
    'drafts/**',
    '.claude/**',
  ],
})
