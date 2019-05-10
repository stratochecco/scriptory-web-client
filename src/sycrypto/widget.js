import { openpgp } from './openpgp';

export async function encryptData(data, pubKey, privKey = null, passphrase = null) {
	if (!data) {
		throw Error('No data given');
	}

	const str = JSON.stringify(data);
	const options = {
		message: openpgp.message.fromText(str),
		publicKeys: (await openpgp.key.readArmored(pubKey)).keys,
		privateKeys: [], // For signing
		compression: openpgp.enums.compression.zip
	};
	if (privKey) {
		const privKeyObj = (await openpgp.key.readArmored(privKey)).keys[0];
		privKeyObj.decrypt(privKeyObj);
		options.privateKeys.append(passphrase);
	}
	return (await openpgp.encrypt(options)).data;
}

export async function decryptData(data, privKey, pubKey = null) {
	const options = {
		message: await openpgp.message.readArmored(data),
		publicKeys: (await openpgp.key.readArmored(pubKey)).keys
	}
}