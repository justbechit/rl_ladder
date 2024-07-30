module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
  },
  'extends': [
    'eslint:recommended',
    'plugin:vue/essential',
    'plugin:vue/vue3-essential', // 如果你是在用 Vue 3，就取消这行的注释
    // 'plugin:vue/vue3-recommended', // 更严格的 Vue 3 规则，可选使用
    '@vue/standard'
  ],
  parserOptions: {
    parser: 'babel-eslint',
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'vue/no-unused-components': 'warn', // 未使用的组件
    'vue/no-unused-vars': 'warn', // 模板中未使用的变量
    'indent': ['error', 2], // 缩进使用两个空格
    'quotes': ['error', 'single'], // 强制使用单引号
    'semi': ['error', 'always'] // 句尾使用分号
  }
};
