import { fmtTJS } from '~/lib/format';
import type { BusinessInsight } from '~/types/analytics';

/** Params named like money are rendered as money; the rest stay as they are. */
const MONEY_PARAMS = new Set(['amount', 'previous', 'value']);

export function formatInsightParams(params: Record<string, string | number>): Record<string, string | number> {
  const formatted: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    formatted[key] = MONEY_PARAMS.has(key) && typeof value === 'number' ? fmtTJS(value) : value;
  }
  return formatted;
}

/**
 * Turns a backend recommendation into a link to the screen where the user can
 * act on it. The route and its filters come from the backend `action` — the
 * same rule that counted the problem decides where the user lands, so the
 * number in the sentence always matches the list that opens.
 */
export function insightHref(action: NonNullable<BusinessInsight['action']>): string {
  const query = new URLSearchParams(action.query ?? {}).toString();
  return query ? `${action.route}?${query}` : action.route;
}
