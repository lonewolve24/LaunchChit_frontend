import { test, expect } from '@playwright/test'

test('feed renders products in descending vote count order', async ({ page }) => {
  await page.goto('/')

  // Wait for products to load (skeleton gone, real cards present)
  const upvoteBtns = page.getByRole('button', { name: 'Upvote' })
  await expect(upvoteBtns.first()).toBeVisible()

  const counts = await upvoteBtns.evaluateAll((btns) =>
    btns.map((btn) => Number(btn.textContent?.match(/\d+/)?.[0] ?? '0'))
  )

  for (let i = 0; i < counts.length - 1; i++) {
    expect(counts[i]).toBeGreaterThanOrEqual(counts[i + 1])
  }
})
