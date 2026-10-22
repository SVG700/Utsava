'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGenerateBlueprint, ApiError } from '@/lib/api';
import { logger } from '@/lib/logger';
import { applyGeneratedBlueprint, type PlanState } from '@/lib/planUpdates';
import type { PlanUpdate } from './usePlannerData';

const MISSING_KEY_MESSAGE =
  'Gemini API key is not configured. Please set GEMINI_API_KEY in your .env.local file to enable AI generation.';
const NETWORK_ERROR_MESSAGE =
  'Network error or service unavailable. Please check your connection and retry.';

/**
 * Requests a blueprint from the API and merges it into the plan.
 * In-flight requests are aborted when a new one starts or the component unmounts.
 */
export function useBlueprintGeneration(
  plan: PlanState | null,
  commit: (update: PlanUpdate) => void,
) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const event = plan?.event;
  const generate = useCallback(async () => {
    if (!event || isGenerating) return;

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const { blueprint } = await apiGenerateBlueprint(event, controller.signal);
      commit((current) => applyGeneratedBlueprint(current, blueprint));
      setApiKeyMissing(false);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      logger.error('Error generating blueprint:', err);
      if (err instanceof ApiError && err.code === 'MISSING_API_KEY') {
        setApiKeyMissing(true);
        setErrorMessage(MISSING_KEY_MESSAGE);
      } else {
        setErrorMessage(err instanceof Error ? err.message : NETWORK_ERROR_MESSAGE);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [event, isGenerating, commit]);

  const clearError = useCallback(() => setErrorMessage(null), []);

  return { generate, isGenerating, apiKeyMissing, errorMessage, clearError };
}
