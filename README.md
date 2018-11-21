## A simple retry decorator for typescript with 0 dependency.
Import and use it. Retry for `Promise` is also supported.

### Install
> npm install typescript-retry-decorator

### Example
```
import { Retry } from 'typescript-retry-decorator';

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
    await RetryExpample.functionToRetry();
  } catch (e) {
    console.info(`All retry done as expected, final message: '${e.message}'`);
  }
})()
```