import { test, expect } from '@playwright/test'

test('upvote toggle: vote increments count, re-vote decrements count', async ({ page }) => {
  // Activate session via auth callback so votes are not rejected with 401
  await page.goto('/auth/callback?token=valid-token')
  await page.waitForURL('/')

  const upvoteBtn = page.getByRole('button', { name: 'Upvote' }).first()
  await expect(upvoteBtn).toBeVisible()

  const initialText = await upvoteBtn.innerText()
  const initialCount = Number(initialText.match(/\d+/)?.[0] ?? '0')

  await upvoteBtn.click()
  await expect(upvoteBtn).toContainText(String(initialCount + 1))

  await upvoteBtn.click()
  await expect(upvoteBtn).toContainText(String(initialCount))
})
