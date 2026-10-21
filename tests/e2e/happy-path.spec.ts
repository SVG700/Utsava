import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Returns a future YYYY-MM-DD date string relative to current execution date.
 */
function getFutureDate(daysAhead = 90): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

test.describe('Utsava Celebration Planner End-to-End', () => {
  const futureEventDate = getFutureDate(90);

  const sampleBlueprintResponse = {
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
          budgetCategory: 'Venue & Mandap',
        },
        {
          category: 'Catering & Feasts',
          description: 'Halwai & royal catering service',
          estimatedBudgetPercentage: 40,
          tips: ['Ensure pure ghee sweets tasting'],
          budgetCategory: 'Catering & Feasts',
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
  };

  test('create event -> generate plan (mocked) -> add expense -> complete task -> refresh -> data persists', async ({
    page,
  }) => {
    // 1. Mock Gemini API route hermetically
    await page.route('**/api/generate-blueprint', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(sampleBlueprintResponse),
      });
    });

    // 2. Visit homepage and verify empty state / title
    await page.goto('/');
    await expect(page).toHaveTitle(/Utsava/);

    // 3. Navigate to Event Creation Wizard
    await page.click('text=Plan a New Celebration');
    await expect(page).toHaveURL(/\/new/);

    // 4. Fill in Wizard Form with dynamically computed relative future date
    await page.fill('input[id="event-name"]', 'Ananya & Rohan Royal Wedding');
    await page.fill('input[type="date"]', futureEventDate);
    await page.fill('input[id="city-/-location"]', 'Jaipur');
    await page.fill('input[id="total-budget-(inr-₹)"]', '2000000');

    // Step 1 -> Step 2
    await page.click('text=Next: Format & Traditions');
    await expect(page.locator('text=Indian Wedding Sub-Events')).toBeVisible();

    // Step 2 -> Step 3
    await page.click('text=Next: Preferences & Review');
    await expect(page.locator('text=Dietary Preferences')).toBeVisible();

    // Submit
    await page.click('button:has-text("Save & Generate Plan")');

    // 5. Verify redirection to Event Planner page
    await expect(page).toHaveURL(/\/events\//);
    await expect(page.locator('text=Ananya & Rohan Royal Wedding')).toBeVisible();

    // 6. Verify Blueprint content appears
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

    // Verify Expense is recorded
    await expect(page.locator('text=Palace Booking Deposit')).toBeVisible();
    await expect(page.locator('text=₹1,50,000').first()).toBeVisible();

    // 8. Test Smart Timeline: Toggle task complete
    await page.click('text=Smart Timeline');
    await expect(page.locator('text=Finalize Palace Banquet Booking')).toBeVisible();

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

  test('mobile responsive view and AI plan refinement with record shape ({ category: percentage })', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.route('**/api/generate-blueprint', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(sampleBlueprintResponse),
      });
    });

    // Mock refine-plan returning record shape for budgetAllocation
    await page.route('**/api/refine-plan', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          refinement: {
            refinementSummary: 'Updated decor to 100% eco-friendly and adjusted category proportions.',
            themeAndDecor: {
              mainTheme: 'Eco-Chic Royal Palace',
              decorIdeas: ['Clay diyas and banana trunks'],
            },
            // Record shape returned by AI
            budgetAllocation: {
              'Venue & Mandap': 35,
              'Catering & Feasts': 45,
              'Decor & Ambience': 20,
            },
          },
        }),
      });
    });

    await page.goto('/');
    await expect(page.locator('h1:has-text("Utsava")')).toBeVisible();
    await page.click('text=Plan a New Celebration');

    await page.fill('input[id="event-name"]', 'Mobile Test Celebration');
    await page.fill('input[type="date"]', getFutureDate(60));
    await page.fill('input[id="city-/-location"]', 'Bengaluru');
    await page.click('text=Next: Format & Traditions');
    await page.click('text=Next: Preferences & Review');
    await page.click('button:has-text("Save & Generate Plan")');

    await expect(page.locator('text=Mobile Test Celebration')).toBeVisible();

    // Navigate to AI Refine tab
    await page.click('text=AI Refine');
    await expect(page.locator('text=AI Plan Refinement')).toBeVisible();

    // Test refinement using suggestion chip
    await page.click('button:has-text("Make decor 100% eco-friendly")');

    // Verify refinement response summary rendered
    await expect(page.locator('text=Updated decor to 100% eco-friendly').first()).toBeVisible();

    // Verify record-shape budget was transformed and rendered in Budget Manager
    await page.click('text=Budget Manager');
    await expect(page.locator('text=Category Allocations')).toBeVisible();
    await expect(page.locator('h4:has-text("Venue & Mandap")')).toBeVisible();
    await expect(page.locator('h4:has-text("Catering & Feasts")')).toBeVisible();
  });

  test('regenerate blueprint confirm dialog and preservation of tasks/vendors', async ({
    page,
  }) => {
    let callCount = 0;
    await page.route('**/api/generate-blueprint', async (route) => {
      callCount++;
      if (callCount === 1) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(sampleBlueprintResponse),
        });
      } else {
        // Regenerated blueprint with slightly updated descriptions
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...sampleBlueprintResponse,
            blueprint: {
              ...sampleBlueprintResponse.blueprint,
              themeAndDecor: {
                ...sampleBlueprintResponse.blueprint.themeAndDecor,
                mainTheme: 'Regenerated Royal Marwar Palace',
              },
              timeline: [
                {
                  title: 'Finalize Palace Banquet Booking',
                  description: 'Updated AI timeline task notes',
                  daysBeforeEvent: 90,
                  priority: 'high',
                  category: 'Venue & Mandap',
                },
                {
                  title: 'Hire Folk Sangeet Troupe',
                  description: 'Live Manganiyar musical group',
                  daysBeforeEvent: 30,
                  priority: 'medium',
                  category: 'Activities',
                },
              ],
            },
          }),
        });
      }
    });

    await page.goto('/new');
    await page.fill('input[id="event-name"]', 'Regeneration Test Event');
    await page.fill('input[type="date"]', getFutureDate(100));
    await page.fill('input[id="city-/-location"]', 'Udaipur');
    await page.fill('input[id="total-budget-(inr-₹)"]', '1500000');
    await page.click('text=Next: Format & Traditions');
    await page.click('text=Next: Preferences & Review');
    await page.click('button:has-text("Save & Generate Plan")');

    await expect(page.locator('text=Regeneration Test Event')).toBeVisible();

    // 1. Mark task complete in Smart Timeline
    await page.click('text=Smart Timeline');
    await expect(page.locator('text=Finalize Palace Banquet Booking')).toBeVisible();
    const taskCheckbox = page.locator('button[aria-label="Mark complete"]').first();
    await taskCheckbox.click();
    await expect(page.locator('button[aria-label="Mark incomplete"]')).toBeVisible();

    // 2. Add custom user task
    await page.click('button:has-text("Add Task")');
    await page.fill('input[id="task-title"]', 'User Added Silver Coins Gift');
    await page.fill('input[id="days-before-event"]', '20');
    await page.locator('div[role="dialog"] button:has-text("Add Task")').click();
    await expect(page.locator('text=User Added Silver Coins Gift')).toBeVisible();

    // 3. Click Regenerate Blueprint in header
    const regenBtn = page.locator('button:has-text("Regenerate Blueprint")');
    await regenBtn.click();

    // 4. Confirm dialog must be visible
    const confirmModal = page.locator('div[role="dialog"]:has-text("Regenerate Celebration Plan?")');
    await expect(confirmModal).toBeVisible();

    // Click Confirm button inside modal
    await confirmModal.locator('button:has-text("Yes, Regenerate")').click();

    // Switch to Overview tab to verify new blueprint theme
    await page.click('button[role="tab"]:has-text("Overview")');
    await expect(page.locator('text=Regenerated Royal Marwar Palace')).toBeVisible();

    // 5. Verify task preservation in Smart Timeline
    await page.click('button[role="tab"]:has-text("Smart Timeline")');

    // A) Completed status preserved for original task
    await expect(page.locator('button[aria-label="Mark incomplete"]')).toBeVisible();

    // B) Custom user-added task preserved intact
    await expect(page.locator('text=User Added Silver Coins Gift')).toBeVisible();

    // C) New AI task merged in
    await expect(page.locator('text=Hire Folk Sangeet Troupe')).toBeVisible();
  });

  test('keyboard-only wizard navigation and event creation', async ({ page }) => {
    await page.route('**/api/generate-blueprint', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(sampleBlueprintResponse),
      });
    });

    await page.goto('/new');

    // Fill form fields
    await page.fill('input[id="event-name"]', 'Keyboard Accessible Wedding');
    await page.fill('input[type="date"]', getFutureDate(75));
    await page.fill('input[id="city-/-location"]', 'Varanasi');
    await page.fill('input[id="guest-count"]', '200');
    await page.fill('input[id="total-budget-(inr-₹)"]', '1200000');

    // Focus Next button with keyboard and press Enter
    await page.locator('button:has-text("Next: Format & Traditions")').focus();
    await page.keyboard.press('Enter');

    // Step 2 reached
    await expect(page.locator('text=Next: Preferences & Review')).toBeVisible();
    await page.locator('button:has-text("Next: Preferences & Review")').focus();
    await page.keyboard.press('Enter');

    // Step 3 reached
    await expect(page.locator('button:has-text("Save & Generate Plan")')).toBeVisible();
    await page.locator('button:has-text("Save & Generate Plan")').focus();
    await page.keyboard.press('Enter');

    // Successfully navigated to event planner page
    await expect(page).toHaveURL(/\/events\//);
    await expect(page.locator('text=Keyboard Accessible Wedding')).toBeVisible();
  });

  test('360px small mobile viewport test with zero horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });

    await page.route('**/api/generate-blueprint', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(sampleBlueprintResponse),
      });
    });

    // 1. Home page at 360px
    await page.goto('/');
    const homeNoOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    );
    expect(homeNoOverflow).toBe(true);

    // 2. Wizard at 360px
    await page.goto('/new');
    const wizardNoOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    );
    expect(wizardNoOverflow).toBe(true);

    // Complete wizard to test planner page at 360px
    await page.fill('input[id="event-name"]', 'Viewport 360 Test');
    await page.fill('input[type="date"]', getFutureDate(50));
    await page.fill('input[id="city-/-location"]', 'Pune');
    await page.click('text=Next: Format & Traditions');
    await page.click('text=Next: Preferences & Review');
    await page.click('button:has-text("Save & Generate Plan")');

    await expect(page).toHaveURL(/\/events\//);
    const plannerNoOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    );
    expect(plannerNoOverflow).toBe(true);
  });

  test('accessibility audit via @axe-core/playwright (zero critical/serious violations across light and dark modes)', async ({
    page,
  }) => {
    await page.route('**/api/generate-blueprint', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(sampleBlueprintResponse),
      });
    });

    // Function to run axe scan and assert 0 critical or serious violations
    const checkA11y = async (contextName: string) => {
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      const severeViolations = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      if (severeViolations.length > 0) {
        console.error(
          `Accessibility violations in ${contextName}:`,
          JSON.stringify(
            severeViolations.map((v) => ({
              id: v.id,
              impact: v.impact,
              description: v.description,
              nodes: v.nodes.map((n) => n.html),
            })),
            null,
            2
          )
        );
      }
      expect(severeViolations).toEqual([]);
    };

    // 1. Home page in light mode
    await page.goto('/');
    await checkA11y('Home page (light)');

    // Home page in dark mode using UI theme toggle button
    const darkBtnHome = page.locator('button[aria-label="Switch to dark mode"]');
    if (await darkBtnHome.isVisible()) {
      await darkBtnHome.click();
      await expect(page.locator('html')).toHaveClass(/dark/);
      await page.waitForTimeout(300);
      await checkA11y('Home page (dark)');
      await page.click('button[aria-label="Switch to light mode"]');
      await page.waitForTimeout(300);
    }

    // 2. Wizard (/new) in light and dark mode
    await page.goto('/new');
    await checkA11y('Wizard page (light)');

    const darkBtnWizard = page.locator('button[aria-label="Switch to dark mode"]');
    if (await darkBtnWizard.isVisible()) {
      await darkBtnWizard.click();
      await expect(page.locator('html')).toHaveClass(/dark/);
      await page.waitForTimeout(300);
      await checkA11y('Wizard page (dark)');
      await page.click('button[aria-label="Switch to light mode"]');
      await page.waitForTimeout(300);
    }

    // 3. Planner (/events/[id]) in light and dark mode
    await page.fill('input[id="event-name"]', 'A11y Audit Wedding');
    await page.fill('input[type="date"]', getFutureDate(40));
    await page.fill('input[id="city-/-location"]', 'Kochi');
    await page.click('text=Next: Format & Traditions');
    await page.click('text=Next: Preferences & Review');
    await page.click('button:has-text("Save & Generate Plan")');

    await expect(page).toHaveURL(/\/events\//);
    await checkA11y('Planner page (light)');

    const darkBtnPlanner = page.locator('button[aria-label="Switch to dark mode"]');
    if (await darkBtnPlanner.isVisible()) {
      await darkBtnPlanner.click();
      await expect(page.locator('html')).toHaveClass(/dark/);
      await page.waitForTimeout(300);
      await checkA11y('Planner page (dark)');
    }
    await checkA11y('Planner page (dark)');
  });
});
