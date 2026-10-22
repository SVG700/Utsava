/**
 * Public AI API used by the route handlers: one function per Gemini use case.
 * Server-only. Transport, schema conversion and retry logic live in sibling modules.
 */

import {
  aiBlueprintSchema,
  aiIdeasSchema,
  aiRefinementSchema,
  type AIBlueprint,
  type AIIdeas,
  type AIRefinement,
  type BlueprintRequest,
  type IdeasRequest,
  type RefinementRequest,
} from '@/schemas';
import { GeminiError } from './errors';
import { blueprintJsonSchema, ideasJsonSchema, refinementJsonSchema } from './geminiSchema';
import { buildBlueprintPrompt, buildIdeasPrompt, buildRefinementPrompt } from './prompts';
import { generateStructured, type AcceptanceRule } from './structuredCall';

export { GeminiError, type GeminiErrorCode } from './errors';
export { isGeminiConfigured, getModelName } from './gemini';
export {
  FORBIDDEN_GEMINI_SCHEMA_KEYS,
  sanitizeSchemaForGemini,
  blueprintJsonSchema,
  refinementJsonSchema,
  ideasJsonSchema,
} from './geminiSchema';

/** True when the refinement lists changed sections and includes every one of them. */
export function hasValidChangedSections(refinement: AIRefinement): boolean {
  const sections = refinement.changedSections ?? [];
  return sections.length > 0 && sections.every((section) => refinement[section] != null);
}

const refinementMustChangeSomething: AcceptanceRule<AIRefinement> = {
  isAcceptable: hasValidChangedSections,
  issuePath: 'changedSections',
  correctionHint:
    "You must specify a non-empty 'changedSections' array and include each listed section in full.",
  rejection: () =>
    new GeminiError(
      'No changes could be applied to your plan. Try a more specific request.',
      'NO_CHANGES',
      422,
    ),
};

/** Generates a complete celebration blueprint for the event. */
export function generateBlueprintWithGemini(
  req: BlueprintRequest,
  customApiKey?: string | null,
): Promise<AIBlueprint> {
  return generateStructured({
    prompt: buildBlueprintPrompt(req),
    schema: aiBlueprintSchema,
    responseJsonSchema: blueprintJsonSchema,
    customApiKey,
    label: 'blueprint',
  });
}

/** Applies a natural-language change request; returns only the sections that changed. */
export function refinePlanWithGemini(
  req: RefinementRequest,
  customApiKey?: string | null,
): Promise<AIRefinement> {
  return generateStructured({
    prompt: buildRefinementPrompt(req),
    schema: aiRefinementSchema,
    responseJsonSchema: refinementJsonSchema,
    customApiKey,
    label: 'refinement',
    acceptance: refinementMustChangeSomething,
  });
}

/** Generates personalised ideas for one Idea Studio section. */
export function generateIdeasWithGemini(
  req: IdeasRequest,
  customApiKey?: string | null,
): Promise<AIIdeas> {
  return generateStructured({
    prompt: buildIdeasPrompt(req),
    schema: aiIdeasSchema,
    responseJsonSchema: ideasJsonSchema,
    customApiKey,
    label: 'idea studio',
  });
}
