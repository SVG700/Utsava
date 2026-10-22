/**
 * Small text utilities shared by matching logic.
 */

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean),
  );
}

/**
 * Jaccard similarity (0–1) of the normalised words in two strings.
 * Two empty strings are considered identical.
 */
export function calculateTokenSimilarity(a: string, b: string): number {
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }
  return intersection / new Set([...setA, ...setB]).size;
}
