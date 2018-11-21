import { Retry } from './retry.decorator';

let counter: number = 1;

class RetryExample {
  @Retry({ retries: 3, backOff: 1000 })
  static async functionToRetry() {
    console.info(`Calling functionToRetry for the ${counter++} time`);
    throw new Error('I failed!');
  }
}

(async () => {
  try {
    await RetryExample.functionToRetry();
  } catch (e) {
    console.info(`All retry done as expected, final message: '${e.message}'`);
  }
})()