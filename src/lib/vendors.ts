/**
 * Vendor checklist helpers: ownership detection and regeneration merging.
 */

import type { BudgetCategory, Vendor } from '@/schemas';
import { findMatchingCategoryId, UNCATEGORISED_ID } from './budget';
import { calculateTokenSimilarity } from './text';

/** Minimum category similarity for a kept vendor to merge into a new AI vendor card. */
const VENDOR_MATCH_THRESHOLD = 0.6;

/** True when the user has added or changed anything on this vendor card. */
export function hasUserVendorData(vendor: Vendor): boolean {
  return (
    vendor.source === 'user' ||
    Boolean(vendor.name?.trim()) ||
    Boolean(vendor.contact?.trim()) ||
    vendor.quote != null ||
    Boolean(vendor.notes?.trim()) ||
    vendor.status !== 'not-started'
  );
}

/** Returns the vendor with a budgetCategoryId that exists in `categories`. */
function withValidBudgetCategory(vendor: Vendor, categories?: BudgetCategory[]): Vendor {
  if (!categories || categories.length === 0) {
    return { ...vendor, budgetCategoryId: vendor.budgetCategoryId || UNCATEGORISED_ID };
  }
  const isValid = categories.some((c) => c.id === vendor.budgetCategoryId);
  return isValid
    ? vendor
    : {
        ...vendor,
        budgetCategoryId: findMatchingCategoryId(vendor.category, categories) || UNCATEGORISED_ID,
      };
}

function bestVendorMatch(kept: Vendor, candidates: Vendor[], claimed: Set<number>): number {
  let bestIndex = -1;
  let bestScore = -1;
  candidates.forEach((candidate, i) => {
    if (claimed.has(i)) return;
    const score = calculateTokenSimilarity(kept.category, candidate.category);
    if (score >= VENDOR_MATCH_THRESHOLD && score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  });
  return bestIndex;
}

/**
 * Merges regenerated AI vendor suggestions with the existing checklist.
 * Untouched AI vendors are replaced; vendors with user data are kept and merged into
 * the best-matching new card (one card per category). Every vendor ends up linked
 * to a valid budget category, falling back to "Uncategorised".
 */
export function mergeVendorsOnRegenerate(
  existingVendors: Vendor[],
  newVendors: Vendor[],
  categories?: BudgetCategory[],
): Vendor[] {
  const merged = newVendors.map((vendor) =>
    withValidBudgetCategory(
      { ...vendor, source: vendor.source || 'ai', suggestedByAI: vendor.suggestedByAI ?? true },
      categories,
    ),
  );
  const claimed = new Set<number>();
  const unmatchedUserVendors: Vendor[] = [];

  for (const kept of existingVendors.filter(hasUserVendorData)) {
    const index = bestVendorMatch(kept, merged, claimed);
    if (index === -1) {
      unmatchedUserVendors.push(withValidBudgetCategory(kept, categories));
      continue;
    }
    claimed.add(index);
    const target = merged[index];
    merged[index] = {
      ...target,
      id: kept.id,
      name: kept.name || target.name,
      contact: kept.contact || target.contact,
      quote: kept.quote !== undefined ? kept.quote : target.quote,
      status: kept.status !== 'not-started' ? kept.status : target.status,
      notes: kept.notes || target.notes,
      source: kept.source || 'user',
    };
  }

  return [...merged, ...unmatchedUserVendors];
}
