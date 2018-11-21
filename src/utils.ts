import * as util from 'util';

// wrap the native setTimeout with Promise so it can be used with `await`.
export const sleep: Function = util.promisify(setTimeout);

export const throwError: Function = (msg: string) => { throw new Error(msg); };