// tests/e2e/demo.spec.ts
// E2E test for demo page

import { test, expect } from '@playwright/test';

test.describe('Demo Page', () => {
  test('should load demo page with torus grid', async ({ page }) => {
    await page.goto('/demo');
    
    // Check for page title
    await expect(page.locator('h1')).toContainText('DREAMengin Demo');
    
    // Check for torus grid text in description
    await expect(page.locator('p')).toContainText('Torus grid');
    
    // Check for navigation instructions
    await expect(page.getByText('Use arrow keys or swipe to navigate')).toBeVisible();
  });

  test('should navigate between pages with arrow keys', async ({ page }) => {
    await page.goto('/demo');
    
    // Wait for the demo to load
    await page.waitForSelector('text=Page 0,0', { timeout: 5000 });
    
    // Check initial page
    await expect(page.locator('text=Page 0,0')).toBeVisible();
    
    // Press right arrow
    await page.keyboard.press('ArrowRight');
    
    // Should now be on page 1,0
    await expect(page.locator('text=Page 1,0')).toBeVisible();
  });

  test('should show grid visualization', async ({ page }) => {
    await page.goto('/demo');
    
    // Wait for grid to render
    await page.waitForSelector('text=(0, 0)', { timeout: 5000 });
    
    // Check that all 4 grid cells are present
    await expect(page.locator('text=(0, 0)')).toBeVisible();
    await expect(page.locator('text=(1, 0)')).toBeVisible();
    await expect(page.locator('text=(0, 1)')).toBeVisible();
    await expect(page.locator('text=(1, 1)')).toBeVisible();
  });
});
