module.exports = {
  extends: ['plugin:prettier/recommended'],
  plugins: ['prettier'],
  env: {
    browser: false,
    commonjs: true,
    es6: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  rules: {
    'no-const-assign': 'warn',
    'no-this-before-super': 'warn',
    'no-undef': 'warn',
    'no-unreachable': 'warn',
    'no-unused-vars': 'warn',
    'constructor-super': 'warn',
    'prettier/prettier': ['error', { endOfLine: 'auto' }],
  },
  settings: {},
}
