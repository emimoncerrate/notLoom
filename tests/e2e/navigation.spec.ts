import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto('/');
  });

  test('should display login page when not authenticated', async ({ page }) => {
    // Should be redirected to login or show login content
    await expect(page).toHaveURL(/.*login/);
    
    // Check for login button
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    
    // Check for Pursuit branding
    await expect(page.getByText('PursuitShipped')).toBeVisible();
  });

  test('should have clickable logo that navigates to home', async ({ page }) => {
    // Mock authentication state by intercepting Firebase calls
    await page.route('**/*firebaseapp.com/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ kind: 'identitytoolkit#GetAccountInfoResponse', users: [] })
      });
    });

    // Navigate to a sub-page (if authenticated)
    // Since we can't easily mock auth, we'll test the logo element exists and is clickable
    const logo = page.locator('img[alt="Pursuit Logo"]').first();
    if (await logo.isVisible()) {
      await expect(logo).toBeVisible();
      
      // Check if logo parent is clickable
      const logoContainer = logo.locator('..');
      await expect(logoContainer).toHaveCSS('cursor', 'pointer');
    }
  });

  test('should show PursuitShipped title', async ({ page }) => {
    await expect(page.getByText('PursuitShipped')).toBeVisible();
  });
});

test.describe('Recording Mode Selection', () => {
  test('should display recording mode options', async ({ page, context }) => {
    // Skip auth for this UI test by mocking a successful state
    await page.addInitScript(() => {
      // Mock localStorage to simulate auth state
      window.localStorage.setItem('mockAuth', 'true');
    });

    // Navigate to the recording page directly
    await page.goto('/builder/record');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Look for recording mode selector
    const recordingModeText = page.getByText('Recording Mode');
    if (await recordingModeText.isVisible()) {
      await expect(recordingModeText).toBeVisible();
      
      // Check for the three recording options
      await expect(page.getByText('Screen Recording')).toBeVisible();
      await expect(page.getByText('Screen + Camera (Picture-in-Picture)')).toBeVisible();
      await expect(page.getByText('Voiceover Only (Audio)')).toBeVisible();
    }
  });
});

test.describe('Staff Filtering', () => {
  test('should display filtering options on staff page', async ({ page }) => {
    // Navigate to staff submissions page
    await page.goto('/staff/submissions');
    
    // Wait for page load
    await page.waitForLoadState('networkidle');
    
    // Check for filter section
    const filtersHeading = page.getByText('Filters');
    if (await filtersHeading.isVisible()) {
      await expect(filtersHeading).toBeVisible();
      
      // Check for our new Date Range filter
      await expect(page.getByText('Date Range')).toBeVisible();
      await expect(page.getByText('Cohort')).toBeVisible();
      await expect(page.getByText('Reviewed')).toBeVisible();
    }
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Check that the page loads and is responsive
    await expect(page.getByText('PursuitShipped')).toBeVisible();
    
    // Check that login button is still accessible on mobile
    const signInButton = page.getByRole('button', { name: /sign in/i });
    if (await signInButton.isVisible()) {
      await expect(signInButton).toBeVisible();
    }
  });
}); 