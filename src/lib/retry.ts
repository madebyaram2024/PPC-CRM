export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (i === maxRetries - 1) {
        break;
      }

      // Exponential backoff
      const waitTime = delayMs * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError!;
}

export function createRetryableFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  maxRetries: number = 3
) {
  return withRetry(() => fetch(input, init), maxRetries);
}