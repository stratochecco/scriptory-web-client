import http from './http';
import authorizationHeader from './authorizationHeader';
import store from '../store';

export default {
    lostPassword: (data) => {
        return http.post('/users/lost-password', data);
    },

    resetPasswordInfo: (data) => {
        return http.post('/users/reset-password-info', data);
    },

    resetPassword: (data) => {
        return http.post('/users/reset-password', data);
    },

    info: () => {
        const headers = authorizationHeader(store.getters['auth/authToken']());
        return http.get('/users/info', { headers });
    },

    keypairs: (wanted) => {
        const headers = authorizationHeader(store.getters['auth/authToken']());
        return http.post('/users/keypairs', wanted, { headers }).then((res) => {
            return res['keypairs'];
        });
    },

    changeEmail: (newEmail) => {
        const headers = authorizationHeader(store.getters['auth/authToken']());
        return http.post('/users/change-email', newEmail, { headers });
    },

    verifyChangeEmail: (token) => {
        const headers = authorizationHeader(store.getters['auth/authToken']());
        return http.post('/users/verify-change-email', { Token: token }, { headers });
    },

    changePassword: (data) => {
        const headers = authorizationHeader(store.getters['auth/authToken']());
        return http.post('/users/change-password', data, { headers });
    },

    updateSecrets: (data) => {
        const headers = authorizationHeader(store.getters['auth/authToken']());
        return http.post('/users/update-secrets', data, { headers });
    },

    updateConfig: (data) => {
        const headers = authorizationHeader(store.getters['auth/authToken']());
        return http.post('/users/update-config', data, { headers });
    }
};
