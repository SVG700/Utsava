/**
 * Utsava Strict Live Smoke Test Script
 * Calls the running application's real API endpoints against Gemini.
 * Uses ONLY server-side GEMINI_API_KEY from .env.local (no x-gemini-key header).
 * Exits with:
 *   0 if ALL assertions hold
 *   1 if any functional assertion fails
 *   2 if both models hit 429 quota exhaustion
 */

const BASE_URL = process.env.UTSAVA_URL || 'http://localhost:3000';

const defaultHeaders = {
  'Content-Type': 'application/json',
};

function deepDiffers(a, b) {
  return JSON.stringify(a) !== JSON.stringify(b);
}

function findCategoryPct(allocation, regex) {
  if (!allocation) return null;
  const list = Array.isArray(allocation)
    ? allocation
    : Object.entries(allocation).map(([category, percentage]) => ({
        category,
        percentage,
      }));
  const match = list.find((item) => regex.test(item.category));
  return match ? Number(match.percentage) : null;
}

async function callEndpoint(label, endpoint, payload) {
  const start = performance.now();
  let res;
  try {
    res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify(payload),
    });
  } catch (err) {
    const timing = ((performance.now() - start) / 1000).toFixed(2);
    console.error(`[${label}] Status: Connection Error | Timing: ${timing}s | Message: ${err.message}`);
    process.exit(1);
  }

  const timing = ((performance.now() - start) / 1000).toFixed(2);
  const json = await res.json().catch(() => null);

  if (
    res.status === 429 ||
    json?.error === 'RATE_LIMIT' ||
    (json?.message && /quota/i.test(json.message))
  ) {
    console.log(`[${label}] Status: 429 | Timing: ${timing}s`);
    console.log('QUOTA EXHAUSTED — not verified');
    process.exit(2);
  }

  let sectionNames = [];
  if (json?.blueprint) {
    sectionNames = Object.keys(json.blueprint);
  } else if (json?.refinement) {
    sectionNames = Object.keys(json.refinement);
  } else if (json?.ideas) {
    sectionNames = Object.keys(json.ideas);
  } else if (json) {
    sectionNames = Object.keys(json);
  }

  console.log(`[${label}] Status: ${res.status} | Timing: ${timing}s | Section names: ${sectionNames.join(', ')}`);

  return { status: res.status, ok: res.ok, json, timing };
}

async function run() {
  console.log('=== Utsava Strict Live Smoke Test ===');
  console.log(`Target: ${BASE_URL}`);

  const eventDetails = {
    eventType: 'birthday',
    name: 'Aarav 30th Milestone Celebration',
    date: '2026-12-25',
    city: 'Bengaluru',
    guestCount: 45,
    totalBudget: 150000,
    theme: 'Outdoor Garden Soiree',
    dietaryPreferences: ['vegetarian'],
    culturalPreferences: 'South Indian modern fusion',
    accessibilityNeeds: 'Wheelchair accessible venue',
    specialRequirements: 'Live acoustic music',
    subEvents: [],
  };

  // 1. Generate Blueprint
  const bpRes = await callEndpoint(
    '1. POST /api/generate-blueprint',
    '/api/generate-blueprint',
    eventDetails
  );

  if (bpRes.status !== 200 || !bpRes.json?.blueprint) {
    console.error('Assertion failed: Blueprint did not return 200 or missing blueprint object');
    process.exit(1);
  }

  const bp = bpRes.json.blueprint;

  // Check all 8 sections non-empty
  const requiredSections = [
    'themeAndDecor',
    'activities',
    'budgetAllocation',
    'timeline',
    'vendorCategories',
    'risksAndAssumptions',
    'missingInfo',
    'alternatives',
  ];

  for (const sec of requiredSections) {
    const val = bp[sec];
    if (!val) {
      console.error(`Assertion failed: Blueprint section "${sec}" is missing or falsy`);
      process.exit(1);
    }
    if (Array.isArray(val) && val.length === 0) {
      console.error(`Assertion failed: Blueprint array section "${sec}" is empty`);
      process.exit(1);
    }
    if (typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length === 0) {
      console.error(`Assertion failed: Blueprint object section "${sec}" is empty`);
      process.exit(1);
    }
  }

  // Check every timeline task daysBeforeEvent <= days remaining
  const today = new Date();
  const eventDate = new Date(eventDetails.date);
  const daysRemaining = Math.max(0, Math.round((eventDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)));

  for (const task of bp.timeline) {
    if (task.daysBeforeEvent > daysRemaining) {
      console.error(`Assertion failed: Task "${task.title}" has daysBeforeEvent ${task.daysBeforeEvent} > daysRemaining ${daysRemaining}`);
      process.exit(1);
    }
  }

  // 2. Refine: "Cut the total budget by 20%"
  const refine1Res = await callEndpoint(
    '2. POST /api/refine-plan ("Cut the total budget by 20%")',
    '/api/refine-plan',
    {
      eventDetails,
      currentPlan: bp,
      userRequest: 'Cut the total budget by 20%',
    }
  );

  if (refine1Res.status !== 200 || !refine1Res.json?.refinement) {
    console.error('Assertion failed: Refine 1 did not return 200');
    process.exit(1);
  }

  const expectedBudget = Math.round(eventDetails.totalBudget * 0.8);
  const returnedBudget = refine1Res.json.refinement.totalBudget;
  if (returnedBudget !== expectedBudget) {
    console.error(`Assertion failed: Total budget was ${returnedBudget}, expected 80% (${expectedBudget})`);
    process.exit(1);
  }

  // 3. Refine: "Make it eco-friendly"
  const refine2Res = await callEndpoint(
    '3. POST /api/refine-plan ("Make it eco-friendly")',
    '/api/refine-plan',
    {
      eventDetails,
      currentPlan: bp,
      userRequest: 'Make it eco-friendly',
    }
  );

  if (refine2Res.status !== 200 || !refine2Res.json?.refinement) {
    console.error('Assertion failed: Refine 2 did not return 200');
    process.exit(1);
  }

  const r2 = refine2Res.json.refinement;
  const themeDiffers = r2.themeAndDecor && deepDiffers(r2.themeAndDecor, bp.themeAndDecor);
  const altDiffers = r2.alternatives && deepDiffers(r2.alternatives, bp.alternatives);

  if (!themeDiffers && !altDiffers) {
    console.error('Assertion failed: Neither themeAndDecor nor alternatives differed from original plan in eco-friendly refinement');
    process.exit(1);
  }

  // 4. Refine: "Cut venue budget by 20% and reallocate to gourmet Indian catering"
  const venueBefore = findCategoryPct(bp.budgetAllocation, /venue|hall|lawn/i);
  const cateringBefore = findCategoryPct(bp.budgetAllocation, /cater|food|feast/i);

  const refine3Res = await callEndpoint(
    '4. POST /api/refine-plan ("Cut venue budget by 20% and reallocate to gourmet Indian catering")',
    '/api/refine-plan',
    {
      eventDetails,
      currentPlan: bp,
      userRequest: 'Cut venue budget by 20% and reallocate to gourmet Indian catering',
    }
  );

  if (refine3Res.status !== 200 || !refine3Res.json?.refinement) {
    console.error('Assertion failed: Refine 3 did not return 200');
    process.exit(1);
  }

  const r3Alloc = refine3Res.json.refinement.budgetAllocation;
  const venueAfter = findCategoryPct(r3Alloc, /venue|hall|lawn/i);
  const cateringAfter = findCategoryPct(r3Alloc, /cater|food|feast/i);

  if (venueBefore !== null && venueAfter !== null && cateringBefore !== null && cateringAfter !== null) {
    if (!(venueAfter < venueBefore && cateringAfter > cateringBefore)) {
      console.error(`Assertion failed: Expected venueAfter (${venueAfter}) < venueBefore (${venueBefore}) AND cateringAfter (${cateringAfter}) > cateringBefore (${cateringBefore})`);
      process.exit(1);
    }
  }

  // 5. Generate Ideas: section = "theme"
  const ideasRes = await callEndpoint(
    '5. POST /api/generate-ideas',
    '/api/generate-ideas',
    {
      eventDetails,
      section: 'theme',
      existingIdeas: ['Outdoor Garden Soiree'],
    }
  );

  if (ideasRes.status !== 200 || !ideasRes.json?.ideas) {
    console.error('Assertion failed: Generate ideas did not return 200');
    process.exit(1);
  }

  const ideasList = ideasRes.json.ideas.ideas;
  if (!Array.isArray(ideasList) || ideasList.length < 3) {
    console.error(`Assertion failed: Expected >= 3 ideas, received ${ideasList?.length ?? 0}`);
    process.exit(1);
  }

  console.log('=== All Smoke Test Assertions PASSED ===');
  process.exit(0);
}

run();
