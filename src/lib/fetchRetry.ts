/**
 * fetch wrapper that automatically retries on server errors (5xx).
 *
 * On cold-start serverless instances, MongoDB may not be fully connected
 * when the first wave of API requests arrives. These requests fail with 500,
 * but a retry a moment later succeeds because the connection is now ready.
 * This wrapper makes that retry transparent to the UI.
 *
 * 4xx errors are NOT retried — they indicate a real client/auth error.
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  maxRetries = 3,
  baseDelayMs = 800
): Promise<Response> {
  let lastResponse: Response | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      await new Promise<void>((r) =>
        setTimeout(r, baseDelayMs * attempt)
      );
    }

    try {
      const res = await fetch(url, options);
      // Only retry on 5xx. Return immediately for success or 4xx.
      if (res.status < 500 || attempt === maxRetries) return res;
      lastResponse = res;
    } catch (err) {
      if (attempt === maxRetries) throw err;
    }
  }

  // maxRetries exhausted — return the last 5xx response
  return lastResponse!;
}
