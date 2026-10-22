import { describe, it, expect } from 'vitest';
import { cleanJsonResponse } from '@/lib/ai/structuredCall';
import { hasValidChangedSections } from '@/lib/ai/client';
import type { AIRefinement } from '@/schemas';

describe('cleanJsonResponse', () => {
  it('strips ```json fences and surrounding whitespace', () => {
    expect(cleanJsonResponse('  ```json\n{"a":1}\n```  ')).toBe('{"a":1}');
  });

  it('strips bare ``` fences', () => {
    expect(cleanJsonResponse('```\n[1,2]\n```')).toBe('[1,2]');
  });

  it('leaves plain JSON untouched', () => {
    expect(cleanJsonResponse('{"ok":true}')).toBe('{"ok":true}');
  });
});

describe('hasValidChangedSections', () => {
  const base = { refinementSummary: 'Updated.' } as AIRefinement;

  it('rejects an empty changedSections list', () => {
    expect(hasValidChangedSections({ ...base, changedSections: [] })).toBe(false);
  });

  it('rejects when a listed section is missing from the payload', () => {
    expect(hasValidChangedSections({ ...base, changedSections: ['themeAndDecor'] })).toBe(false);
  });

  it('accepts when every listed section is present', () => {
    const refinement = {
      ...base,
      changedSections: ['totalBudget'],
      totalBudget: 1_200_000,
    } as AIRefinement;
    expect(hasValidChangedSections(refinement)).toBe(true);
  });
});
