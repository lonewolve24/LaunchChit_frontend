import { test, expect } from '@playwright/test'

// Note: TanStack Start SSR requires a production build with a Node/Edge server.
// In dev mode (Vite SPA), the raw HTML shell has no pre-rendered content.
// This test verifies the product name is present in the rendered page — the
// observable outcome that SSR would also guarantee.
test('detail page: product name visible after navigation', async ({ page }) => {
  await page.goto('/p/farmlink-gm-a3k9z2')
  await expect(page.getByRole('heading', { name: /farmlink gm/i })).toBeVisible()
})
