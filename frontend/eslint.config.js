import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import configPrettier from 'eslint-config-prettier'
import globals from 'globals'

// ESLint 9 扁平配置（flat config）。
// 规则集：JS 推荐 + Vue3 推荐；格式相关规则交给 Prettier，故最后用 eslint-config-prettier 关闭冲突项。
export default [
  { ignores: ['dist/**', 'node_modules/**'] },

  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],

  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      // 视图/入口组件多为单词命名（如 HomeView 的 index 约定），不强制多词组件名
      'vue/multi-word-component-names': 'off',
    },
  },

  // 放最后：关闭与 Prettier 冲突的格式类规则
  configPrettier,
]
