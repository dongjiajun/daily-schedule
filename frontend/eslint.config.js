import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'src/api/**/*.gen.ts', 'src/api/**/*.gen.tsx']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['src/modules/**/routes.tsx'],
    rules: {
      // 路由配置文件导出 RouteObject[] 并伴随 lazy() 页面声明，不参与 React Fast Refresh 组件热替换边界
      'react-refresh/only-export-components': 'off',
    },
  },
])
