const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates whether a given string is a valid UUID v4 / RFC 4122 string.
 */
export function isUUID(value: string | null | undefined): boolean {
  if (!value) return false;
  return UUID_REGEX.test(value.trim());
}
