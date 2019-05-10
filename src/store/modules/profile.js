import contentResource from '../../api/contentResource';
import storageProviders from "./storageProviders";

const state = {
    userData: null,
    boards: null,
    scripts: null
};

const actions = {
    fetchUserData({ commit, state, rootGetters }, username) {
        return contentResource.profile(rootGetters['auth/authToken'](), username).then((data) => {
            commit('setUserData', data);
            return Promise.resolve(data);
        });
    },
    fetchBoards({ commit, state, rootGetters }, username) {
        return contentResource.userBoards(username).then((data) => {
            commit('setBoards', data);
            return Promise.resolve(data);
        });
    },
    fetchScripts({ commit, state, rootGetters }, username) {
        return contentResource.userScripts(username).then((data) => {
            commit('setWidgets', data);
            return Promise.resolve(data);
        });
    },
    deleteBoard({ commit, state, dispatch }, uid) {
        return dispatch('storageProviders/deleteBoardStore', uid, { root: true })
            .catch((e) => {
                // For the moment I only care about handling SPs errors gracefully
                console.warn(e);
            })
            .then(() => {
                return contentResource.deleteBoard(uid).then((res) => {
                    return Promise.resolve(res);
                });
            });
    },
    deleteScript({ commit, state, dispatch }, uid) {
        return contentResource.deleteScript(uid).then((data) => {
            return Promise.resolve(data);
        }).catch((e) => {
            return Promise.reject(e);
        });
    }
};

const mutations = {
    setUserData(state, data) {
        state.userData = data;
    },
    setBoards(state, data) {
        state.boards = data;
    },
    setWidgets(state, data) {
        state.widgets = data;
    }
};

const getters = {};

export default {
    namespaced: true,
    state,
    actions,
    mutations,
    getters
};
