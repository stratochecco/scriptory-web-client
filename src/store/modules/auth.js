import _ from 'lodash';
import { AUTH_TOKEN_KEY, PASSWORD_HASH_KEY, RM_STORAGE, RM_STORAGE_KEY, STORAGE_PROVIDERS } from "../../constants";
import authResource from '../../api/authResource';
import {
    arrayToBinaryString,
    arrayToHex,
    binaryStringToArray,
    decodeBase64,
    decryptToObject,
    encodeBase64,
    encryptFromObject,
    generateProofs,
    hashPassword,
    readArmoredMessage,
    SRP_LEN
} from '../../sycrypto/sycrypto';
import secureSessionStorage from '../../secureSessionStorage';
import userResource from '../../api/userResource';

const storages = {
    session: secureSessionStorage(),
    local: global.window.localStorage
};

const defaultState = () => {
    return {
        rm: storages.local.getItem(RM_STORAGE_KEY) || 'local',
        rmStorage: storages[storages.local.getItem(RM_STORAGE_KEY)] || storages['local'],
        authInfo: {},
        user: null
    };
};

const state = defaultState();

const actions = {
    usernameAvailable({ commit }, username) {
        return authResource.usernameAvailable(username);
    },
    emailAvailable({ commit }, email) {
        return authResource.emailAvailable(email);
    },
    resetUser({ commit }) {
        commit('assignAuthInfo', null);
        commit('setEncKeypairs', [], { root: true });
        commit('setKeypairs', [], { root: true });
        commit('deletePasswordHash');
        commit('deleteAuthToken');
        commit('setUser', null);

        return Promise.resolve();
    },
    signupInfo({ commit }) {
        return authResource.signupInfo().then((res) => {
            commit('assignAuthInfo', {
                modulusUuid: res.data.modulus_uuid,
                modulus: res.data.modulus
            });
        });
    },
    signup({ commit }, user) {
        return authResource.signup(user);
    },
    verifyEmail({ commit }, token) {
        return authResource.verifyEmail(token);
    },
    loginInfo({ commit }, loginString) {
        return authResource.loginInfo({ login_string: loginString }).then((res) => {
            commit('assignAuthInfo', {
                srpSessionId: res.data.srp_session,
                modulus: res.data.modulus,
                salt: res.data.salt,
                serverEphemeral: res.data.server_ephemeral,
                version: res.data.version
            });

            return res.data;
        });
    },
    async getSrp({ commit, dispatch, state }, { loginString, password, options = [] }) {
        const modulus = binaryStringToArray(decodeBase64(state.authInfo.modulus));
        const serverEphemeral = binaryStringToArray(decodeBase64(state.authInfo.serverEphemeral));
        const hashedPassword = await hashPassword({
            version: state.authInfo.version,
            password,
            salt: decodeBase64(state.authInfo.salt),
            modulus: modulus
        });

        const { clientEphemeral, clientProof, expectedServerProof } = await generateProofs(
            SRP_LEN,
            modulus,
            hashedPassword,
            serverEphemeral
        );

        const tryAuth = await authResource.auth({
            srp_session: state.authInfo.srpSessionId,
            client_ephemeral: encodeBase64(arrayToBinaryString(clientEphemeral)),
            client_proof: encodeBase64(arrayToBinaryString(clientProof)),
            login_string: loginString,
            Options: options
        });

        commit('assignAuthInfo', null);
        if (tryAuth.auth.token) {
            commit('setAuthToken', tryAuth.auth.token);
        }

        if (arrayToHex(expectedServerProof) !== decodeBase64(tryAuth.data.server_proof)) {
            dispatch('logout');
            throw new Error(
                `Server proof mismatch. This should never happen and keep the session may be dangerous. Please try again. If the problem persists report it via the support page!`
            );
        }

        return tryAuth;
    },
    logout({ commit, dispatch, state, getters }) {
        return authResource.logout(getters.authToken()).then(() => {
            return dispatch('resetUser');
        });
    },
    readSecrets({ commit, state, rootGetters }) {
        return new Promise((resolve, reject) => {
            (async () => {
                try {
                    const defaultKp = rootGetters['auth/defaultKpN'];
                    if (!state.user.secrets || state.user.secrets === 'null') {
                        reject(false);
                    }
                    const sec = await readArmoredMessage(state.user.secrets);
                    const options = {
                        message: sec,
                        publicKeys: [rootGetters['keypair'](defaultKp).pub_key],
                        privateKeys: [rootGetters['keypair'](defaultKp).priv_key]
                    };
                    commit('storageProviders/mergeToState', await decryptToObject(options), { root: true });
                } catch (e) {
                    reject(e);
                }
                resolve(true);
            })();
        });
    },
    updateSecrets({ commit, state, rootGetters }, obj) {
        if (!state.user) {
            return Promise.reject('User is undefined.');
        }
        commit('assignSecrets', obj);
        const defaultKp = rootGetters['auth/defaultKpN'];
        const options = {
            message: state.user.secrets,
            publicKeys: [rootGetters['keypair'](defaultKp).pub_key],
            privateKeys: [rootGetters['keypair'](defaultKp).priv_key]
        };
        return encryptFromObject(options).then((enc) => {
            return userResource.updateSecrets({ Secrets: enc.data });
        });
    },
    mergeConfig({ commit, state }, obj) {
        if (!state.user) {
            return Promise.reject('User is undefined.');
        }
        commit('mergeConfig', obj);

        return userResource.updateConfig({ Config: state.user.config });
    }
};

const mutations = {
    setRMStorage(state, rm) {
        if (Object.values(RM_STORAGE).indexOf(rm) < 0) {
            throw Error("Invalid 'RM_STORAGE' value.");
        }
        state.rm = rm;
        state.rmStorage = storages[rm];
        storages.local.setItem(RM_STORAGE_KEY, rm);
    },
    assignAuthInfo(state, info) {
        if (info === null) {
            _.forIn(state.authInfo, (value, key) => _.unset(state.authInfo, key));
        } else {
            _.assign(state.authInfo, info);
        }
    },
    setUser(state, user) {
        state.user = user;
    },
    setAuthToken(state, token) {
        state.rmStorage.setItem(AUTH_TOKEN_KEY, token);
    },
    deleteAuthToken(state) {
        state.rmStorage.removeItem(AUTH_TOKEN_KEY);
    },
    setPasswordHash(state, hash) {
        state.rmStorage.setItem(PASSWORD_HASH_KEY, hash);
    },
    deletePasswordHash(state) {
        state.rmStorage.removeItem(PASSWORD_HASH_KEY);
    },
    assignSecrets(state, obj) {
        if (state.user && typeof state.user.secrets !== 'object') {
            state.user.secrets = {};
        }
        state.user.secrets = _.cloneDeep(_.assign(state.user.secrets, obj)); // Clone to guarantee reactivity
    },
    mergeConfig(state, obj) {
        if (state.user && typeof state.user.config !== 'object') {
            state.user.config = {};
        }
        state.user.config = _.cloneDeep(_.merge(state.user.config, obj)); // Clone to guarantee reactivity
    }
};

const getters = {
    isAuthenticated: (state) => () => {
        return state.user !== null && state.rmStorage.getItem(AUTH_TOKEN_KEY) !== null;
    },
    notVerified: (state) => {
        if (!state.user) {
            return false;
        }
        return !state.user.verified;
    },
    user: (state) => {
        return state.user;
    },
    username: (state) => {
        return state.user && state.user.username ? state.user.username : undefined;
    },
    authToken: (state) => () => {
        if (!state.rmStorage) {
            return null;
        }
        return state.rmStorage.getItem(AUTH_TOKEN_KEY);
    },
    passwordHash: (state) => () => {
        if (!state.rmStorage) {
            return null;
        }
        return state.rmStorage.getItem(PASSWORD_HASH_KEY);
    },
    userConfig: (state) => {
        return state.user && state.user.config ? state.user.config : {};
    },
    defaultKpN: (state, getters) => {
        return getters.userConfig.defaultKp || 1;
    },
    defaultSP: (state, getters) => {
        return getters.userConfig.defaultSP || Object.keys(STORAGE_PROVIDERS)[0];
    }
};

export default {
    namespaced: true,
    state,
    actions,
    mutations,
    getters
};
