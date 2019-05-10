import { openpgp } from './openpgp';

export function decryptToObject(options) {
    return openpgp.decrypt(options)
        .then((decr) => {
           return Promise.resolve(JSON.parse(decr.data));
        })
        .catch((e) => {
            if (e.message === 'CFB decrypt: invalid key' && options.passwords && options.passwords.length) {
                return Promise.reject(new Error('Incorrect password')); // Bad password, reject without Error object
            }
            return Promise.reject(e);
        });
    /*try {
        return Promise.resolve(JSON.parse((await openpgp.decrypt(options)).data));
    } catch (err) {
        if (err.message === 'CFB decrypt: invalid key' && options.passwords && options.passwords.length) {
            return Promise.reject(new Error('Incorrect password')); // Bad password, reject without Error object
        }
        return Promise.reject(err);
    }*/
}
