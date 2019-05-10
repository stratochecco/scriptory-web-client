import { BigNumber, Modulus } from 'asmcrypto.js/asmcrypto.all.es8';

import { AUTH_VERSION, MAX_VALUE_ITERATIONS, SRP_LEN } from '../constants';
import { openpgp } from '../openpgp';
import { expandHash, hashPassword } from '../passwords';
import { arrayToBinaryString, binaryStringToArray, decodeBase64, encodeBase64 } from '../utils';
import { getRandomValues } from '../random';
import { srpHasher } from './utils';

const ZERO_BN = BigNumber.fromNumber(0);
const ONE_BN = BigNumber.fromNumber(1);
const TWO_BN = BigNumber.fromNumber(2);

/**
 * Get the client secret. Loops until it finds a safe value.
 * @param {Number} len
 * @return {BigNumber}
 */
const getClientSecret = (len) => {
    const comparator = BigNumber.fromNumber(len * 2);

    for (let i = 0; i < MAX_VALUE_ITERATIONS; ++i) {
        const clientSecret = toBN(getRandomValues(new Uint8Array(len / 8)));

        if (clientSecret.compare(comparator) <= 0) {
            continue;
        }

        return clientSecret;
    }

    throw new Error('Could not find safe client value');
};

/**
 * Generate parameters.
 * @param {Object} params
 * @param {Number} params.len
 * @param {BigNumber} params.generator
 * @param {BigNumber} params.modulus
 * @param {Uint8Array} params.serverEphemeralArray
 * @return {Promise<{clientSecret, clientEphemeral, scramblingParam}>}
 */
const generateParameters = async ({ len, generator, modulus, serverEphemeralArray }) => {
    const clientSecret = getClientSecret(len);
    const clientEphemeral = modulus.power(generator, clientSecret);
    const clientEphemeralArray = fromBN(len, clientEphemeral);

    const clientServerHash = await srpHasher(
        openpgp.util.concatUint8Array([clientEphemeralArray, serverEphemeralArray])
    );
    const scramblingParam = toBN(clientServerHash);

    return {
        clientSecret,
        clientEphemeral,
        scramblingParam
    };
};

/**
 * Get parameters. Loops until it finds safe values.
 * @param {Number} len
 * @param {BigNumber} generator
 * @param {BigNumber} modulus
 * @param {Uint8Array} serverEphemeralArray
 * @return {Promise<{clientSecret, clientEphemeral, scramblingParam}>}
 */
const getParameters = async ({ len, generator, modulus, serverEphemeralArray }) => {
    for (let i = 0; i < MAX_VALUE_ITERATIONS; ++i) {
        const { clientSecret, clientEphemeral, scramblingParam } = await generateParameters({
            len,
            generator,
            modulus,
            serverEphemeralArray
        });

        if (scramblingParam.compare(ZERO_BN) === 0) {
            continue;
        }

        return {
            clientSecret,
            clientEphemeral,
            scramblingParam
        };
    }
    throw new Error('Could not find safe parameters');
};

/**
 * @param {Number} len - Size of the proof (bytes length)
 * @param {Uint8Array} modulus
 * @param {Uint8Array} hashedPassword
 * @param {Uint8Array} serverEphemeral
 * @return {Promise}
 */
export async function generateProofs(len, modulus, hashedPassword, serverEphemeral) {
    function toBN(arr) {
        const reversed = new Uint8Array(arr.length);
        for (let i = 0; i < arr.length; i++) {
            reversed[arr.length - i - 1] = arr[i];
        }
        return BigNumber.fromArrayBuffer(reversed);
    }

    function fromBN(bn) {
        const arr = bn.toBytes();
        const reversed = new Uint8Array(len / 8);
        for (let i = 0; i < arr.length; i++) {
            reversed[arr.length - i - 1] = arr[i];
        }
        return reversed;
    }

    const generator = BigNumber.fromNumber(2);

    let multiplier = toBN(
        await expandHash(arrayToBinaryString(openpgp.util.concatUint8Array([fromBN(generator), modulus])))
    );
    modulus = toBN(modulus);
    serverEphemeral = toBN(serverEphemeral);
    hashedPassword = toBN(hashedPassword);
    const modulusMinusOne = modulus.subtract(BigNumber.fromNumber(1));

    if (modulus.bitLength !== len) {
        return { Type: 'Error', Description: 'SRP modulus has incorrect size' };
    }
    modulus = new Modulus(modulus);
    multiplier = modulus.reduce(multiplier);

    if (multiplier.compare(BigNumber.fromNumber(1)) <= 0 || multiplier.compare(modulusMinusOne) >= 0) {
        return {
            Type: 'Error',
            Description: 'SRP multiplier is out of bounds'
        };
    }

    if (generator.compare(BigNumber.fromNumber(1)) <= 0 || generator.compare(modulusMinusOne) >= 0) {
        return { Type: 'Error', Description: 'SRP generator is out of bounds' };
    }

    if (serverEphemeral.compare(BigNumber.fromNumber(1)) <= 0 || serverEphemeral.compare(modulusMinusOne) >= 0) {
        return {
            Type: 'Error',
            Description: 'SRP server ephemeral is out of bounds'
        };
    }

    /* Unfortunately, this is too slow for common use

    // Check primality
    if (!new BN(2).toRed(reductionContext).redPow(modulusMinusOne).fromRed().eqn(1)) {
        return { "Type": "Error", "Description": "SRP modulus is not prime" };
    }

    // Check safe primality
    const halfModulus = modulus.shrn(1);
    const millerRabinRed = BN.red(halfModulus);
    for (var i = 0; i < 5; i++) {
        const base = toBN(webcrypto.getRandomValues(new Uint8Array(len / 8))).toRed(millerRabinRed);
        const power = base.redPow(halfModulus.shrn(1)).fromRed();
        if (!power.eqn(1) && !power.eq(halfModulus.subn(1))) {
            return { "Type": "Error", "Description": "SRP modulus is not a safe prime" };
        }
    }
*/

    let clientSecret, clientEphemeral, scramblingParam;
    do {
        do {
            clientSecret = toBN(getRandomValues(new Uint8Array(len / 8)));
        } while (clientSecret.compare(BigNumber.fromNumber(len * 2)) <= 0); // Very unlikely

        clientEphemeral = modulus.power(generator, clientSecret);
        scramblingParam = toBN(
            await expandHash(
                arrayToBinaryString(openpgp.util.concatUint8Array([fromBN(clientEphemeral), fromBN(serverEphemeral)]))
            )
        );
    } while (scramblingParam.compare(BigNumber.fromNumber(0)) === 0); // Very unlikely

    let subtracted = serverEphemeral.subtract(
        modulus.reduce(modulus.power(generator, hashedPassword).multiply(multiplier))
    );
    if (subtracted.compare(BigNumber.fromNumber(0)) < 0) {
        subtracted = subtracted.add(modulus);
    }
    const exponent = scramblingParam
        .multiply(hashedPassword)
        .add(clientSecret)
        .divide(modulus.subtract(BigNumber.fromNumber(1))).remainder;
    const sharedSession = modulus.power(subtracted, exponent);

    const clientProof = await expandHash(
        arrayToBinaryString(
            openpgp.util.concatUint8Array([fromBN(clientEphemeral), fromBN(serverEphemeral), fromBN(sharedSession)])
        )
    );
    const expectedServerProof = await expandHash(
        arrayToBinaryString(
            openpgp.util.concatUint8Array([fromBN(clientEphemeral), clientProof, fromBN(sharedSession)])
        )
    );

    return {
        type: 'Success',
        clientEphemeral: fromBN(clientEphemeral),
        clientProof: clientProof,
        expectedServerProof
    };
}

/**
 * @param {Number} len
 * @param {Uint8Array} hashedPassword
 * @param {Uint8Array} modulus
 * @return {Uint8Array}
 */
const generateVerifier = (len, hashedPassword, modulus) => {
    function toBN(arr) {
        const reversed = new Uint8Array(arr.length);
        for (let i = 0; i < arr.length; i++) {
            reversed[arr.length - i - 1] = arr[i];
        }
        return BigNumber.fromArrayBuffer(reversed);
    }

    function fromBN(len, bn) {
        const arr = bn.toBytes();
        const reversed = new Uint8Array(len / 8);
        for (let i = 0; i < arr.length; i++) {
            reversed[arr.length - i - 1] = arr[i];
        }
        return reversed;
    }

    const generator = TWO_BN;

    const modulusBn = new Modulus(toBN(modulus));
    const hashedPasswordBn = toBN(hashedPassword);

    const verifier = modulusBn.power(generator, hashedPasswordBn);
    return fromBN(len, verifier);
};

/**
 * @param {String} modulus - Server modulus
 * @param {String} username
 * @param {String} password
 * @param {String} salt - Optional salt
 * @param {Number} version - Auth version
 * @return {Promise}
 */
export const getRandomSrpVerifier = async (modulus, { username, password, salt = null }, version = AUTH_VERSION) => {
    const chosenSalt = salt ? decodeBase64(salt) : arrayToBinaryString(getRandomValues(new Uint8Array(14)));
    const modulusArray = binaryStringToArray(decodeBase64(modulus));
    const hashedPassword = await hashPassword({
        version,
        username,
        password,
        salt: chosenSalt,
        modulus: modulusArray
    });

    const verifier = generateVerifier(SRP_LEN, hashedPassword, modulusArray);

    return {
        version: version,
        salt: encodeBase64(chosenSalt),
        verifier: encodeBase64(arrayToBinaryString(verifier))
    };
};
