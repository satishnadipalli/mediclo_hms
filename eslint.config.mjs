import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import next from 'next';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  next.configs.recommended,

  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react/no-unescaped-entities': 'off',
      '@next/next/no-img-element': 'off',
    },
  },
];
