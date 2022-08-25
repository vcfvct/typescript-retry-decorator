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
      return await retryAsync.apply(this, [originalFn, args, options.maxAttempts, options.backOff]);
    };
    return descriptor;
  };

  async function retryAsync(fn: () => any, args: any[], maxAttempts: number, backOff?: number): Promise<any> {
    for (let i = 0; i<(maxAttempts+1); i++) {
      try {
        return await fn.apply(this, args);
      } catch (e) {
        if (i == maxAttempts) {
          if (options.reraise) {
            throw e;
          }
          throw new MaxAttemptsError(e, i);
        }
        if (!canRetry(e)) {
          throw e;
        }
        backOff && (await sleep(backOff));
        if (options.backOffPolicy === BackOffPolicy.ExponentialBackOffPolicy) {
          backOff = Math.min(backOff * Math.pow(options.exponentialOption.multiplier, i), options.exponentialOption.maxInterval);
        }
      } 
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
  public retryCount: number;
  public originalError: Error; 
  constructor(originalError: Error, retryCount: number) {
    super(`Max retry reached: ${retryCount}, original error: ${originalError.message}`);
    this.originalError = originalError;
    this.retryCount = retryCount;
    Object.setPrototypeOf(this, MaxAttemptsError.prototype);
  }
}

export interface RetryOptions {
  maxAttempts: number;
  backOffPolicy?: BackOffPolicy;
  backOff?: number;
  doRetry?: (e: any) => boolean;
  value?: ErrorConstructor[];
  exponentialOption?: { maxInterval: number; multiplier: number };
  reraise?: boolean;
}

export enum BackOffPolicy {
  FixedBackOffPolicy = 'FixedBackOffPolicy',
  ExponentialBackOffPolicy = 'ExponentialBackOffPolicy'
}

export type DecoratorFunction = (target: Record<string, any>, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) => TypedPropertyDescriptor<any>;

