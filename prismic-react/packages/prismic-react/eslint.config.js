import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        JSX: 'readonly',
        React: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // Allow console.log for debugging
      'no-console': 'warn',
      
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // Allow empty interfaces for extensibility
      '@typescript-eslint/no-empty-interface': 'off',
      
      // Allow non-null assertions when we know better
      '@typescript-eslint/no-non-null-assertion': 'warn',
    },
  },
  {
    ignores: ['dist/', 'coverage/', 'node_modules/', '*.js', '*.mjs'],
  }
);
