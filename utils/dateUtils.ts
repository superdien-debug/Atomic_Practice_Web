/**
 * Returns the current local date in YYYY-MM-DD format.
 * Prevents timezone shifts (e.g. late night logs jumping to next UTC day).
 */
export function getLocalISODate(date: Date = new Date()): string {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
}
