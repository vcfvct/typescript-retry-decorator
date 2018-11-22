import { throwError, sleep } from './utils';

/**
 * retry decorator which is nothing but a high order function wrapper
 *
 * @param options the 'RetryOptions'
 */
export function Retryable(options: RetryOptions): Function {
  /**
   * target: The prototype of the class (Object)
   * propertyKey: The name of the method (string | symbol).
   * descriptor: A TypedPropertyDescriptor — see the type, leveraging the Object.defineProperty under the hood.
   *
   * NOTE: It's very important here we do not use arrow function otherwise 'this' will be messed up due
   * to the nature how arrow function defines this inside.
   *
   */
  return function (target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) {
    const originalFn: Function = descriptor.value;
    // set default value for ExponentialBackOffPolicy
    if (options.backOffPolicy === BackOffPolicy.ExponentialBackOffPolicy) {
      !options.backOff && (options.backOff = 1000);
      options.exponentialOption = { ...{ maxInterval: 2000, multiplier: 2 }, ...options.exponentialOption }
    }
    descriptor.value = async function (...args: any[]) {
      try {
        return await retryAsync.apply(this, [originalFn, args, options.maxAttempts, options.backOff]);
      } catch (e) {
        e.message = `Failed for '${propertyKey}' for ${options.maxAttempts} times.`;
        throw e;
      }
    };
    return descriptor;
  };

  async function retryAsync(fn: Function, args: any[], maxAttempts: number, backOff?: number): Promise<any> {
    try {
      return await fn.apply(this, args);
    } catch {
      --maxAttempts < 0 && throwError();
      backOff && await sleep(backOff);
      if (options.backOffPolicy === BackOffPolicy.ExponentialBackOffPolicy) {
        const newBackOff: number = backOff * options.exponentialOption.multiplier;
        backOff = newBackOff > options.exponentialOption.maxInterval ? options.exponentialOption.maxInterval : newBackOff;
      }
      return retryAsync.apply(this, [fn, args, maxAttempts, backOff]);
    }
  }
}



export interface RetryOptions {
  maxAttempts: number;
  backOffPolicy?: BackOffPolicy
  backOff?: number
  exponentialOption?: { maxInterval: number, multiplier: number }
}

export enum BackOffPolicy {
  FixedBackOffPolicy = 'FixedBackOffPolicy',
  ExponentialBackOffPolicy = 'ExponentialBackOffPolicy'
}
