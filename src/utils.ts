// wrap the native setTimeout with Promise so it can be used with `await`.
export const sleep: (ms?: number) => void = (ms?: number) => new Promise(resolve => setTimeout(resolve, ms));
