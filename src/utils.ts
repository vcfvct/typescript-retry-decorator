// wrap the native setTimeout with Promise so it can be used with `await`.
export const sleep: Function = (ms?: number) => new Promise(resolve => setTimeout(resolve, ms));

export const throwError: Function = (msg: string) => { throw new Error(msg); };