import Vue from 'vue';
import Vuex from 'vuex';

import auth from './modules/auth';
import profile from './modules/profile';
import storageProviders from './modules/storageProviders';
import userResource from '../api/userResource';
import { CODES, PRIV_KEYS_PASS_KEY } from "../constants";
import { computeKeyPassword, deArmor } from '../sycrypto/sycrypto.js';

Vue.use(Vuex);

const baseUrl = global.window.appConfig.appBaseUrl || '/';

const store = new Vuex.Store({
    modules: {
        auth,
        profile,
        storageProviders
    },

    state: {
        appTitle: global.window.appConfig.appTitle || 'Scriptory',
        baseUrl: baseUrl.endsWith('/') ? baseUrl : baseUrl + '/',
        redirect: null,
        encKeypairs: [],
        keypairs: []
    },

    actions: {
        loginRedirect({ commit }, { to, next }) {
            commit('setLoginRedirect', to);
            next('/u/login');
        },
        consumeLoginRedirect({ commit, state }) {
            const redirect = state.redirect;
            commit('setLoginRedirect', null);

            return redirect;
        },
        lostPassword({ commit }, data) {
            return userResource.lostPassword(data);
        },
        resetPasswordInfo({ commit }, data) {
            return userResource.resetPasswordInfo(data);
        },
        resetPassword({ commit }, data) {
            return userResource.resetPassword(data);
        },
        fetchUserInfo({ commit, dispatch, state, getters }) {
            return userResource.info().then((data) => {
                const sec = state.auth.user && state.auth.user.secrets ? state.auth.user.secrets : null;

                commit('auth/setUser', data.user);

                // Some checks i hope won't be necessary
                state.auth.user.config = state.auth.user.config || {};
                state.auth.user.config.defaultKp = state.auth.user.config.defaultKp || 1;

                // Try to fetch and decrypt keypairs and secrets if either we don't have at least a decrypted kp or the secrets have changed
                if (!state.keypairs[0] || (data.user.secrets && data.user.secrets !== sec)) {
                    return dispatch('fetchKeypairs', { username: getters['auth/username'], widgets: [] })
                        .catch((e) => {
                            return Promise.reject(_.assign(CODES.RETRIEVE_KEYPAIRS_ERROR, { error: e }));
                        })
                        .then(() => {
                            return dispatch('decryptKeypairs')
                                .catch((e) => {
                                    return Promise.reject(_.assign(CODES.DECRYPT_KEYPAIRS_ERROR, { error: e }));
                                });
                        })
                        .then(() => {
                            if (getters['keypair'](getters['auth/defaultKpN']) && (data.user.secrets && data.user.secrets !== sec)) {
                                return dispatch('auth/readSecrets')
                                    .catch((e) => {
                                        return Promise.reject(_.assign(CODES.DECRYPT_SECRETS_ERROR, { error: e }));
                                    });
                            }
                        });
                }
            });
        },
        fetchKeypairs({ commit }, wanted) {
            return userResource.keypairs(wanted).then((res) => {
                commit('setEncKeypairs', res);
            });
        },
        decryptKeypairs({ commit, dispatch, state, getters }) {
            const pHash = getters['auth/passwordHash']();
            if (!pHash) {
                return Promise.reject('Your password hash is not present. Please try to log in again.');
            }

            const promises = [];
            for (const k of state.encKeypairs) {
                const p = Promise.all([deArmor(_.cloneDeep(k)), computeKeyPassword(pHash, k.salt)])
                    .then((res) => {
                        if (!res[0].enc_priv_key) {
                            // Could not deArmor. Something catastrophic must be happened to that key
                            return res[0];
                        }
                        res[0].priv_key = _.cloneDeep(res[0].enc_priv_key);
                        return res[0].priv_key.decrypt(res[1]).then(() => {
                            return res[0];
                        });
                    })
                    .catch((e) => {
                        console.warn(e);
                        return null;
                    });

                promises.push(p);
            }

            return Promise.all(promises).then((res) => {
                const kk = res.filter((r) => !!r);
                commit('setKeypairs', kk);

                return kk;
            });
        }
    },

    mutations: {
        setLoginRedirect(state, to) {
            state.redirect = (to && to.fullPath) || null;
        },
        setKeysPassphrase(state, keypair) {
            state.auth.rmStorage.setItem(PRIV_KEYS_PASS_KEY, keypair);
        },
        deleteKeysPassphrase(state) {
            state.auth.rmStorage.removeItem(PRIV_KEYS_PASS_KEY);
        },
        setEncKeypairs(state, keypairs) {
            state.encKeypairs = keypairs;
        },
        setKeypairs(state, keypairs) {
            state.keypairs = keypairs;
        }
    },

    getters: {
        appTitle: (state) => {
            return state.appTitle;
        },
        baseUrl: (state) => {
            return state.baseUrl;
        },
        redirect: (state) => {
            return state.redirect;
        },
        keypair: (state) => (number) => {
            return state.keypairs.find((k) => k.number === number);
        }
    }
});

export default store;
