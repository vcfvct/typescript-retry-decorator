import { BackOffPolicy, ExponentialBackoffStrategy, MaxAttemptsError, Retryable } from './retry.decorator';
import { sleep } from './utils';

jest.mock('./utils', () => ({
  sleep: jest.fn()
}));

// CustomError for testing.
class CustomError extends Error {
  constructor(message?: string) {
    // Call the parent class constructor with the provided message
    super(message);

    // Set the prototype and name properties
    Object.setPrototypeOf(this, CustomError.prototype);
    this.name = 'CustomError';
  }
}

class TestClass {
  count: number;
  constructor() {
    this.count = 0;
  }
  @Retryable({ maxAttempts: 2 })
  async testMethodWithoutBackOff(): Promise<void> {
    console.log(`test method is called for ${++this.count} time`);
    await this.called();
  }

  @Retryable({ maxAttempts: 3, value: [SyntaxError, ReferenceError, CustomError] })
  async testMethodWithException(): Promise<void> {
    console.log(`test method is called for ${++this.count} time`);
    await this.called();
  }

  @Retryable({
    maxAttempts: 3,
    doRetry: (e: Error) => {
      return e.message === 'Error: 429';
    },
  })
  async testDoRetry(): Promise<void> {
    console.info(`Calling doRetry for the ${++this.count} time at ${new Date().toLocaleTimeString()}`);
    await this.called();
  }

  @Retryable({
    maxAttempts: 3,
    backOffPolicy: BackOffPolicy.FixedBackOffPolicy,
    backOff: 1000,
  })
  async fixedBackOffRetry(): Promise<void> {
    console.info(`Calling fixedBackOffRetry 1s for the ${++this.count} time at ${new Date().toLocaleTimeString()}`);
    await this.called();
  }

  @Retryable({
    maxAttempts: 3,
    backOffPolicy: BackOffPolicy.ExponentialBackOffPolicy,
    exponentialOption: { maxInterval: 4000, multiplier: 3 },
  })
  async exponentialBackOffRetry(): Promise<void> {
    console.info(`Calling ExponentialBackOffRetry backOff 1s, multiplier=3 for the ${++this.count} time at ${new Date().toLocaleTimeString()}`);
    await this.called();
  }

  @Retryable({
    maxAttempts: 3,
    backOffPolicy: BackOffPolicy.ExponentialBackOffPolicy,
    exponentialOption: { maxInterval: 4000, multiplier: 2, backoffStrategy: ExponentialBackoffStrategy.FullJitter },
  })
  async exponentialBackOffWithJitterRetry(): Promise<void> {
    console.info(`Calling ExponentialBackOffRetry backOff 1s, multiplier=2 for the ${++this.count} time at ${new Date().toLocaleTimeString()}`);
    await this.called();
  }

  @Retryable({ maxAttempts: 2, useConsoleLogger: false })
  async noLog(): Promise<void> {
    console.log(`test method is called for ${++this.count} time`);
    await this.called();
  }

  @Retryable({ maxAttempts: 2, useOriginalError: true })
  async useOriginalError(): Promise<void> {
    await this.called();
  }

  async called(): Promise<string> {
    return 'from real implementation';
  }
}

describe('Capture original error data Test', () => {
  test('exceed max retry', async () => {
    const testClass = new TestClass();

    const originalStackTrace = 'foo';
    const errorMsg = 'rejected';

    const unexpectedError = new Error(errorMsg);
    unexpectedError.stack = originalStackTrace;

    const calledSpy = jest.spyOn(testClass, 'called');

    calledSpy.mockRejectedValue(unexpectedError);
    try {
      await testClass.testMethodWithoutBackOff();
    } catch (e) {
      expect(e.stack).toEqual(originalStackTrace);
    }
  });
});


describe('Retry Test', () => {
  let testClass: TestClass;
  beforeEach(() => {
    testClass = new TestClass();
  });

  test('normal retry without backoff', async () => {
    const calledSpy = jest.spyOn(testClass, 'called');
    calledSpy.mockRejectedValueOnce(new Error('rejected'));
    calledSpy.mockResolvedValueOnce('fulfilled');
    await testClass.testMethodWithoutBackOff();
    expect(calledSpy).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(0);
  });

  test('exceed max retry', async () => {
    const calledSpy = jest.spyOn(testClass, 'called');
    const errorMsg = 'rejected';
    calledSpy.mockRejectedValue(new Error(errorMsg));
    try {
      await testClass.testMethodWithoutBackOff();
    } catch (e) {
      expect(e).toBeInstanceOf(MaxAttemptsError);
      expect(e.message.includes(errorMsg));
    }
    expect(calledSpy).toHaveBeenCalledTimes(3);
  });

  test('retry with specific error', async () => {
    const calledSpy = jest.spyOn(testClass, 'called');
    calledSpy.mockImplementationOnce(() => { throw new CustomError('I failed!'); });
    await testClass.testMethodWithException();
    expect(calledSpy).toHaveBeenCalledTimes(2);
  });

  test('retry with specific error not match', async () => {
    const calledSpy = jest.spyOn(testClass, 'called');
    calledSpy.mockImplementationOnce(() => { throw new Error('I failed!'); });
    try {
      await testClass.testMethodWithException();
    } catch (e) { }
    expect(calledSpy).toHaveBeenCalledTimes(1);
  });


  test('do retry when high order function retry true', async () => {
    const calledSpy = jest.spyOn(testClass, 'called');
    calledSpy.mockImplementationOnce(() => { throw new Error('Error: 429'); });
    await testClass.testDoRetry();
    expect(calledSpy).toHaveBeenCalledTimes(2);
  });

  test('do NOT retry when high order function retry false', async () => {
    const calledSpy = jest.spyOn(testClass, 'called');
    calledSpy.mockImplementationOnce(() => { throw new Error('Error: 500'); });
    try {
      await testClass.testDoRetry();
    } catch (e) { }
    expect(calledSpy).toHaveBeenCalledTimes(1);
  });

  test('fix backOff policy', async () => {
    const calledSpy = jest.spyOn(testClass, 'called');
    calledSpy.mockImplementation(() => { throw new Error('Error: 500'); });
    try {
      await testClass.fixedBackOffRetry();
    } catch (e) { }
    expect(calledSpy).toHaveBeenCalledTimes(4);
  });

  test('exponential backOff policy', async () => {
    jest.setTimeout(60000);
    const calledSpy = jest.spyOn(testClass, 'called');
    calledSpy.mockImplementation(() => { throw new Error(); });
    try {
      await testClass.exponentialBackOffRetry();
    } catch (e) { }
    expect(calledSpy).toHaveBeenCalledTimes(4);
  });

  test('exponential backOff policy with jitter', async () => {
    jest.setTimeout(60000);
    const calledSpy = jest.spyOn(testClass, 'called');
    calledSpy.mockImplementation(() => { throw new Error(); });
    try {
      await testClass.exponentialBackOffWithJitterRetry();
    } catch (e) { }
    expect(calledSpy).toHaveBeenCalledTimes(4);
  });

  test('no log', async () => {
    const calledSpy = jest.spyOn(testClass, 'called');
    const errorSpy = jest.spyOn(console, 'error');
    calledSpy.mockRejectedValueOnce(new Error('rejected'));
    calledSpy.mockResolvedValueOnce('fulfilled');
    await testClass.testMethodWithoutBackOff();
    expect(calledSpy).toHaveBeenCalledTimes(2);
    expect(errorSpy).not.toHaveBeenCalled();
  });


  test('throw original error', async () => {
    jest.setTimeout(60000);
    const calledSpy = jest.spyOn(testClass, 'called');
    calledSpy.mockImplementation(() => { throw new CustomError(); });
    try {
      await testClass.useOriginalError();
    } catch (e) {
      expect(e).toBeInstanceOf(CustomError);
    }
  });
});

