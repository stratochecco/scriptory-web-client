import http from './http';
import authorizationHeader from './authorizationHeader';
import store from '../store';

export default {
    usernameAvailable: (username) => {
        return http.post('/users/username-available', { username });
    },

    emailAvailable: (email) => {
        return http.post('/users/email-available', { email });
    },

    signupInfo: () => {
        return http.get('/auth/signupInfo');
    },

    signup: (user) => {
        return http.post('/users/signup', user);
    },

    verifyEmail: (token) => {
        return http.post('/users/verify-email', { token });
    },

    loginInfo: (credentials) => {
        return http.post('/users/login-info', credentials);
    },

    auth: (credentials) => {
        return http.post('/users/auth', credentials);
    },

    logout: (token) => {
        const headers = authorizationHeader(store.getters['auth/authToken']());
        return http.post('/users/logout', null, { headers });
    }
};
