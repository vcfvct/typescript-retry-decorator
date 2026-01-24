// wrap the native setTimeout with Promise so it can be used with `await`.
export const sleep = (ms?: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
