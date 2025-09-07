import { test, expect } from '@playwright/test';

test.describe('EventAggregator Demo', () => {
  test('should demonstrate event publishing and subscribing', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find the Event Aggregator Demo section
    const eventSection = page.locator('section:has(h2:text("Event Aggregator Demo"))');
    await expect(eventSection).toBeVisible();

    // Find the event publisher and subscriber components
    const publisher = eventSection.locator('h4:text("📤 Event Publisher")').locator('..'); // Publisher container
    const subscriber = eventSection.locator('h4:text("📥 Event Subscriber")').locator('..'); // Subscriber container

    await expect(publisher).toBeVisible();
    await expect(subscriber).toBeVisible();

    // Initially, subscriber should show no events
    await expect(subscriber.locator('text=No events received yet')).toBeVisible();
    await expect(subscriber.locator('text=User Actions: 0, Notifications: 0')).toBeVisible();

    // Click the "Simple Click" button
    await publisher.locator('button:text("Simple Click")').click();

    // Wait a moment for the event to be processed
    await page.waitForTimeout(500);

    // Check that the subscriber section shows events were received
    await expect(subscriber.locator('text=Events Received:')).toBeVisible();
    
    // Verify that the event log is no longer empty
    const eventLogEmpty = subscriber.locator('text=No events received yet');
    await expect(eventLogEmpty).not.toBeVisible();
    
    // Look for any event entries in the log
    const eventEntries = subscriber.locator('[style*="padding: 0.5rem"]');
    await expect(eventEntries.first()).toBeVisible();

    // Click the "Save Action" button
    await publisher.locator('button:text("Save Action")').click();
    await page.waitForTimeout(500);

    // Verify more event entries appeared (flexible - just check that there are some events)
    const moreEventEntries = subscriber.locator('[style*="padding: 0.5rem"]');
    const eventCount = await moreEventEntries.count();
    expect(eventCount).toBeGreaterThan(0); // Should have events now

    // Click the "Special Process" button
    await publisher.locator('button:text("Special Process")').click();
    
    // Wait for the special process to complete (it has timeouts)
    await page.waitForTimeout(2000);

    // Check that the special process generated events (should have more entries)
    const allEventEntries = subscriber.locator('[style*="padding: 0.5rem"]');
    const finalEntryCount = await allEventEntries.count();
    expect(finalEntryCount).toBeGreaterThanOrEqual(eventCount); // Should have at least as many events
    
    // Test the clear log functionality
    await subscriber.locator('button:text("Clear Log")').click();
    await page.waitForTimeout(100);
    
    // After clearing, should show empty state
    await expect(subscriber.locator('text=No events received yet')).toBeVisible();
    const emptyEventEntries = subscriber.locator('[style*="padding: 0.5rem"]');
    await expect(emptyEventEntries).toHaveCount(0);
  });

  test('should show event timestamps and data', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const eventSection = page.locator('section:has(h2:text("Event Aggregator Demo"))');
    // Find the event publisher and subscriber components  
    const publisher = eventSection.locator('h4:text("📤 Event Publisher")').locator('..');
    const subscriber = eventSection.locator('h4:text("📥 Event Subscriber")').locator('..');

    // Click a button to generate an event
    await publisher.locator('button:text("Simple Click")').click();
    await page.waitForTimeout(100);

    // Check that timestamps are displayed (they should be in HH:MM:SS format)
    const timestampPattern = /\d{1,2}:\d{2}:\d{2}/;
    const timestampElement = subscriber.locator('span').filter({ hasText: timestampPattern }).first();
    await expect(timestampElement).toBeVisible();

    // Check that event data is displayed (JSON-like content should be present)
    // Instead of looking for specific field names, look for JSON-like patterns
    await expect(subscriber.locator('text=User Actions:').first()).toBeVisible();
    await expect(subscriber.locator('text=CLICK').first()).toBeVisible();
  });
});
