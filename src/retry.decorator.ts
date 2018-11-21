import { throwError, sleep } from './utils';

/**
 * retry decorator which is nothing but a high order function wrapper
 *
 * @param options the 'RetryOptions'
 */
export function Retry(options: RetryOptions): Function {
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
    descriptor.value = async function (...args: any[]) {
      try {
        return await retryAsync.apply(this, [originalFn, args, options.retries, options.backOff]);
      } catch (e) {
        e.message = `Failed for '${propertyKey}' for ${options.retries} times.`;
        throw e;
      }
    };
    return descriptor;
  };
}

async function retryAsync(fn: Function, args: any[], retries: number, backOff?: number): Promise<any> {
  try {
    return await fn.apply(this, args);
  } catch {
    --retries < 0 && throwError();
    backOff && await sleep(backOff);
    return retryAsync.apply(this, [fn, args, retries, backOff]);
  }
}

export interface RetryOptions {
  retries: number;
  backOff?: number;
}
