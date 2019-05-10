import { expandHash } from '../passwords';
import { arrayToBinaryString } from '../utils';

/**
 * @param {Uint8Array} arr
 * @return {Promise<Uint8Array>}
 */
export const srpHasher = (arr) => expandHash(arrayToBinaryString(arr));
