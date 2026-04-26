import { test, expect } from '@playwright/test'

test('submit flow: unauthenticated → redirected to login → email → confirmation', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('link', { name: 'Submit', exact: true }).click()
  await expect(page).toHaveURL(/\/login/)

  await page.getByLabel('Email').fill('test@example.com')
  await page.getByRole('button', { name: /send magic link/i }).click()

  await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible()
})
