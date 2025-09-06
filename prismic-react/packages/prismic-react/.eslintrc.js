module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [
    '@typescript-eslint',
  ],
  globals: {
    JSX: 'readonly',
    React: 'readonly',
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
  settings: {
    react: {
      version: 'detect',
    },
  },
};
