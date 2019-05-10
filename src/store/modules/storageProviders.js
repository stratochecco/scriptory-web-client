import _ from 'lodash';
import { Dropbox } from 'dropbox';
import fetch from 'isomorphic-fetch';
//import axios from 'axios';
import { STORAGE_PROVIDERS, ORIGIN } from '../../constants';
import { parseDropboxQueryString } from '../../utils';
import { encryptFromObject } from '../../sycrypto/sycrypto.js';
import contentResource from "../../api/contentResource";
import { decryptToObject, readArmoredMessage } from "../../sycrypto/sycrypto";

const defaultState = () => {
    const sP = _.cloneDeep(STORAGE_PROVIDERS);
    return _.merge(sP, {
        dropbox: {
            authResponse: null,
            accessToken: null,
            api: null
        }
    });
};

const state = defaultState();

const actions = {
    requestAccessUrl({ commit }, id) {
        switch (id) {
            case 'dropbox':
                commit('setApi', {
                    id,
                    api: new Dropbox({ clientId: state.dropbox.appKey, fetch: fetch })
                });

                return state.dropbox.api.getAuthenticationUrl(`${ORIGIN}/u/oauth/dropbox`);
            default:
                break;
        }
    },
    consumeAuthResponse({ commit, state, dispatch }, id) {
        switch (id) {
            case 'dropbox':
                const hash = state.dropbox.authResponse;
                commit('mergeToState', { dropbox: { authResponse: null } });
                const parsed = parseDropboxQueryString(hash);
                const token = parsed.access_token;
                if (token) {
                    const api = new Dropbox({ accessToken: token, fetch: fetch });
                    commit('setAccessToken', { id, token });
                    commit('setApi', { id, api });
                }

                return dispatch('auth/updateSecrets', { dropbox: { accessToken: parsed.access_token } }, { root: true });
            default:
                break;
        }
    },
    revokeAccess({ commit, state, dispatch }, id) {
        switch (id) {
            case 'dropbox':
                if (state.dropbox.api) {
                    state.dropbox.api.authTokenRevoke().then(() => {
                        commit('setAccessToken', { id, api: null });
                        commit('setApi', { id, api: null });
                    });
                }

                return dispatch('auth/updateSecrets', { dropbox: { accessToken: null } }, { root: true });
            default:
                break;
        }
    },
    makeDefault({ state, dispatch }, id) {
        return dispatch('auth/mergeConfig', { defaultSP: id }, { root: true });
    },
    prepareApi({ state }, id) {
        switch (id) {
            case 'dropbox':
                if (!state.dropbox.api) {
                    if (!state.dropbox.accessToken) {
                        return Promise.reject('No dropbox access token.');
                    }
                    state.dropbox.api = new Dropbox({ accessToken: state.dropbox.accessToken, fetch: fetch });
                }
                break;
            default:
                return Promise.reject('Invalid storage provider id.');
        }

        return Promise.resolve(true);
    },
    async fetchStorage({ commit, state, dispatch, rootGetters }, { wInfo }) {
        if (typeof wInfo !== 'object') {
            return Promise.reject('Invalid params.');
        }

        const sP = wInfo.config.sP || rootGetters['auth/defaultSP'];
        await dispatch('prepareApi', sP);

        switch (sP) {
            case 'dropbox':
                return state.dropbox.api.filesDownload({ path: `/${wInfo.widget_uid}.pgp` })
                    .then((data) => {
                        return new Response(data.fileBlob).text();
                    })
                    .then((enc) => {
                        return readArmoredMessage(enc);
                    })
                    .then((mess) => {
                        const options = {
                            message: mess,
                            publicKeys: [rootGetters.keypair(rootGetters['auth/userConfig'].defaultKp).pub_key],
                            privateKeys: [rootGetters.keypair(rootGetters['auth/userConfig'].defaultKp).priv_key]
                        };

                        return decryptToObject(options);
                    });
            default:
                return Promise.reject('Invalid storage provider id.');
        }
    },
    async saveStorage({ commit, state, dispatch, rootGetters }, { wInfo, data }) {
        if (typeof wInfo !== 'object' || !wInfo.widget_uid || !wInfo.widget_uid.length || typeof data === 'undefined') {
            return Promise.reject('Invalid params.');
        }

        const sP = wInfo.config.sP || rootGetters['auth/defaultSP'];
        await dispatch('prepareApi', sP);

        switch (sP) {
            case 'dropbox':
                const options = {
                    message: data,
                    publicKeys: [rootGetters.keypair(rootGetters['auth/userConfig'].defaultKp).pub_key],
                    privateKeys: [rootGetters.keypair(rootGetters['auth/userConfig'].defaultKp).priv_key]
                };
                return encryptFromObject(options).then((enc) => {
                    const blob = new Blob([enc.data], { type: 'text/plain' });
                    return state.dropbox.api.filesUpload({ path: `/${wInfo.widget_uid}.pgp`, contents: blob, mode: {'.tag': 'overwrite' } });
                });
            default:
                break;
        }
    },
    async deleteWidgetStore({ commit, state, dispatch, rootGetters }, wInfo) {
        if (typeof wInfo !== 'object' || !/^w[0-9a-z]+$/i.exec(wInfo.widget_uid)) {
            // Just to be sure everything is ok
            return Promise.reject('Invalid widget uid.');
        }

        const sP = wInfo.config.sP || rootGetters['auth/defaultSP'];
        await dispatch('prepareApi', sP);

        switch (sP) {
            case 'dropbox':
                return state.dropbox.api.filesDeleteV2({ path: `/${wInfo.widget_uid}.pgp` });
            default:
                return Promise.reject('Invalid storage provider id.');
        }
    },
    async deleteBoardStore({ commit, state, dispatch, rootGetters }, uid) {
        return contentResource.boardWidgets(uid).then((res) => {
            const promises = [];
            for (const w of res.widgets) {
                const promise = dispatch('deleteWidgetStore', w.info).catch((e) => {
                    // I don't want everything to fail if a storage is no more available or something
                    console.warn(e);
                    return false;
                });
                promises.push(promise);
            }

            return Promise.all(promises);
        });
    }
};

const mutations = {
    mergeToState(state, toAssign) {
        _.merge(state, toAssign);
    },
    setApi(state, { id, api }) {
        state[id] = _.merge(_.cloneDeep(state[id]), { api });
    },
    setAccessToken(state, { id, token }) {
        state[id] = _.merge(_.cloneDeep(state[id]), { accessToken: token });
    }
};

const getters = {
    available: (state) => {
        return _.pickBy(state, (s) => {
            return !!s.accessToken;
        });
    }
};

export default {
    namespaced: true,
    state,
    actions,
    mutations,
    getters
};
