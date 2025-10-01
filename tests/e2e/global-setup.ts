import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for the application to be ready
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Check if the application is running
    const title = await page.title();
    if (!title || title === '404' || title === 'Error') {
      throw new Error('Application is not running or has errors');
    }

    console.log('✅ Application is ready for testing');
  } catch (error) {
    console.error('❌ Application setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;


