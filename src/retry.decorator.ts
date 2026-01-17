import { sleep } from './utils';

export interface StandardDecoratorContext {
  kind?: string;
  name?: string | symbol;
}

export type LegacyDecoratorFunction = (
  target: Record<string, any>,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<any>
) => TypedPropertyDescriptor<any> | void;

export type StandardMethodDecorator = (
  value: (...args: any[]) => any,
  context: StandardDecoratorContext
) => ((...args: any[]) => any) | void;

export type RetryableDecorator = LegacyDecoratorFunction & StandardMethodDecorator;

// Backwards-compat alias (pre-TS5 types)
export type DecoratorFunction = LegacyDecoratorFunction;

/**
 * Retry decorator (legacy + TypeScript 5 standard decorators).
 *
 * In legacy/"experimentalDecorators" mode, it's applied as
 *   (target, propertyKey, descriptor)
 *
 * In TS5+ standard decorators mode, it's applied as
 *   (value, context)
 */
export function Retryable(options: RetryOptions): RetryableDecorator {
  function setExponentialBackOffPolicyDefault(): void {
    if (!options.backOff) {
      options.backOff = 1000;
    }
    options.exponentialOption = {
      ...{ maxInterval: 2000, multiplier: 2 },
      ...options.exponentialOption,
    };
  }

  function applyBackoffStrategy(baseBackoff: number): number {
    const { backoffStrategy } = options.exponentialOption ?? {};
    if (backoffStrategy === ExponentialBackoffStrategy.EqualJitter) {
      return baseBackoff / 2 + (Math.random() * baseBackoff / 2);
    }
    if (backoffStrategy === ExponentialBackoffStrategy.FullJitter) {
      return Math.random() * baseBackoff;
    }
    return baseBackoff;
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

  async function retryAsync(fn: () => any, args: any[], maxAttempts: number, backOff?: number): Promise<any> {
    try {
      return await fn.apply(this, args);
    } catch (e) {
      if (--maxAttempts < 0) {
        if ((typeof options.useConsoleLogger !== 'boolean' || options.useConsoleLogger) && e?.message) {
          console.error(e.message);
        }
        if (options.useOriginalError) {
          throw e;
        }

        const maxAttemptsErrorInstance = new MaxAttemptsError(e?.message);
        if (e?.stack) {
          maxAttemptsErrorInstance.stack = e.stack;
        }

        throw maxAttemptsErrorInstance;
      }
      if (!canRetry(e)) {
        throw e;
      }
      if (backOff) {
        await sleep(applyBackoffStrategy(backOff));

        if (options.exponentialOption && options.backOffPolicy === BackOffPolicy.ExponentialBackOffPolicy) {
          backOff = Math.min(
            backOff * options.exponentialOption.multiplier,
            options.exponentialOption.maxInterval,
          );
        }
      }
      return retryAsync.apply(this, [fn, args, maxAttempts, backOff]);
    }
  }

  function wrapWithRetry(originalFn: (...args: any[]) => any, name?: string | symbol): (...args: any[]) => Promise<any> {
    if (options.backOffPolicy === BackOffPolicy.ExponentialBackOffPolicy) {
      setExponentialBackOffPolicyDefault();
    }

    return async function(...args: any[]) {
      try {
        return await retryAsync.apply(this, [originalFn, args, options.maxAttempts, options.backOff]);
      } catch (e) {
        if (e instanceof MaxAttemptsError) {
          const retryForName = typeof name === 'symbol' ? name.toString() : name;
          const msgPrefix = `Failed for '${retryForName ?? originalFn.name}' for ${options.maxAttempts} times.`;
          e.message = e.message ? `${msgPrefix} Original Error: ${e.message}` : msgPrefix;
        }
        throw e;
      }
    };
  }

  const decorator: RetryableDecorator = function(...decoratorArgs: any[]): any {
    // Legacy TypeScript decorators: (target, propertyKey, descriptor)
    if (decoratorArgs.length === 3) {
      const [, propertyKey, descriptor] = decoratorArgs as [Record<string, any>, string | symbol, TypedPropertyDescriptor<any>];
      const originalFn = descriptor.value;

      descriptor.value = wrapWithRetry(originalFn, propertyKey);
      return descriptor;
    }

    // TypeScript 5 standard decorators: (value, context)
    const [value, context] = decoratorArgs as [(...args: any[]) => any, StandardDecoratorContext];
    return wrapWithRetry(value, context?.name);
  } as RetryableDecorator;

  return decorator;
}

export class MaxAttemptsError extends Error {
  code = '429';
  /* if target is ES5, need the 'new.target.prototype'
  constructor(msg?: string) {
      super(msg)
      Object.setPrototypeOf(this, new.target.prototype)
    } */
}

interface ConstructableError {
  new (...args: any[]): Error;
}

export interface RetryOptions {
  backOffPolicy?: BackOffPolicy;
  backOff?: number;
  doRetry?: (e: any) => boolean;
  exponentialOption?: {
    maxInterval: number;
    multiplier: number;
    /**
     * Optional.  If provided, the backoff time will include jitter using the desired strategy.
     * For more information, see https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
     */
    backoffStrategy?: ExponentialBackoffStrategy;
  };
  maxAttempts: number;
  value?: ConstructableError[];
  useConsoleLogger?: boolean;
  useOriginalError?: boolean;
}

export enum BackOffPolicy {
  FixedBackOffPolicy = 'FixedBackOffPolicy',
  ExponentialBackOffPolicy = 'ExponentialBackOffPolicy'
}

/**
 * Represents different strategies for applying jitter to backoff times.
 * @see https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
 */
export enum ExponentialBackoffStrategy {
  /**
   * The backoff time will be (base backoff time) * (random number between 0 and 1).
   */
  FullJitter = 'FullJitter',
  /**
   * The backoff time will be (base backoff time / 2) + (random number between 0 and (base backoff time / 2)).
   */
  EqualJitter = 'EqualJitter',
}

