import { sleep } from './utils';

/**
 * retry decorator which is nothing but a high order function wrapper
 *
 * @param options the 'RetryOptions'
 */
export function Retryable(options: RetryOptions): DecoratorFunction {
  /**
   * target: The prototype of the class (Object)
   * propertyKey: The name of the method (string | symbol).
   * descriptor: A TypedPropertyDescriptor — see the type, leveraging the Object.defineProperty under the hood.
   *
   * NOTE: It's very important here we do not use arrow function otherwise 'this' will be messed up due
   * to the nature how arrow function defines this inside.
   *
   */
  return function(target: Record<string, any>, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) {
    const originalFn = descriptor.value;
    // set default value for ExponentialBackOffPolicy
    if (options.backOffPolicy === BackOffPolicy.ExponentialBackOffPolicy) {
      setExponentialBackOffPolicyDefault();
    }
    descriptor.value = async function(...args: any[]) {
      try {
        return await retryAsync.apply(this, [originalFn, args, options.maxAttempts, options.backOff]);
      } catch (e) {
        if (e instanceof MaxAttemptsError) {
          const msgPrefix = `Failed for '${propertyKey}' for ${options.maxAttempts} times.`;
          e.message = e.message ? `${msgPrefix} Original Error: ${e.message}` : msgPrefix;
        }
        throw e;
      }
    };
    return descriptor;
  };

  async function retryAsync(fn: () => any, args: any[], maxAttempts: number, backOff?: number): Promise<any> {
    try {
      return await fn.apply(this, args);
    } catch (e) {
      if (--maxAttempts < 0) {
        e?.message && console.error(e.message);
        const maxAttemptsErrorInstance = new  MaxAttemptsError(e?.message);
        // Add the existing error stack if present
        if(e?.stack) {
          maxAttemptsErrorInstance.stack = e.stack;
        }

        throw maxAttemptsErrorInstance;
      }
      if (!canRetry(e)) {
        throw e;
      }
      backOff && (await sleep(backOff));
      if (options.backOffPolicy === BackOffPolicy.ExponentialBackOffPolicy) {
        const newBackOff: number = backOff * options.exponentialOption.multiplier;
        backOff = newBackOff > options.exponentialOption.maxInterval ? options.exponentialOption.maxInterval : newBackOff;
      }
      return retryAsync.apply(this, [fn, args, maxAttempts, backOff]);
    }
  }

  function canRetry(e: Error): boolean {
    if (options.doRetry && !options.doRetry(e)) {
      return false;
    }
    if (options.value?.length && !options.value.some(errorType => e instanceof errorType)) {
      return false;
    }
    return true;
  }

  function setExponentialBackOffPolicyDefault(): void {
    !options.backOff && (options.backOff = 1000);
    options.exponentialOption = {
      ...{ maxInterval: 2000, multiplier: 2 },
      ...options.exponentialOption,
    };
  }
}

export class MaxAttemptsError extends Error {
  code = '429';
  /* if target is ES5, need the 'new.target.prototype'
  constructor(msg?: string) {
      super(msg)
      Object.setPrototypeOf(this, new.target.prototype)
    } */
}

export interface RetryOptions {
  maxAttempts: number;
  backOffPolicy?: BackOffPolicy;
  backOff?: number;
  doRetry?: (e: any) => boolean;
  value?: ErrorConstructor[];
  exponentialOption?: { maxInterval: number; multiplier: number };
}

export enum BackOffPolicy {
  FixedBackOffPolicy = 'FixedBackOffPolicy',
  ExponentialBackOffPolicy = 'ExponentialBackOffPolicy'
}

export type DecoratorFunction = (target: Record<string, any>, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) => TypedPropertyDescriptor<any>;

