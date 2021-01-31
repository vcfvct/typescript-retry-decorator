import { Retryable, BackOffPolicy } from './retry.decorator';

let count = 1;

class RetryExample {
  @Retryable({ maxAttempts: 3 })
  static async noDelayRetry(): Promise<void> {
    console.info(`Calling noDelayRetry for the ${count++} time at ${new Date().toLocaleTimeString()}`);
    throw new Error('I failed!');
  }

  @Retryable({ maxAttempts: 3, value: [SyntaxError, ReferenceError] })
  static async noDelaySpecificRetry(): Promise<void> {
    console.info(`Calling noDelayRetry for the ${count++} time at ${new Date().toLocaleTimeString()}`);
    throw new SyntaxError('I failed with SyntaxError!');
  }

  @Retryable({
    maxAttempts: 3,
    backOff: 1000,
    doRetry: (e: Error) => {
      return e.message === 'Error: 429';
    },
  })
  static async doRetry(): Promise<void> {
    console.info(`Calling doRetry for the ${count++} time at ${new Date().toLocaleTimeString()}`);
    throw new Error('Error: 429');
  }

  @Retryable({
    maxAttempts: 3,
    backOff: 1000,
    doRetry: (e: Error) => {
      return e.message === 'Error: 429';
    },
  })
  static async doNotRetry(): Promise<void> {
    console.info(`Calling doNotRetry for the ${count++} time at ${new Date().toLocaleTimeString()}`);
    throw new Error('Error: 404');
  }

  @Retryable({
    maxAttempts: 3,
    backOffPolicy: BackOffPolicy.FixedBackOffPolicy,
    backOff: 1000,
  })
  static async fixedBackOffRetry(): Promise<void> {
    console.info(`Calling fixedBackOffRetry 1s for the ${count++} time at ${new Date().toLocaleTimeString()}`);
    throw new Error('I failed!');
  }

  @Retryable({
    maxAttempts: 3,
    backOffPolicy: BackOffPolicy.ExponentialBackOffPolicy,
    backOff: 1000,
    exponentialOption: { maxInterval: 4000, multiplier: 3 },
  })
  static async ExponentialBackOffRetry(): Promise<void> {
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
    await RetryExample.noDelaySpecificRetry();
  } catch (e) {
    console.info(`All retry done as expected, final message: '${e.message}'`);
  }

  try {
    resetCount();
    await RetryExample.doRetry();
  } catch (e) {
    console.info(`All retry done as expected, final message: '${e.message}'`);
  }

  try {
    resetCount();
    await RetryExample.doNotRetry();
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

function resetCount(): void {
  count = 1;
}
