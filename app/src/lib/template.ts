/**
 * Audit-message rendering.
 *
 * The backend stores every audit / notification message as a TEMPLATE plus a
 * structured PAYLOAD (for example "Encoded incoming request
 * ${payload.control_no} (${payload.request_type}) received via
 * ${payload.channel}."). The template is only human-readable once the payload
 * is substituted into it, so every surface that shows a `template` must render
 * it through `renderTemplate` - printing the raw string leaks the placeholders
 * into the UI.
 */

/** `${payload.control_no}`, `${control_no}` and nested paths. */
const PLACEHOLDER = /\$\{\s*([A-Za-z0-9_.]+)\s*\}/g;

/** ISO-8601 timestamps (date-time, not a bare date) get localized. */
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

function readPath(source: Record<string, unknown>, path: string): unknown {
  const trimmed = path.startsWith('payload.') ? path.slice('payload.'.length) : path;
  let current: unknown = source;
  for (const segment of trimmed.split('.')) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (Array.isArray(value)) return value.length ? value.map(formatValue).join(', ') : '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string') {
    if (value.trim() === '') return '-';
    return ISO_DATE_TIME.test(value) ? new Date(value).toLocaleString() : value;
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * Substitute the payload into a stored template. Unknown keys render as `-`
 * rather than leaving a `${payload.x}` token visible in the audit trail.
 */
export function renderTemplate(
  template: string | null | undefined,
  payload?: Record<string, unknown> | null,
): string {
  if (!template) return '';
  const source = payload ?? {};
  return template.replace(PLACEHOLDER, (_match: string, path: string) =>
    formatValue(readPath(source, path)),
  );
}
