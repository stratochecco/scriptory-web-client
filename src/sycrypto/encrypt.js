import { openpgp } from './openpgp';

export function encryptFromObject(options) {
    options.message = openpgp.message.fromText(JSON.stringify(options.message));
    options.compression = options.compression ? openpgp.enums.compression.zlib : undefined;

    return openpgp.encrypt(options);
}
