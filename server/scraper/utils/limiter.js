/**
 * limiter.js — Concurrency limiter for parallel scraping
 *
 * Runs async tasks with a bounded concurrency pool.
 * Prevents too many browser instances opening simultaneously.
 */

/**
 * Runs an array of async task functions in parallel, capped at `concurrency` at a time.
 * @param {Function[]} tasks      - Array of async () => result functions
 * @param {number}     concurrency - Max concurrent tasks
 * @returns {Promise<Array>}       - Settled results (fulfilled value or rejection reason)
 */
async function runWithLimit(tasks, concurrency = 3) {
  const results = [];
  const queue = [...tasks];
  const inFlight = new Set();

  return new Promise((resolve, reject) => {
    function runNext() {
      while (inFlight.size < concurrency && queue.length > 0) {
        const task = queue.shift();
        const promise = task()
          .then((val) => {
            results.push({ status: 'fulfilled', value: val });
          })
          .catch((err) => {
            results.push({ status: 'rejected', reason: err.message });
          })
          .finally(() => {
            inFlight.delete(promise);
            if (queue.length > 0) {
              runNext();
            } else if (inFlight.size === 0) {
              resolve(results);
            }
          });
        inFlight.add(promise);
      }

      if (inFlight.size === 0 && queue.length === 0) {
        resolve(results);
      }
    }

    runNext();
  });
}

module.exports = { runWithLimit };
