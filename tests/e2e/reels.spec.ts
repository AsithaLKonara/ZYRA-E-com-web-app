import { test, expect } from '@playwright/test';

test.describe('Reels Page', () => {
  test('should load reels page successfully', async ({ page }) => {
    await page.goto('/reels');
    
    // Check if the page loads without errors
    await expect(page).toHaveTitle(/Reels/);
    
    // Check for reels container
    await expect(page.locator('[data-testid="reels-container"]')).toBeVisible();
  });

  test('should display video player', async ({ page }) => {
    await page.goto('/reels');
    
    // Wait for video player to load
    await page.waitForSelector('[data-testid="video-player"]');
    
    // Check if video player is visible
    await expect(page.locator('[data-testid="video-player"]')).toBeVisible();
    
    // Check for video element
    await expect(page.locator('video')).toBeVisible();
  });

  test('should handle video interactions', async ({ page }) => {
    await page.goto('/reels');
    
    // Wait for video player to load
    await page.waitForSelector('[data-testid="video-player"]');
    
    // Test play/pause functionality
    const playButton = page.locator('[data-testid="play-button"]');
    if (await playButton.isVisible()) {
      await playButton.click();
      
      // Check if video is playing
      const video = page.locator('video');
      await expect(video).toHaveAttribute('data-playing', 'true');
    }
  });

  test('should display action buttons', async ({ page }) => {
    await page.goto('/reels');
    
    // Wait for action buttons to load
    await page.waitForSelector('[data-testid="action-buttons"]');
    
    // Check for like button
    await expect(page.locator('[data-testid="like-button"]')).toBeVisible();
    
    // Check for comment button
    await expect(page.locator('[data-testid="comment-button"]')).toBeVisible();
    
    // Check for share button
    await expect(page.locator('[data-testid="share-button"]')).toBeVisible();
  });

  test('should handle like functionality', async ({ page }) => {
    await page.goto('/reels');
    
    // Wait for like button to load
    await page.waitForSelector('[data-testid="like-button"]');
    
    // Get initial like count
    const likeCount = page.locator('[data-testid="like-count"]');
    const initialCount = await likeCount.textContent();
    
    // Click like button
    await page.locator('[data-testid="like-button"]').click();
    
    // Check if like count increased
    await expect(likeCount).not.toHaveText(initialCount || '0');
  });

  test('should handle swipe navigation', async ({ page }) => {
    await page.goto('/reels');
    
    // Wait for reels to load
    await page.waitForSelector('[data-testid="reels-container"]');
    
    // Get initial reel
    const initialReel = page.locator('[data-testid="current-reel"]');
    await expect(initialReel).toBeVisible();
    
    // Simulate swipe up (next reel)
    await page.locator('[data-testid="reels-container"]').swipe('up');
    
    // Check if we moved to next reel
    await expect(page.locator('[data-testid="current-reel"]')).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await page.goto('/reels');
    
    // Wait for reels to load
    await page.waitForSelector('[data-testid="reels-container"]');
    
    // Test arrow key navigation
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(500);
    
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(500);
    
    // Test spacebar for play/pause
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
  });

  test('should display user information', async ({ page }) => {
    await page.goto('/reels');
    
    // Wait for user info to load
    await page.waitForSelector('[data-testid="user-info"]');
    
    // Check for username
    await expect(page.locator('[data-testid="username"]')).toBeVisible();
    
    // Check for user avatar
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
  });

  test('should display video description', async ({ page }) => {
    await page.goto('/reels');
    
    // Wait for video description to load
    await page.waitForSelector('[data-testid="video-description"]');
    
    // Check if description is visible
    await expect(page.locator('[data-testid="video-description"]')).toBeVisible();
  });

  test('should handle product overlays', async ({ page }) => {
    await page.goto('/reels');
    
    // Wait for product overlays to load
    await page.waitForSelector('[data-testid="product-overlay"]');
    
    // Check if product overlay is visible
    await expect(page.locator('[data-testid="product-overlay"]')).toBeVisible();
    
    // Click on product overlay
    await page.locator('[data-testid="product-overlay"]').click();
    
    // Check if product detail page opens
    await expect(page).toHaveURL(/\/products\/[^\/]+$/);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/reels');
    
    // Check if reels container is still visible
    await expect(page.locator('[data-testid="reels-container"]')).toBeVisible();
    
    // Check if video player is still visible
    await expect(page.locator('[data-testid="video-player"]')).toBeVisible();
  });

  test('should handle fullscreen mode', async ({ page }) => {
    await page.goto('/reels');
    
    // Wait for video player to load
    await page.waitForSelector('[data-testid="video-player"]');
    
    // Check for fullscreen button
    const fullscreenButton = page.locator('[data-testid="fullscreen-button"]');
    if (await fullscreenButton.isVisible()) {
      await fullscreenButton.click();
      
      // Check if video is in fullscreen mode
      await expect(page.locator('[data-testid="video-player"]')).toHaveClass(/fullscreen/);
    }
  });
});


