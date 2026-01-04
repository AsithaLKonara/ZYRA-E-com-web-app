import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check if the page loads without errors
    await expect(page).toHaveTitle(/NeoShop Ultra/);
    
    // Check for main navigation elements
    await expect(page.locator('nav')).toBeVisible();
    
    // Check for main content area
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display featured products', async ({ page }) => {
    await page.goto('/');
    
    // Wait for featured products to load
    await page.waitForSelector('[data-testid="featured-products"]');
    
    // Check if featured products section is visible
    await expect(page.locator('[data-testid="featured-products"]')).toBeVisible();
    
    // Check if there are product cards
    const productCards = page.locator('[data-testid="product-card"]');
    await expect(productCards).toHaveCountGreaterThan(0);
  });

  test('should navigate to product detail page', async ({ page }) => {
    await page.goto('/');
    
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"]');
    
    // Click on the first product
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    
    // Check if we're on a product detail page
    await expect(page).toHaveURL(/\/products\/[^\/]+$/);
    
    // Check for product details
    await expect(page.locator('[data-testid="product-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-price"]')).toBeVisible();
  });

  test('should search for products', async ({ page }) => {
    await page.goto('/');
    
    // Find search input
    const searchInput = page.locator('[data-testid="search-input"]');
    await expect(searchInput).toBeVisible();
    
    // Type in search query
    await searchInput.fill('test product');
    await searchInput.press('Enter');
    
    // Check if we're on search results page
    await expect(page).toHaveURL(/\/search/);
    
    // Check for search results
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
  });

  test('should display categories', async ({ page }) => {
    await page.goto('/');
    
    // Check for categories section
    const categoriesSection = page.locator('[data-testid="categories-section"]');
    await expect(categoriesSection).toBeVisible();
    
    // Check if there are category cards
    const categoryCards = page.locator('[data-testid="category-card"]');
    await expect(categoryCards).toHaveCountGreaterThan(0);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check if mobile navigation is visible
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    
    // Check if main content is still visible
    await expect(page.locator('main')).toBeVisible();
  });

  test('should handle navigation menu', async ({ page }) => {
    await page.goto('/');
    
    // Check if navigation menu is visible
    const navMenu = page.locator('[data-testid="navigation-menu"]');
    await expect(navMenu).toBeVisible();
    
    // Check for navigation links
    const navLinks = page.locator('[data-testid="nav-link"]');
    await expect(navLinks).toHaveCountGreaterThan(0);
    
    // Test navigation to different pages
    const categoriesLink = page.locator('[data-testid="nav-link"]', { hasText: 'Categories' });
    if (await categoriesLink.isVisible()) {
      await categoriesLink.click();
      await expect(page).toHaveURL(/\/categories/);
    }
  });

  test('should display user authentication options', async ({ page }) => {
    await page.goto('/');
    
    // Check for login/signup buttons
    const authButtons = page.locator('[data-testid="auth-buttons"]');
    await expect(authButtons).toBeVisible();
    
    // Check for login button
    const loginButton = page.locator('[data-testid="login-button"]');
    await expect(loginButton).toBeVisible();
    
    // Check for signup button
    const signupButton = page.locator('[data-testid="signup-button"]');
    await expect(signupButton).toBeVisible();
  });
});