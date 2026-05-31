/**
 * Format a backend ISO-8601 timestamp as a local-time string.
 * Returns an empty string for null/undefined or unparseable input so the
 * UI never shows "Invalid Date".
 */
export function formatLocalDateTime(value: string | null | undefined): string {
  if (!value) return ''
  const d = new Date(value)
  return isNaN(d.getTime()) ? '' : d.toLocaleString()
}
