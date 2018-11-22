import { Retryable, BackOffPolicy } from './retry.decorator';

let count: number = 1;

class RetryExample {
  @Retryable({ maxAttempts: 3 })
  static async noDelayRetry() {
    console.info(`Calling noDelayRetry for the ${count++} time at ${new Date().toLocaleTimeString()}`);
    throw new Error('I failed!');
  }
  @Retryable({
    maxAttempts: 3,
    backOffPolicy: BackOffPolicy.FixedBackOffPolicy,
    backOff: 1000
  })
  static async fixedBackOffRetry() {
    console.info(`Calling fixedBackOffRetry 1s for the ${count++} time at ${new Date().toLocaleTimeString()}`);
    throw new Error('I failed!');
  }
  @Retryable({
    maxAttempts: 3,
    backOffPolicy: BackOffPolicy.ExponentialBackOffPolicy,
    backOff: 1000,
    exponentialOption: { maxInterval: 4000, multiplier: 3 }
  })
  static async ExponentialBackOffRetry() {
    console.info(`Calling ExponentialBackOffRetry backOff 1s, multiplier=3 for the ${count++} time at ${new Date().toLocaleTimeString()}`);
    throw new Error('I failed!');
  }
}

(async () => {
  try {
    resetCount();
    await RetryExample.noDelayRetry();
  } catch (e) {
    console.info(`All retry done as expected, final message: '${e.message}'`);
  }
  try {
    resetCount();
    await RetryExample.fixedBackOffRetry();
  } catch (e) {
    console.info(`All retry done as expected, final message: '${e.message}'`);
  }
  try {
    resetCount();
    await RetryExample.ExponentialBackOffRetry();
  } catch (e) {
    console.info(`All retry done as expected, final message: '${e.message}'`);
  }
})();

function resetCount() {
  count = 1;
}