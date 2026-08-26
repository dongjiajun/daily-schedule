import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
  },
  // Taro runtime 编译期常量（Taro 构建由 webpack DefinePlugin 注入，vitest 环境需手动对齐）
  define: {
    ENABLE_INNER_HTML: 'false',
    ENABLE_ADJACENT_HTML: 'false',
    ENABLE_TEMPLATE_CONTENT: 'false',
    ENABLE_CLONE_NODE: 'false',
    ENABLE_CONTAINS: 'false',
    ENABLE_SIZE_APIS: 'false',
  },
})
