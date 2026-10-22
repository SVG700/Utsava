/** Machine-readable failure categories surfaced to API clients. */
export type GeminiErrorCode =
  'MISSING_KEY' | 'RATE_LIMIT' | 'TIMEOUT' | 'INVALID_RESPONSE' | 'API_ERROR' | 'NO_CHANGES';

/** Error raised by the AI layer; its message is always safe to show to end users. */
export class GeminiError extends Error {
  constructor(
    message: string,
    public readonly code: GeminiErrorCode,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}
