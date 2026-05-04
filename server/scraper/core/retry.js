/**
 * retry.js — Retry utility with exponential back-off
 * Wraps async functions in a retry loop to handle transient failures.
 */

/**
 * Executes an async function with retry logic.
 * @param {Function} fn           - Async function to execute
 * @param {number}   maxRetries   - Max number of attempts
 * @param {number}   baseDelay    - Initial delay in ms (doubles on each retry)
 * @param {string}   label        - Label for logging
 * @returns {Promise<any>}
 */
async function withRetry(fn, maxRetries = 3, baseDelay = 2000, label = 'operation') {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential back-off
      console.warn(
        `[Retry] "${label}" attempt ${attempt}/${maxRetries} failed: ${err.message}. Retrying in ${delay}ms...`
      );

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`[Retry] "${label}" failed after ${maxRetries} attempts. Last error: ${lastError.message}`);
}

module.exports = { withRetry };
