/**
 * Input sanitization utilities.
 *
 * Strips HTML tags and trims whitespace from user-supplied strings
 * to prevent stored XSS and ensure data cleanliness.
 */

/**
 * Strip HTML tags from a string and trim whitespace.
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '')   // Remove HTML tags
    .replace(/&lt;/gi, '<')     // Decode common entities that could slip through
    .replace(/&gt;/gi, '>')
    .replace(/<[^>]*>/g, '')   // Second pass after entity decode
    .trim();
}

/**
 * Sanitize an object's string values (shallow, one level).
 * Non-string values are passed through unchanged.
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  fieldsToSanitize?: string[]
): T {
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    if (typeof result[key] === 'string') {
      if (!fieldsToSanitize || fieldsToSanitize.includes(key)) {
        (result as any)[key] = sanitizeString(result[key]);
      }
    }
  }
  return result;
}

/**
 * Validate that a string doesn't exceed a maximum length.
 */
export function validateLength(input: string, maxLength: number): boolean {
  return input.length <= maxLength;
}

/**
 * Basic email format validation.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
