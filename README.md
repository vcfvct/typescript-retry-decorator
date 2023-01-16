![Retry](https://cdn.iconscout.com/icon/free/png-256/retry-1-386755.png)
## A simple retry decorator for typescript with 0 dependency.
This is inspired by the [Spring-Retry project](https://github.com/spring-projects/spring-retry). Written in Typescript, *100%* Test Coverage.

Import and use it. Retry for `Promise` is supported as long as the `runtime` has promise(nodejs/evergreen-browser).

### Install
> npm install typescript-retry-decorator

### Options
| Option Name       | Type                  | Required? | Default                                 | Description                                                                                                       |
|:-----------------:|:------:|:---------:|:---------------------------------------:|:--------------------------------------------------------------------------------------------------------------------------------:|
| maxAttempts       | number                | Yes       | -                                       | The max attempts to try                                                                                           |
| backOff           | number                | No        | 0                                       | number in `ms` to back off.  If not set, then no wait                                                             |
| backOffPolicy     | enum                  | No        | FixedBackOffPolicy                      | can be fixed or exponential                                                                                       |
| exponentialOption | object                | No        | { maxInterval: 2000,    multiplier: 2 } | This is for the `ExponentialBackOffPolicy` <br/> The max interval each wait and the multiplier for the `backOff`. |
| doRetry           | (e: any) => boolean   | No        | -                                       | Function with error parameter to decide if repetition is necessary.                                               |
| value             | Error/Exception class | No        | [ ]                                     | An array of Exception types that are retryable.                                                                   |
| useConsoleLogger  | boolean               | No        | true                                    | Print errors on console.                                                                                          |
| useOriginalError  | throw original exception| No      | false                                   | `MaxAttemptsError` by default. if this is set to *true*, the `original` exception would be thrown instead.        |

### Example
```typescript
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
    value: [SyntaxError, ReferenceError]
  })
  static async noDelaySpecificRetry(): Promise<void> {
    console.info(`Calling noDelaySpecificRetry for the ${count++} time at ${new Date().toLocaleTimeString()}`);
    throw new SyntaxError('I failed with SyntaxError!');
  }

  @Retryable({ 
    maxAttempts: 3,
    backOff: 1000,
    doRetry: (e: Error) => {
      return e.message === 'Error: 429';
    }
   })
  static async doRetry() {
    console.info(`Calling doRetry for the ${count++} time at ${new Date().toLocaleTimeString()}`);
    throw new Error('Error: 429');
  }

  @Retryable({ 
    maxAttempts: 3,
    backOff: 1000,
    doRetry: (e: Error) => {
      return e.message === 'Error: 429';
    }
   })
  static async doNotRetry() {
    console.info(`Calling doNotRetry for the ${count++} time at ${new Date().toLocaleTimeString()}`);
    throw new Error('Error: 404');
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

function resetCount() {
  count = 1;
}
```

Run the above code with `ts-node`, then output will be:
```
Calling noDelayRetry for the 1 time at 4:12:49 PM
Calling noDelayRetry for the 2 time at 4:12:49 PM
Calling noDelayRetry for the 3 time at 4:12:49 PM
Calling noDelayRetry for the 4 time at 4:12:49 PM
I failed!
All retry done as expected, final message: 'Failed for 'noDelayRetry' for 3 times.'
Calling noDelayRetry for the 1 time at 4:12:49 PM
Calling noDelayRetry for the 2 time at 4:12:49 PM
Calling noDelayRetry for the 3 time at 4:12:49 PM
Calling noDelayRetry for the 4 time at 4:12:49 PM
I failed with SyntaxError!
All retry done as expected, final message: 'Failed for 'noDelaySpecificRetry' for 3 times.'
Calling doRetry for the 1 time at 4:12:49 PM
Calling doRetry for the 2 time at 4:12:50 PM
Calling doRetry for the 3 time at 4:12:51 PM
Calling doRetry for the 4 time at 4:12:52 PM
Error: 429
All retry done as expected, final message: 'Failed for 'doRetry' for 3 times.'
Calling doNotRetry for the 1 time at 4:12:52 PM
All retry done as expected, final message: 'Error: 404'
Calling fixedBackOffRetry 1s for the 1 time at 4:12:52 PM
Calling fixedBackOffRetry 1s for the 2 time at 4:12:53 PM
Calling fixedBackOffRetry 1s for the 3 time at 4:12:54 PM
Calling fixedBackOffRetry 1s for the 4 time at 4:12:55 PM
I failed!
All retry done as expected, final message: 'Failed for 'fixedBackOffRetry' for 3 times.'
Calling ExponentialBackOffRetry backOff 1s, multiplier=3 for the 1 time at 4:12:55 PM
Calling ExponentialBackOffRetry backOff 1s, multiplier=3 for the 2 time at 4:12:56 PM
Calling ExponentialBackOffRetry backOff 1s, multiplier=3 for the 3 time at 4:12:59 PM
Calling ExponentialBackOffRetry backOff 1s, multiplier=3 for the 4 time at 4:13:03 PM
I failed!
All retry done as expected, final message: 'Failed for 'ExponentialBackOffRetry' for 3 times.'
```
