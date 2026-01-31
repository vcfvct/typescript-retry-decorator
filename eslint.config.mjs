import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/explicit-function-return-type': ['warn', { allowExpressions: true }],

      'indent': ['error', 2],
      'no-trailing-spaces': 'error',
      'quotes': ['error', 'single', { allowTemplateLiterals: true }],
      'semi': ['error', 'always'],
      'spaced-comment': ['error', 'always'],
      'no-irregular-whitespace': ['error', { skipComments: true }],
      'space-infix-ops': 'error',
      'array-bracket-spacing': 'error',
      'object-curly-spacing': ['error', 'always'],
      'space-before-function-paren': ['error', {
        named: 'never',
        anonymous: 'never',
        asyncArrow: 'always',
      }],
      'comma-dangle': ['warn', 'always-multiline'],
      'no-multiple-empty-lines': 'error',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**'],
  }
);
