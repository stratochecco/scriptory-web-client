import { openpgp } from './openpgp';

const localAtob = typeof atob === 'undefined' ? (str) => Buffer.from(str, 'base64').toString('binary') : atob;
const localBtoa = typeof btoa === 'undefined' ? (str) => Buffer.from(str, 'binary').toString('base64') : btoa;

const ifDefined = (cb) => (input) => {
    if (input !== undefined) {
        return cb(input);
    }
};

export const encodeUtf8 = ifDefined((input) => unescape(encodeURIComponent(input)));
export const decodeUtf8 = ifDefined((input) => decodeURIComponent(escape(input)));
export const encodeBase64 = ifDefined((input) => localBtoa(input).trim());
export const decodeBase64 = ifDefined((input) => localAtob(input.trim()));
export const encodeUtf8Base64 = ifDefined((input) => encodeBase64(encodeUtf8(input)));
export const decodeUtf8Base64 = ifDefined((input) => decodeUtf8(decodeBase64(input)));

export const binaryStringToArray = (args) => openpgp.util.str_to_Uint8Array(args);
export const arrayToBinaryString = (args) => openpgp.util.Uint8Array_to_str(args);
export const binaryStringToHex = (args) => openpgp.util.str_to_hex(args);
export const hexToBinaryString = (args) => openpgp.util.hex_to_str(args);
export const hexToArray = (args) => openpgp.util.hex_to_Uint8Array(args);
export const arrayToHex = (args) => openpgp.util.Uint8Array_to_hex(args);
export const concatArrays = (args) => openpgp.util.concatUint8Array(args);

export function readArmoredMessage(armored) {
    return openpgp.message.readArmored(armored);
}
