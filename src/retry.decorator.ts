import { sleep } from './utils.js';

type AnyFunction = (...args: any[]) => any;
type RetryableFunction<T extends AnyFunction> = (
  this: ThisParameterType<T>,
  ...args: Parameters<T>
) => Promise<Awaited<ReturnType<T>>>;

export interface StandardDecoratorContext {
  kind?: string;
  name?: string | symbol;
  static?: boolean;
  private?: boolean;
}

export type LegacyDecoratorFunction = (
  target: Record<string, any>,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<any>
) => TypedPropertyDescriptor<any> | void;

export type StandardMethodDecorator = (
  value: AnyFunction,
  context: StandardDecoratorContext
) => AnyFunction | void;

export interface RetryableDecorator {
  <T extends AnyFunction>(value: T, context: StandardDecoratorContext): RetryableFunction<T>;
  <T extends AnyFunction>(
    target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T> | void;
}

// Backwards-compat alias (pre-TS5 types)
export type DecoratorFunction = LegacyDecoratorFunction;

/**
 * Retry decorator (legacy + TypeScript 5/7 standard decorators).
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

  async function retryAsync<TArgs extends unknown[], TReturn>(
    this: unknown,
    fn: (this: unknown, ...args: TArgs) => TReturn,
    args: TArgs,
    maxAttempts: number,
    backOff?: number,
  ): Promise<Awaited<TReturn>> {
    try {
      return (await fn.call(this, ...args)) as Awaited<TReturn>;
    } catch (e) {
      const error = e as Error & { message?: string; stack?: string };

      if (--maxAttempts < 0) {
        if ((typeof options.useConsoleLogger !== 'boolean' || options.useConsoleLogger) && error?.message) {
          console.error(error.message);
        }
        if (options.useOriginalError) {
          throw error;
        }

        const maxAttemptsErrorInstance = new MaxAttemptsError(error?.message);
        if (error?.stack) {
          maxAttemptsErrorInstance.stack = error.stack;
        }

        throw maxAttemptsErrorInstance;
      }
      if (!canRetry(error)) {
        throw error;
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
      return (retryAsync as any).call(this, fn, args, maxAttempts, backOff) as Promise<Awaited<TReturn>>;
    }
  }

  function wrapWithRetry<T extends AnyFunction>(originalFn: T, name?: string | symbol): RetryableFunction<T> {
    if (options.backOffPolicy === BackOffPolicy.ExponentialBackOffPolicy) {
      setExponentialBackOffPolicyDefault();
    }

    return async function(this: ThisParameterType<T>, ...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> {
      try {
        return await ((retryAsync as any).call(this, originalFn, args, options.maxAttempts, options.backOff) as Promise<Awaited<ReturnType<T>>>);
      } catch (e) {
        if (e instanceof MaxAttemptsError) {
          const retryForName = typeof name === 'symbol' ? name.toString() : name;
          const msgPrefix = `Failed for '${retryForName ?? originalFn.name}' for ${options.maxAttempts} times.`;
          e.message = e.message ? `${msgPrefix} Original Error: ${e.message}` : msgPrefix;
        }
        throw e;
      }
    } as RetryableFunction<T>;
  }

  const decorator: RetryableDecorator = function(...decoratorArgs: any[]): any {
    // Legacy TypeScript decorators: (target, propertyKey, descriptor)
    if (decoratorArgs.length === 3) {
      const [, propertyKey, descriptor] = decoratorArgs as [Record<string, any>, string | symbol, TypedPropertyDescriptor<AnyFunction>];
      const originalFn = descriptor.value;

      if (originalFn) {
        descriptor.value = wrapWithRetry(originalFn, propertyKey);
      }
      return descriptor;
    }

    // TypeScript 5/7 standard decorators: (value, context)
    const [value, context] = decoratorArgs as [AnyFunction, StandardDecoratorContext];
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

