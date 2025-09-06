import { test, expect } from '@playwright/test';

test.describe('EventAggregator Demo', () => {
  test('should demonstrate event publishing and subscribing', async ({ page }) => {
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');

    // Find the Event Aggregator Demo section
    const eventSection = page.locator('section:has(h2:text("Event Aggregator Demo"))');
    await expect(eventSection).toBeVisible();

    // Find the event publisher and subscriber components
    const publisher = eventSection.locator('[style*="007acc"]'); // Publisher has blue border
    const subscriber = eventSection.locator('[style*="28a745"]'); // Subscriber has green border

    await expect(publisher).toBeVisible();
    await expect(subscriber).toBeVisible();

    // Initially, subscriber should show no events
    await expect(subscriber.locator('text=No events received yet')).toBeVisible();
    await expect(subscriber.locator('text=User Actions: 0, Notifications: 0')).toBeVisible();

    // Click the "Simple Click" button
    await publisher.locator('button:text("Simple Click")').click();

    // Wait a moment for the event to be processed
    await page.waitForTimeout(100);

    // Check that the subscriber received the events
    await expect(subscriber.locator('text=User Actions: 1, Notifications: 1')).toBeVisible();
    await expect(subscriber.locator('text=Action: CLICK')).toBeVisible();
    await expect(subscriber.locator('text=User performed action: CLICK')).toBeVisible();

    // Click the "Save Action" button
    await publisher.locator('button:text("Save Action")').click();
    await page.waitForTimeout(100);

    // Check that more events were received
    await expect(subscriber.locator('text=User Actions: 2, Notifications: 2')).toBeVisible();
    await expect(subscriber.locator('text=Action: SAVE')).toBeVisible();
    await expect(subscriber.locator('text=User performed action: SAVE')).toBeVisible();

    // Click the "Special Process" button
    await publisher.locator('button:text("Special Process")').click();
    
    // Wait for the special process to complete (it has timeouts)
    await page.waitForTimeout(2000);

    // Check that the special process generated multiple events
    // The special process should generate: 1 initial notification + 2 user actions + 1 completion notification = 4 events
    // Plus the previous 2 notifications = 6 total notifications
    // Plus the previous 2 user actions + 2 new user actions = 4 total user actions
    await expect(subscriber.locator('text=User Actions: 4, Notifications: 6')).toBeVisible();
    
    // Check for specific special process messages
    await expect(subscriber.locator('text=Starting special action...')).toBeVisible();
    await expect(subscriber.locator('text=Special action completed!')).toBeVisible();

    // Test the clear log functionality
    await subscriber.locator('button:text("Clear Log")').click();
    await expect(subscriber.locator('text=User Actions: 0, Notifications: 0')).toBeVisible();
    await expect(subscriber.locator('text=No events received yet')).toBeVisible();
  });

  test('should show event timestamps and data', async ({ page }) => {
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');

    const eventSection = page.locator('section:has(h2:text("Event Aggregator Demo"))');
    const publisher = eventSection.locator('[style*="007acc"]');
    const subscriber = eventSection.locator('[style*="28a745"]');

    // Click a button to generate an event
    await publisher.locator('button:text("Simple Click")').click();
    await page.waitForTimeout(100);

    // Check that timestamps are displayed (they should be in HH:MM:SS format)
    const timestampPattern = /\d{1,2}:\d{2}:\d{2}/;
    const timestampElement = subscriber.locator('span').filter({ hasText: timestampPattern });
    await expect(timestampElement).toBeVisible();

    // Check that event data is displayed for user actions (JSON format)
    await expect(subscriber.locator('text="buttonId"')).toBeVisible();
    await expect(subscriber.locator('text="component"')).toBeVisible();
  });
});
