/**
 * Minimal logger used across server routes and client components.
 * Messages are prefixed for easy filtering; browser logging is silenced in production
 * so end users never see internal diagnostics in their console.
 */

const PREFIX = '[utsava]';

const isSilencedInBrowser = typeof window !== 'undefined' && process.env.NODE_ENV === 'production';

/** Logs an error with a short context label. */
function error(label: string, ...details: unknown[]): void {
  if (isSilencedInBrowser) return;
  console.error(`${PREFIX} ${label}`, ...details);
}

/** Logs a recoverable warning with a short context label. */
function warn(label: string, ...details: unknown[]): void {
  if (isSilencedInBrowser) return;
  console.warn(`${PREFIX} ${label}`, ...details);
}

export const logger = { error, warn };
