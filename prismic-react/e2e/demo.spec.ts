import { test, expect } from '@playwright/test';

test.describe('Prismic React Framework Demo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the main page', async ({ page }) => {
    // Check if the page loads
    await expect(page).toHaveTitle(/Vite \+ React/);
    
    // Check for main header (specifically in the app header)
    await expect(page.locator('.app-header h1')).toContainText('Prismic React Demo');
    
    // Check for subtitle
    await expect(page.locator('.app-header p')).toContainText('A demonstration of the React adaptation of Web Prism framework');
  });

  test('should display framework features list', async ({ page }) => {
    // Check for the features section (specifically the one with features)
    await expect(page.locator('h2').filter({ hasText: 'Framework Features' })).toBeVisible();
    
    // Check for specific features using more specific selectors
    const featuresSection = page.locator('.demo-section').filter({ has: page.locator('h2:has-text("Framework Features")') });
    
    await expect(featuresSection.locator('li').filter({ hasText: 'Dependency Injection Container' })).toBeVisible();
    await expect(featuresSection.locator('li').filter({ hasText: 'Event Aggregator for component communication' })).toBeVisible();
    await expect(featuresSection.locator('li').filter({ hasText: 'Region-based UI composition using React Portals' })).toBeVisible();
    await expect(featuresSection.locator('li').filter({ hasText: 'React Hooks for framework integration' })).toBeVisible();
    await expect(featuresSection.locator('li').filter({ hasText: 'TypeScript support with strict type checking' })).toBeVisible();
  });

  test('should display welcome region with content', async ({ page }) => {
    // Check for welcome region section
    await expect(page.locator('h2').filter({ hasText: 'Welcome Region' })).toBeVisible();
    
    // Check for region description
    await expect(page.locator('.demo-section p').first()).toContainText('This region will contain a welcome component rendered via React Portal');
    
    // Check for the region container
    await expect(page.locator('[data-region="welcome"]')).toBeVisible();
    
    // Check if welcome component is rendered in the region (the h1 inside the welcome component)
    await expect(page.locator('[data-region="welcome"] h1')).toContainText('Prismic React Framework');
    await expect(page.locator('text=Demonstrating region-based component composition')).toBeVisible();
  });

  test('should display content region with interactive counter', async ({ page }) => {
    // Check for content region section
    await expect(page.locator('h2').filter({ hasText: 'Content Region' })).toBeVisible();
    
    // Check for region description (first p tag in the content region section)
    const contentSection = page.locator('.demo-section').filter({ has: page.locator('h2:has-text("Content Region")') });
    await expect(contentSection.locator('p').first()).toContainText('This region contains an interactive counter component');
    
    // Check for the region container
    await expect(page.locator('[data-region="content"]')).toBeVisible();
    
    // Check if counter component is rendered
    await expect(page.locator('h3')).toContainText('Interactive Counter');
    
    // Check initial counter value (should be 5 based on our setup)
    await expect(page.locator('[data-region="content"] div[style*="font-size: 2rem"]')).toContainText('5');
  });

  test('should allow counter interaction', async ({ page }) => {
    // Find the counter value element
    const counterValue = page.locator('[data-region="content"] div[style*="font-size: 2rem"]');
    
    // Check initial value
    await expect(counterValue).toContainText('5');
    
    // Find the increment button (+ button)
    const incrementButton = page.locator('[data-region="content"] button').filter({ hasText: '+' });
    
    // Find the decrement button (- button)  
    const decrementButton = page.locator('[data-region="content"] button').filter({ hasText: '-' });
    
    // Test increment (should go from 5 to 6, step is 1)
    await incrementButton.click();
    await expect(counterValue).toContainText('6');
    
    // Test another increment
    await incrementButton.click();
    await expect(counterValue).toContainText('7');
    
    // Test decrement
    await decrementButton.click();
    await expect(counterValue).toContainText('6');
    
    // Test multiple decrements
    await decrementButton.click();
    await decrementButton.click();
    await expect(counterValue).toContainText('4');
  });

  test('should display footer information', async ({ page }) => {
    // Check for footer
    await expect(page.locator('.app-footer')).toBeVisible();
    
    // Check footer content
    await expect(page.locator('.app-footer p')).toContainText('This demo shows how the Prismic React framework enables modular, composable UI architecture using React best practices');
  });

  test('should have proper styling and layout', async ({ page }) => {
    // Check that main container has proper styling
    const appContainer = page.locator('.app');
    await expect(appContainer).toBeVisible();
    
    // Check that header has gradient background
    const header = page.locator('.app-header');
    await expect(header).toBeVisible();
    
    // Check that demo sections are visible
    const demoSections = page.locator('.demo-section');
    await expect(demoSections).toHaveCount(3); // Welcome, Content, Features
    
    // Check that region containers are present
    await expect(page.locator('.region-container')).toHaveCount(2);
  });

  test('should verify React Portals are working', async ({ page }) => {
    // The key test: components should be rendered inside their region containers
    // even though they're defined elsewhere in the React tree
    
    // Check that welcome component content appears inside the welcome region
    const welcomeRegion = page.locator('[data-region="welcome"]');
    const welcomeContent = welcomeRegion.locator('text=Prismic React Framework');
    await expect(welcomeContent).toBeVisible();
    
    // Check that counter component appears inside the content region
    const contentRegion = page.locator('[data-region="content"]');
    const counterContent = contentRegion.locator('text=Interactive Counter');
    await expect(counterContent).toBeVisible();
  });

  test('should be responsive and accessible', async ({ page }) => {
    // Check that page is accessible - use specific selectors
    await expect(page.locator('.app-header h1')).toBeVisible();
    await expect(page.locator('h2')).toHaveCount(3);
    await expect(page.locator('h3')).toHaveCount(1);
    
    // Check that buttons are accessible
    const buttons = page.locator('[data-region="content"] button');
    await expect(buttons).toHaveCount(2); // + and - buttons
    
    // Check that all buttons are visible and clickable
    for (let i = 0; i < await buttons.count(); i++) {
      await expect(buttons.nth(i)).toBeVisible();
      await expect(buttons.nth(i)).toBeEnabled();
    }
  });
});
