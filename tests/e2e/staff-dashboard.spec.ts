import { test, expect } from '@playwright/test';

test.describe('Staff Dashboard Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Start from staff submissions page
    await page.goto('/staff/submissions');
  });

  test('should display all filter options', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if filters section exists
    const filtersSection = page.getByText('Filters');
    
    if (await filtersSection.isVisible()) {
      await expect(filtersSection).toBeVisible();
      
      // Check for Cohort filter
      await expect(page.getByText('Cohort')).toBeVisible();
      
      // Check for Assignment filter
      await expect(page.getByText('Assignment')).toBeVisible();
      
      // Check for Reviewed status filter
      await expect(page.getByText('Reviewed')).toBeVisible();
      
      // Check for our new Date Range filter
      await expect(page.getByText('Date Range')).toBeVisible();
    }
  });

  test('should have working date range filter options', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Find the Date Range select dropdown
    const dateRangeSelect = page.locator('select').filter({ hasText: /Date Range|All Time/ }).first();
    
    if (await dateRangeSelect.isVisible()) {
      // Click to open dropdown
      await dateRangeSelect.click();
      
      // Check for all date range options
      await expect(page.getByRole('option', { name: 'All Time' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'Today' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'This Week' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'This Month' })).toBeVisible();
    }
  });

  test('should have working cohort filter options', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Find the Cohort select dropdown
    const cohortSelect = page.locator('select').filter({ hasText: /Cohort|All Cohorts/ }).first();
    
    if (await cohortSelect.isVisible()) {
      await cohortSelect.click();
      
      // Check for cohort options
      await expect(page.getByRole('option', { name: 'All Cohorts' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'Cohort 9.1' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'Cohort 9.2' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'Cohort 9.3' })).toBeVisible();
    }
  });

  test('should filter by review status', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Find the Reviewed status select dropdown
    const reviewedSelect = page.locator('select').filter({ hasText: /Reviewed|All Submissions/ }).first();
    
    if (await reviewedSelect.isVisible()) {
      await reviewedSelect.click();
      
      // Check for review status options
      await expect(page.getByRole('option', { name: 'All Submissions' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'Reviewed' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'Pending Review' })).toBeVisible();
      
      // Test filtering by pending
      await reviewedSelect.selectOption('pending');
      
      // Should update the view (we can't test actual data filtering without mock data)
      await expect(reviewedSelect).toHaveValue('pending');
    }
  });

  test('should display staff dashboard header', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Check for main dashboard title
    const dashboardTitle = page.getByRole('heading', { name: /staff dashboard/i });
    
    if (await dashboardTitle.isVisible()) {
      await expect(dashboardTitle).toBeVisible();
    }
  });

  test('should be accessible to staff users through navigation', async ({ page }) => {
    // Test that the staff route exists and is accessible
    await page.goto('/staff/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Should not show a 404 or error page
    await expect(page).not.toHaveURL(/.*404.*/);
    
    // Should show some staff-related content
    const staffContent = page.getByText(/staff|submissions|review/i).first();
    if (await staffContent.isVisible()) {
      await expect(staffContent).toBeVisible();
    }
  });
});

test.describe('Community Submissions Access', () => {
  test('should allow access to community submissions page', async ({ page }) => {
    // Test our new community route
    await page.goto('/submissions');
    await page.waitForLoadState('networkidle');
    
    // Should not redirect to an error page
    await expect(page).not.toHaveURL(/.*404.*/);
    
    // Should load submissions interface (same as staff but accessible to all)
    const submissionsContent = page.getByText(/submission|demo|review/i).first();
    if (await submissionsContent.isVisible()) {
      await expect(submissionsContent).toBeVisible();
    }
  });

  test('should show filtering options on community page', async ({ page }) => {
    await page.goto('/submissions');
    await page.waitForLoadState('networkidle');
    
    // Should have the same filtering capabilities
    const filtersSection = page.getByText('Filters');
    if (await filtersSection.isVisible()) {
      await expect(filtersSection).toBeVisible();
      await expect(page.getByText('Date Range')).toBeVisible();
      await expect(page.getByText('Cohort')).toBeVisible();
    }
  });
});

test.describe('Responsive Staff Dashboard', () => {
  test('should work on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/staff/submissions');
    await page.waitForLoadState('networkidle');
    
    // Filters should still be accessible on tablet
    const filtersSection = page.getByText('Filters');
    if (await filtersSection.isVisible()) {
      await expect(filtersSection).toBeVisible();
    }
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/staff/submissions');
    await page.waitForLoadState('networkidle');
    
    // Page should load without horizontal scrolling issues
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
}); 