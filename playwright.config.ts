import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=test',
      port: 8080,
      timeout: 300_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd frontend && pnpm run dev',
      port: 5173,
      timeout: 30_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
