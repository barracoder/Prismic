import { test } from '@playwright/test';

test('Debug: Take screenshot and check console', async ({ page }) => {
  // Listen for console messages
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  // Listen for page errors
  page.on('pageerror', exception => console.log('PAGE ERROR:', exception.message));
  
  await page.goto('/');
  
  // Wait a bit for any async operations
  await page.waitForTimeout(2000);
  
  // Take a screenshot to see what's actually rendered
  await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
  
  // Check page content
  const content = await page.content();
  console.log('PAGE HTML:', content);
  
  // Check if there are any elements at all
  const bodyContent = await page.locator('body').innerHTML();
  console.log('BODY CONTENT:', bodyContent);
});
