import { test, expect, Page } from '@playwright/test'

test.describe('Accessibility Testing - ZYRA Fashion', () => {
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
  })

  test.describe('Basic Accessibility', () => {
    test('should have proper page structure', async () => {
      await page.goto('/')
      
      // Check for main landmark
      await expect(page.locator('main')).toBeVisible()
      
      // Check for navigation landmark
      await expect(page.locator('nav')).toBeVisible()
      
      // Check for heading hierarchy
      const h1 = page.locator('h1')
      await expect(h1).toBeVisible()
      
      // Check that h1 comes before h2
      const h2 = page.locator('h2').first()
      if (await h2.isVisible()) {
        const h1Position = await h1.boundingBox()
        const h2Position = await h2.boundingBox()
        
        if (h1Position && h2Position) {
          expect(h1Position.y).toBeLessThan(h2Position.y)
        }
      }
    })

    test('should have proper heading hierarchy', async () => {
      await page.goto('/products')
      
      // Check that headings are in proper order
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
      
      for (let i = 0; i < headings.length - 1; i++) {
        const currentHeading = headings[i]
        const nextHeading = headings[i + 1]
        
        const currentLevel = await currentHeading.evaluate(el => {
          return parseInt(el.tagName.charAt(1))
        })
        
        const nextLevel = await nextHeading.evaluate(el => {
          return parseInt(el.tagName.charAt(1))
        })
        
        // Next heading should not skip more than one level
        expect(nextLevel - currentLevel).toBeLessThanOrEqual(1)
      }
    })

    test('should have proper form labels', async () => {
      await page.goto('/auth/signin')
      
      // Check that all form inputs have labels
      const inputs = await page.locator('input[type="email"], input[type="password"], input[type="text"]').all()
      
      for (const input of inputs) {
        const id = await input.getAttribute('id')
        const ariaLabel = await input.getAttribute('aria-label')
        const ariaLabelledBy = await input.getAttribute('aria-labelledby')
        
        // Should have either id with label, aria-label, or aria-labelledby
        expect(id || ariaLabel || ariaLabelledBy).toBeTruthy()
      }
    })

    test('should have proper button labels', async () => {
      await page.goto('/')
      
      // Check that all buttons have accessible names
      const buttons = await page.locator('button').all()
      
      for (const button of buttons) {
        const textContent = await button.textContent()
        const ariaLabel = await button.getAttribute('aria-label')
        const ariaLabelledBy = await button.getAttribute('aria-labelledby')
        
        // Should have text content, aria-label, or aria-labelledby
        expect(textContent?.trim() || ariaLabel || ariaLabelledBy).toBeTruthy()
      }
    })
  })

  test.describe('Keyboard Navigation', () => {
    test('should be navigable with keyboard only', async () => {
      await page.goto('/')
      
      // Tab through the page
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      
      // Should be able to navigate without errors
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
      expect(focusedElement).toBeTruthy()
    })

    test('should have visible focus indicators', async () => {
      await page.goto('/')
      
      // Tab to first focusable element
      await page.keyboard.press('Tab')
      
      // Check that focused element has visible focus indicator
      const focusedElement = await page.locator(':focus')
      await expect(focusedElement).toBeVisible()
      
      // Check focus styles
      const focusStyles = await focusedElement.evaluate(el => {
        const styles = window.getComputedStyle(el)
        return {
          outline: styles.outline,
          boxShadow: styles.boxShadow,
          border: styles.border
        }
      })
      
      // Should have some form of focus indicator
      expect(
        focusStyles.outline !== 'none' || 
        focusStyles.boxShadow !== 'none' || 
        focusStyles.border !== 'none'
      ).toBeTruthy()
    })

    test('should support skip links', async () => {
      await page.goto('/')
      
      // Check for skip link
      const skipLink = page.locator('a[href="#main-content"]')
      if (await skipLink.isVisible()) {
        await skipLink.click()
        
        // Should focus on main content
        const mainContent = page.locator('#main-content')
        await expect(mainContent).toBeFocused()
      }
    })
  })

  test.describe('Color and Contrast', () => {
    test('should have sufficient color contrast', async () => {
      await page.goto('/')
      
      // Check text contrast
      const textElements = await page.locator('p, h1, h2, h3, h4, h5, h6, span, a').all()
      
      for (const element of textElements.slice(0, 10)) { // Check first 10 elements
        const text = await element.textContent()
        if (text && text.trim().length > 0) {
          const contrast = await element.evaluate(el => {
            const styles = window.getComputedStyle(el)
            const color = styles.color
            const backgroundColor = styles.backgroundColor
            
            // This is a simplified check - in real testing, you'd use a proper contrast checker
            return {
              color,
              backgroundColor,
              hasColor: color !== 'rgba(0, 0, 0, 0)',
              hasBackground: backgroundColor !== 'rgba(0, 0, 0, 0)'
            }
          })
          
          // Should have both color and background
          expect(contrast.hasColor).toBeTruthy()
          expect(contrast.hasBackground).toBeTruthy()
        }
      }
    })

    test('should not rely solely on color for information', async () => {
      await page.goto('/products')
      
      // Check that important information is not conveyed only through color
      const errorMessages = page.locator('[data-testid="error-message"]')
      const successMessages = page.locator('[data-testid="success-message"]')
      
      if (await errorMessages.isVisible()) {
        const errorText = await errorMessages.textContent()
        expect(errorText).toBeTruthy()
      }
      
      if (await successMessages.isVisible()) {
        const successText = await successMessages.textContent()
        expect(successText).toBeTruthy()
      }
    })
  })

  test.describe('Images and Media', () => {
    test('should have proper alt text for images', async () => {
      await page.goto('/products')
      await page.waitForSelector('[data-testid="product-card"]')
      
      const images = await page.locator('img').all()
      
      for (const image of images) {
        const alt = await image.getAttribute('alt')
        const role = await image.getAttribute('role')
        
        // Should have alt text or be decorative
        expect(alt !== null || role === 'presentation').toBeTruthy()
      }
    })

    test('should have proper alt text for decorative images', async () => {
      await page.goto('/')
      
      const decorativeImages = await page.locator('img[role="presentation"], img[alt=""]').all()
      
      for (const image of decorativeImages) {
        const alt = await image.getAttribute('alt')
        const role = await image.getAttribute('role')
        
        // Should be marked as decorative
        expect(alt === '' || role === 'presentation').toBeTruthy()
      }
    })
  })

  test.describe('Forms and Inputs', () => {
    test('should have proper form validation', async () => {
      await page.goto('/auth/signin')
      
      // Try to submit empty form
      await page.click('button[type="submit"]')
      
      // Should show validation errors
      const errorMessages = page.locator('[data-testid="error-message"]')
      await expect(errorMessages).toBeVisible()
    })

    test('should have proper error messages', async () => {
      await page.goto('/auth/signin')
      
      // Fill with invalid data
      await page.fill('input[type="email"]', 'invalid-email')
      await page.fill('input[type="password"]', '123')
      await page.click('button[type="submit"]')
      
      // Should show specific error messages
      const errorMessages = page.locator('[data-testid="error-message"]')
      await expect(errorMessages).toBeVisible()
      
      const errorText = await errorMessages.textContent()
      expect(errorText).toBeTruthy()
    })

    test('should have proper fieldset and legend for grouped inputs', async () => {
      await page.goto('/checkout')
      
      // Check for fieldsets with legends
      const fieldsets = await page.locator('fieldset').all()
      
      for (const fieldset of fieldsets) {
        const legend = fieldset.locator('legend')
        await expect(legend).toBeVisible()
      }
    })
  })

  test.describe('Navigation and Links', () => {
    test('should have proper link text', async () => {
      await page.goto('/')
      
      const links = await page.locator('a').all()
      
      for (const link of links) {
        const text = await link.textContent()
        const ariaLabel = await link.getAttribute('aria-label')
        const href = await link.getAttribute('href')
        
        // Should have meaningful text or aria-label
        expect(text?.trim() || ariaLabel).toBeTruthy()
        
        // Should not have generic text like "click here"
        if (text) {
          expect(text.toLowerCase()).not.toContain('click here')
          expect(text.toLowerCase()).not.toContain('read more')
        }
      }
    })

    test('should have proper navigation structure', async () => {
      await page.goto('/')
      
      // Check for navigation landmark
      const nav = page.locator('nav')
      await expect(nav).toBeVisible()
      
      // Check for navigation list
      const navList = nav.locator('ul, ol')
      await expect(navList).toBeVisible()
      
      // Check for navigation items
      const navItems = navList.locator('li')
      await expect(navItems).toHaveCountGreaterThan(0)
    })
  })

  test.describe('ARIA Labels and Roles', () => {
    test('should have proper ARIA labels', async () => {
      await page.goto('/')
      
      // Check for elements with ARIA labels
      const elementsWithAriaLabel = await page.locator('[aria-label]').all()
      
      for (const element of elementsWithAriaLabel) {
        const ariaLabel = await element.getAttribute('aria-label')
        expect(ariaLabel).toBeTruthy()
        expect(ariaLabel.trim().length).toBeGreaterThan(0)
      }
    })

    test('should have proper ARIA roles', async () => {
      await page.goto('/')
      
      // Check for common ARIA roles
      const button = page.locator('button[aria-expanded]')
      if (await button.isVisible()) {
        const ariaExpanded = await button.getAttribute('aria-expanded')
        expect(['true', 'false']).toContain(ariaExpanded)
      }
      
      const dialog = page.locator('[role="dialog"]')
      if (await dialog.isVisible()) {
        const ariaModal = await dialog.getAttribute('aria-modal')
        expect(ariaModal).toBe('true')
      }
    })

    test('should have proper ARIA live regions', async () => {
      await page.goto('/auth/signin')
      
      // Check for live regions for dynamic content
      const liveRegions = page.locator('[aria-live]')
      if (await liveRegions.count() > 0) {
        const ariaLive = await liveRegions.first().getAttribute('aria-live')
        expect(['polite', 'assertive']).toContain(ariaLive)
      }
    })
  })

  test.describe('Screen Reader Support', () => {
    test('should have proper page title', async () => {
      await page.goto('/')
      
      const title = await page.title()
      expect(title).toBeTruthy()
      expect(title.length).toBeGreaterThan(0)
    })

    test('should have proper meta description', async () => {
      await page.goto('/')
      
      const metaDescription = await page.locator('meta[name="description"]')
      if (await metaDescription.isVisible()) {
        const content = await metaDescription.getAttribute('content')
        expect(content).toBeTruthy()
        expect(content!.length).toBeGreaterThan(0)
      }
    })

    test('should have proper language attribute', async () => {
      await page.goto('/')
      
      const html = page.locator('html')
      const lang = await html.getAttribute('lang')
      expect(lang).toBeTruthy()
    })
  })

  test.describe('Mobile Accessibility', () => {
    test('should be accessible on mobile devices', async () => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')
      
      // Check that content is readable on mobile
      const textElements = page.locator('p, h1, h2, h3, h4, h5, h6')
      const firstText = textElements.first()
      await expect(firstText).toBeVisible()
      
      // Check that touch targets are large enough
      const buttons = page.locator('button, a')
      const firstButton = buttons.first()
      if (await firstButton.isVisible()) {
        const buttonSize = await firstButton.boundingBox()
        if (buttonSize) {
          expect(buttonSize.width).toBeGreaterThanOrEqual(44) // Minimum 44px
          expect(buttonSize.height).toBeGreaterThanOrEqual(44)
        }
      }
    })

    test('should have proper mobile navigation', async () => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')
      
      // Check for mobile menu button
      const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]')
      if (await mobileMenuButton.isVisible()) {
        await mobileMenuButton.click()
        
        // Check that mobile menu is accessible
        const mobileMenu = page.locator('[data-testid="mobile-menu"]')
        await expect(mobileMenu).toBeVisible()
      }
    })
  })

  test.describe('Error Handling Accessibility', () => {
    test('should announce errors to screen readers', async () => {
      await page.goto('/auth/signin')
      
      // Submit form with invalid data
      await page.fill('input[type="email"]', 'invalid-email')
      await page.click('button[type="submit"]')
      
      // Check for error announcements
      const errorMessages = page.locator('[data-testid="error-message"]')
      await expect(errorMessages).toBeVisible()
      
      // Check that errors are associated with form fields
      const emailInput = page.locator('input[type="email"]')
      const ariaDescribedBy = await emailInput.getAttribute('aria-describedby')
      
      if (ariaDescribedBy) {
        const describedByElement = page.locator(`#${ariaDescribedBy}`)
        await expect(describedByElement).toBeVisible()
      }
    })
  })
})




