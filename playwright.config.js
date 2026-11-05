import { defineConfig, devices } from '@playwright/test'

// Uçtan uca testler derlenmiş uygulamaya karşı çalışır; Supabase istekleri testlerde mock'lanır.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    locale: 'tr-TR',
    timezoneId: 'Europe/Istanbul',
    serviceWorkers: 'block', // SW, page.route mock'larını atlatmasın
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'masaüstü', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobil', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
