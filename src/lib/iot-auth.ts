import { timingSafeEqual } from "node:crypto";

export function isValidIotApiKey(providedKey: string | null) {
  const expectedKey = process.env.IOT_DEVICE_API_KEY;
  if (!expectedKey || !providedKey) return false;

  const expected = Buffer.from(expectedKey);
  const provided = Buffer.from(providedKey);
  return (
    expected.length === provided.length && timingSafeEqual(expected, provided)
  );
}
