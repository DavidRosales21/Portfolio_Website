/**
 * Central event sender. Every event goes to GA4 (gtag) and Clarity (custom event tags).
 * Event names are the studio standard (CLAUDE.md §15) — do not rename per client.
 */
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export type Params = Record<string, string | number | boolean | undefined>;

export function track(name: string, params: Params = {}) {
  const payload = { page_path: location.pathname, ...params };
  window.gtag?.('event', name, payload);
  window.clarity?.('event', name);
  if (import.meta.env.DEV) console.debug('[track]', name, payload);
}
