import { openpgp } from './openpgp';

/**
 * Generates an ed25519 keypair using OpenPGP.
 * @param username
 * @param email
 * @param passphrase
 * @returns {Promise<any>}
 */
export function generateKeypair({ username, passphrase }) {
    return new Promise((resolve, reject) => {
        const options = {
            userIds: [{ name: username, email: 'not_for_email_use@domain.tld' }],
            curve: 'ed25519',
            passphrase: passphrase
        };
        openpgp.generateKey(options).then(function(key) {
            resolve(key);
        });
    });
}

/**
 * Read and overwrite armored keys found in the given object.
 * @param key
 * @returns {Promise<void>}
 */
export async function deArmor(key) {
    if (key.pub_key) {
        key.pub_key = (await openpgp.key.readArmored(key.pub_key)).keys[0];
    }
    if (key.rev_cert) {
        key.rev_cert = (await openpgp.key.readArmored(key.rev_cert)).keys[0];
    }
    if (key.enc_priv_key) {
        key.enc_priv_key = (await openpgp.key.readArmored(key.enc_priv_key)).keys[0];
    }

    return Promise.resolve(key);
}

export function reformatKey(privKey, user, passphrase = '') {
    if (passphrase.length === 0) {
        return Promise.reject(new Error('Missing private key passphrase.'));
    }

    const options = {
        privateKey: privKey,
        userIds: [user],
        passphrase
    };

    return openpgp.reformatKey(options).then((reformattedKey) => reformattedKey.privateKeyArmored);
}
