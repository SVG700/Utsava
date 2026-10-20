import { test, expect } from '@playwright/test';

test.describe('Utsava Celebration Planner End-to-End', () => {
  test('create event -> generate plan (mocked) -> add expense -> complete task -> refresh -> data persists', async ({
    page,
  }) => {
    // 1. Mock Gemini API route so test runs hermetically without external API calls
    await page.route('**/api/generate-blueprint', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          model: 'gemini-3.5-flash',
          blueprint: {
            themeAndDecor: {
              mainTheme: 'Royal Marwar Palace',
              colorPalette: ['#f59e0b', '#dc2626', '#78350f'],
              decorIdeas: ['Marigold floral canopy', 'Brass urlis with floating diyas'],
              description: 'Authentic royal Rajasthani palace ambience with warm festive lighting.',
            },
            activities: [
              {
                name: 'Grand Dhol Procession',
                description: 'Traditional welcoming ceremony with live dhol players.',
                estimatedDuration: '45 mins',
                suitableFor: 'All guests',
              },
            ],
            budgetAllocation: [
              { category: 'Venue & Mandap', percentage: 40, description: 'Palace heritage grounds' },
              { category: 'Catering & Feasts', percentage: 40, description: 'Authentic Marwari feast' },
              { category: 'Decor & Ambience', percentage: 20, description: 'Floral and lighting setup' },
            ],
            timeline: [
              {
                title: 'Finalize Palace Banquet Booking',
                description: 'Sign contract and pay advance token.',
                daysBeforeEvent: 90,
                priority: 'high',
                category: 'Venue & Mandap',
              },
              {
                title: 'Sample Food Tasting Session',
                description: 'Review mithai & chaat varieties with master halwai.',
                daysBeforeEvent: 45,
                priority: 'medium',
                category: 'Catering & Feasts',
              },
            ],
            vendorCategories: [
              {
                category: 'Venue & Mandap',
                description: 'Banquet & mandap manager',
                estimatedBudgetPercentage: 40,
                tips: ['Check curfew timings for music and fireworks'],
              },
            ],
            risksAndAssumptions: ['Heat during afternoon pheras; provide covered shade.'],
            missingInfo: ['Guest flight arrival schedule'],
            alternatives: [
              {
                original: 'Imported roses',
                budgetFriendly: 'Local marigold garlands (Genda phool)',
                sustainable: 'Potted plants that guests can take home',
                accessible: 'Low floral arrangements keeping pathways barrier-free',
              },
            ],
          },
        }),
      });
    });

    // 2. Visit homepage and verify empty state / title
    await page.goto('/');
    await expect(page).toHaveTitle(/Utsava/);

    // 3. Navigate to Event Creation Wizard
    await page.click('text=Plan a New Celebration');
    await expect(page).toHaveURL(/\/new/);

    // 4. Fill in Wizard Form
    // Step 1: Basics & Budget
    await page.fill('input[id="event-name"]', 'Ananya & Rohan Royal Wedding');
    await page.fill('input[type="date"]', '2026-12-15');
    await page.fill('input[id="city-/-location"]', 'Jaipur');
    await page.fill('input[id="total-budget-(inr-₹)"]', '2000000');

    // Click Next
    await page.click('text=Next: Format & Traditions');

    // Step 2: Indian Format & Sub-Events
    await expect(page.locator('text=Indian Wedding Sub-Events')).toBeVisible();
    await page.click('text=Next: Preferences & Review');

    // Step 3: Review & Submit
    await expect(page.locator('text=Dietary Preferences')).toBeVisible();
    await page.click('button:has-text("Save & Generate Plan")');

    // 5. Verify redirection to Event Planner page
    await expect(page).toHaveURL(/\/events\//);
    await expect(page.locator('text=Ananya & Rohan Royal Wedding')).toBeVisible();

    // 6. Verify Blueprint content appears (mocked Gemini response)
    await expect(page.locator('text=Royal Marwar Palace')).toBeVisible();
    await expect(page.locator('text=Budget Utilisation')).toBeVisible();

    // 7. Test Budget Manager: Add an Expense
    await page.click('text=Budget Manager');
    await expect(page.locator('text=Category Allocations')).toBeVisible();

    // Click Record Expense
    await page.click('button:has-text("Record Expense")');
    await page.fill('input[id="description"]', 'Palace Booking Deposit');
    await page.fill('input[id="amount-(inr-₹)"]', '150000');
    await page.locator('div[role="dialog"] button:has-text("Add Expense")').click();

    // Verify Expense is recorded in table and total updates
    await expect(page.locator('text=Palace Booking Deposit')).toBeVisible();
    await expect(page.locator('text=₹1,50,000').first()).toBeVisible();

    // 8. Test Smart Timeline: Toggle task complete
    await page.click('text=Smart Timeline');
    await expect(page.locator('text=Finalize Palace Banquet Booking')).toBeVisible();

    // Toggle completion checkbox
    const taskCheckbox = page.locator('button[aria-label="Mark complete"]').first();
    await taskCheckbox.click();
    await expect(page.locator('button[aria-label="Mark incomplete"]')).toBeVisible();

    // 9. Reload Page and verify data persistence in localStorage
    await page.reload();

    // Verify event title still present
    await expect(page.locator('text=Ananya & Rohan Royal Wedding')).toBeVisible();

    // Go to Budget Tab -> verify expense persisted
    await page.click('text=Budget Manager');
    await expect(page.locator('text=Palace Booking Deposit')).toBeVisible();

    // Go to Timeline Tab -> verify task completion state persisted
    await page.click('text=Smart Timeline');
    await expect(page.locator('button[aria-label="Mark incomplete"]')).toBeVisible();
  });

  test('mobile responsive view and AI plan refinement interaction', async ({ page }) => {
    // 1. Mobile viewport (iPhone 13 dimensions)
    await page.setViewportSize({ width: 390, height: 844 });

    // Mock API routes
    await page.route('**/api/generate-blueprint', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          model: 'gemini-3.5-flash',
          blueprint: {
            themeAndDecor: {
              mainTheme: 'Royal Marwar Palace',
              colorPalette: ['#f59e0b', '#dc2626'],
              decorIdeas: ['Brass urlis with floating diyas'],
              description: 'Authentic palace ambience.',
            },
            activities: [],
            budgetAllocation: [
              { category: 'Venue', percentage: 50, description: 'Venue' },
              { category: 'Catering', percentage: 50, description: 'Catering' },
            ],
            timeline: [
              { title: 'Book Venue', description: 'Deposit', daysBeforeEvent: 60, priority: 'high', category: 'Venue' },
            ],
            vendorCategories: [],
            risksAndAssumptions: [],
            missingInfo: [],
            alternatives: [],
          },
        }),
      });
    });

    await page.route('**/api/refine-plan', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          refinement: {
            refinementSummary: 'Updated decor to 100% eco-friendly with clay diyas and reduced venue budget.',
            themeAndDecor: {
              mainTheme: 'Eco-Chic Royal Palace',
              decorIdeas: ['Clay diyas and banana trunks'],
            },
            budgetAllocation: [
              { category: 'Venue', percentage: 40, description: 'Reduced venue' },
              { category: 'Catering', percentage: 60, description: 'Expanded catering' },
            ],
          },
        }),
      });
    });

    // 2. Visit home on mobile
    await page.goto('/');
    await expect(page.locator('h1:has-text("Utsava")')).toBeVisible();
    await page.click('text=Plan a New Celebration');

    // 3. Complete wizard on mobile
    await page.fill('input[id="event-name"]', 'Mobile Test Celebration');
    await page.fill('input[type="date"]', '2026-11-20');
    await page.fill('input[id="city-/-location"]', 'Bengaluru');
    await page.click('text=Next: Format & Traditions');
    await page.click('text=Next: Preferences & Review');
    await page.click('button:has-text("Save & Generate Plan")');

    // 4. Verify planner loads on mobile
    await expect(page.locator('text=Mobile Test Celebration')).toBeVisible();

    // 5. Navigate to AI Refine tab
    await page.click('text=AI Refine');
    await expect(page.locator('text=AI Plan Refinement')).toBeVisible();

    // 6. Test refinement using quick suggestion chip
    await page.click('button:has-text("Make decor 100% eco-friendly")');

    // 7. Verify refinement response summary rendered
    await expect(page.locator('text=Updated decor to 100% eco-friendly with clay diyas')).toBeVisible();
  });
});
