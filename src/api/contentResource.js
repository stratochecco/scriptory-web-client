import http from './http';
import authorizationHeader from './authorizationHeader';
import store from '../store';

export default {
    imprint: () => {
        return http.get('/content/imprint');
    },

    // Profile contents
    profile: (token, username) => {
        const headers = authorizationHeader(store.getters['auth/authToken']());
        return http.post('/users/profile', { username }, { headers });
    },

    userBoards: (username) => {
        const headers = authorizationHeader(store.getters['auth/authToken']());
        return http.post('/boards/user-list', { username }, { headers });
    },

    userScripts: (username) => {
        const headers = authorizationHeader(store.getters['auth/authToken']());
        return http.post('/scripts/user-list', { username }, { headers });
    },

    // Boards contents
    boardWidgets: (uid) => {
        const headers = authorizationHeader(store.getters['auth/authToken']());
        return http.post('/boards/widgets-list', { uid }, { headers });
    },

    createBoard: () => {
        const headers = authorizationHeader(store.getters['auth/authToken']());
        return http.get('/boards/create', { headers });
    },

    saveBoardEdit: (data) => {
        const headers = authorizationHeader(store.getters['auth/authToken']());
        return http.post('/boards/save-edit', data, { headers });
    },

    deleteBoard: (uid) => {
        const headers = authorizationHeader(store.getters['auth/authToken']());
        return http.post('/boards/delete', { uid }, { headers });
    },

    getBoardReference: (uid) => {
        const headers = authorizationHeader(store.getters['auth/authToken']());
        return http.post('/boards/get-reference', { uid }, { headers });
    },

    // Scripts contents
    getScriptEdit: (uid) => {
        const headers = authorizationHeader(store.getters['auth/authToken']());
        return http.post('/scripts/get-edit', { uid }, { headers });
    },

    saveScriptEdit: (data) => {
        const headers = authorizationHeader(store.getters['auth/authToken']());
        return http.post('/scripts/save-edit', { data }, { headers });
    },

    deleteScript: (uid) => {
        const headers = authorizationHeader(store.getters['auth/authToken']());
        return http.post('/scripts/delete-script', { uid }, { headers });
    },

    getScriptReference: (uid) => {
        const headers = authorizationHeader(store.getters['auth/authToken']());
        return http.post('/scripts/get-script-reference', { uid }, { headers });
    },

    cloneScript: (uid) => {
        const headers = authorizationHeader(store.getters['auth/authToken']());
        return http.post('/scripts/clone', { uid }, { headers });
    },

    getTestWidget: (uid) => {
        const headers = authorizationHeader(store.getters['auth/authToken']());
        return http.post('/scripts/get-script-as-widget', { uid }, { headers });
    },

    getHtml: (data) => {
        const headers = authorizationHeader(store.getters['auth/authToken']());
        return http.post('/scripts/get-html', data, { headers });
    },

    newAndPopularScripts: () => {
        const headers = authorizationHeader(store.getters['auth/authToken']());
        return http.get('/scripts/new-and-popular', null, { headers });
    },

    // Search
    search: (params) => {
        const headers = authorizationHeader(store.getters['auth/authToken']());
        return http.post('/search', params, { headers });
    },

    // Docs
    fetchDoc: (path) => {
        const headers = authorizationHeader(store.getters['auth/authToken']());
        return http.get('/docs/' + path, null, { headers });
    }
};
