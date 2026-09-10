/**
 * Wrapper fetch dengan timeout. Dibangun via AbortController.
 * Timeout/abort melempar error — panggil dalam try/catch agar tidak crash.
 */
export async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
  timeoutMs = 5_000,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}