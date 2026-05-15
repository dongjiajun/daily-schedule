import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  input: '../specs/openapi.yaml',
  output: {
    path: 'src/api',
  },
  plugins: ['@hey-api/client-fetch', '@hey-api/sdk', '@hey-api/typescript'],
})
