import { setInstance, setConfig, openpgp } from './openpgp';

export const init = (openpgp) => {
    if (!openpgp) {
        throw new Error('OpenPGP required');
    }
    setInstance(openpgp);
    setConfig(openpgp);
};

/**
 * Create OpenPGP worker.
 * @param path
 * @param n
 */
export const createWorker = ({ path = '', n }) => {
    if (!path) {
        throw new Error('Path to worker required');
    }
    const { hardwareConcurrency = 1 } = window.navigator || {};
    openpgp.initWorker({ path, n: n || hardwareConcurrency });
};

init(window.openpgp);
createWorker({ path: '/js/openpgpjs/dist/openpgp.worker.min.js' });

export { SRP_LEN } from './constants';

export { computeKeyPassword, expandHash, generateKeySalt, hashPassword } from './passwords';

export { generateProofs, getRandomSrpVerifier } from './srp/srp';

export { deArmor, generateKeypair, reformatKey } from './keys.js';

export {
    arrayToHex,
    decodeUtf8Base64,
    encodeUtf8Base64,
    encodeUtf8,
    decodeUtf8,
    encodeBase64,
    decodeBase64,
    concatArrays,
    arrayToBinaryString,
    binaryStringToArray,
    hexToArray,
    hexToBinaryString,
    binaryStringToHex,
    readArmoredMessage
} from './utils';

export { encryptFromObject } from './encrypt';
export { decryptToObject } from './decrypt';
