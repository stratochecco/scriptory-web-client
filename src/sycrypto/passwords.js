import bcrypt from 'bcryptjs';
import { openpgp } from './openpgp';
import { getRandomValues } from './random';
import { arrayToBinaryString, binaryStringToArray, decodeBase64, encodeBase64 } from './utils';

const BCRYPT_PREFIX = '$2y$10$';

async function bcryptHelper(str, salt) {
    return new Promise((resolve, reject) => {
        bcrypt.hash(str, salt, (err, hash) => {
            if (typeof hash !== 'string') {
                reject(err);
            } else {
                resolve(hash);
            }
        });
    });
}

/**
 * Expand a hash
 * @param {String} str
 * @returns {Promise<Uint8Array>}
 */
export const expandHash = async (str) => {
    const list = await Promise.all([
        openpgp.crypto.hash.sha512(binaryStringToArray(str + '\x00')),
        openpgp.crypto.hash.sha512(binaryStringToArray(str + '\x01')),
        openpgp.crypto.hash.sha512(binaryStringToArray(str + '\x02')),
        openpgp.crypto.hash.sha512(binaryStringToArray(str + '\x03'))
    ]);

    return openpgp.util.concatUint8Array(list);
};

/**
 * Generate salt for a key.
 * @returns {String}
 */
export const generateKeySalt = () => {
    return encodeBase64(arrayToBinaryString(getRandomValues(new Uint8Array(16))));
};

/**
 * Compute the key password.
 * @param {String} password plaintext password
 * @param {String} salt Base 64 encoded string
 * @returns {Promise<String>}
 */
export const computeKeyPassword = async (password, salt) => {
    let saltBinary = decodeBase64(salt);
    if (saltBinary.length === 14) {
        saltBinary += 'sy';
    }
    saltBinary = binaryStringToArray(saltBinary);
    const hash = await bcryptHelper(password, BCRYPT_PREFIX + bcrypt.encodeBase64(saltBinary, 16));
    // Remove bcrypt prefix and salt (first 29 characters)
    return hash.slice(29);
};

/**
 * Hash password in version 1.
 * @param {String} password
 * @param {String} salt
 * @param {Uint8Array} modulus
 * @returns {Promise<Uint8Array>}
 */
const hashPassword1 = (password, salt, modulus) => {
    const saltBinary = binaryStringToArray(salt + 'sy');
    return bcryptHelper(password, BCRYPT_PREFIX + bcrypt.encodeBase64(saltBinary, 16)).then((unexpandedHash) => {
        return expandHash(unexpandedHash + arrayToBinaryString(modulus));
    });
};

/**
 * Hash a password.
 * @param {Number} version
 * @param {String} password
 * @param {String} salt
 * @param {Uint8Array} modulus
 * @returns {Promise<Uint8Array>}
 */
export const hashPassword = ({ version, password, salt, modulus }) => {
    if (version === 1) {
        return hashPassword1(password, salt, modulus);
    }

    throw new Error('Unsupported auth version');
};

/*export function hashPassword(password, salt) {
    return new Promise((resolve, reject) => {
        const worker = new Worker('/js/argon2-worker/argon2-worker.js');
        worker.onmessage = (evt) => {
            if (evt.data === 'Loaded') {
                worker.postMessage({ password, salt });
            } else {
                worker.terminate();

                if (evt.data.response === 'resolve') {
                    resolve(evt.data.result);
                } else {
                    reject(evt.data.error);
                }
            }
        };
    });
}*/
