import { test, expect } from '@playwright/test'

test('auth redirect: unauthenticated user hitting /submit is redirected to /login', async ({ page }) => {
  await page.goto('/submit')
  await expect(page).toHaveURL(/\/login/)
})
