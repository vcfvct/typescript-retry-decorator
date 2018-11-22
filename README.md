![Retry](https://cdn.iconscout.com/icon/free/png-256/retry-1-386755.png)
## A simple retry decorator for typescript with 0 dependency.
This is inspired by the [Spring-Retry project](https://github.com/spring-projects/spring-retry).
Import and use it. Retry for `Promise` is also supported.

### Install
> npm install typescript-retry-decorator

### Options
|    Option Name    |  Type  | Required? |                 Default                 |                                                    Description                                                    |
|:-----------------:|:------:|:---------:|:---------------------------------------:|:-----------------------------------------------------------------------------------------------------------------:|
|    maxAttempts    | number |    Yes    |                    -                    |                                              The max attempts to try                                              |
|      backOff      | number |     No    |                    0                    |                               number in `ms` to back off.  If not set, then no wait                               |
|   backOffPolicy   |  enum  |     No    |            FixedBackOffPolicy           |                                            can be fixed or exponential                                            |
| exponentialOption | object | No        | { maxInterval: 2000,    multiplier: 2 } | This is for the `ExponentialBackOffPolicy` <br/> The max interval each wait and the multiplier for the `backOff`. |

### Example
```
import { Retryable, BackOffPolicy } from 'typescript-retry-decorator';

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
```

Run the above code with `ts-node`, output will be:
```
Calling noDelayRetry for the 1 time at 23:47:13
Calling noDelayRetry for the 2 time at 23:47:13
Calling noDelayRetry for the 3 time at 23:47:13
Calling noDelayRetry for the 4 time at 23:47:13
All retry done as expected, final message: 'Failed for 'noDelayRetry' for 3 times.'

Calling fixedBackOffRetry for the 1 time at 23:47:13
Calling fixedBackOffRetry for the 2 time at 23:47:14
Calling fixedBackOffRetry for the 3 time at 23:47:15
Calling fixedBackOffRetry for the 4 time at 23:47:16
All retry done as expected, final message: 'Failed for 'fixedBackOffRetry' for 3 times.'

Calling ExponentialBackOffRetry for the 1 time at 23:47:16
Calling ExponentialBackOffRetry for the 2 time at 23:47:17
Calling ExponentialBackOffRetry for the 3 time at 23:47:20
Calling ExponentialBackOffRetry for the 4 time at 23:47:24
All retry done as expected, final message: 'Failed for 'ExponentialBackOffRetry' for 3 times.'
```