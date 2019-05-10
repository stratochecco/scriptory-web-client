import axios from 'axios';
import Vue from 'vue';

const baseUrl = global.window.appConfig.apiBaseUrl;
const csrfToken = () => document.cookie.replace(/(?:(?:^|.*;\s*)csrfToken\s*\=\s*([^;]*).*$)|^.*$/, '$1');

const http = axios.create({
    baseURL: baseUrl,
    timeout: 30000,
    headers: {
        common: {
            Accept: 'application/json, text/javascript, */*; q=0.01',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-Token': csrfToken()
        }
    }
});

http.interceptors.response.use(
    (response) => {
        let data = response.data;

        const authorizationHeader = global.window.appConfig.authorizationHeader.toLowerCase();

        if (response.headers && response.headers[authorizationHeader]) {
            const authToken = response.headers[authorizationHeader].split(' ')[1];
            if (authToken) {
                data.auth = {
                    token: authToken
                };
            }
        }

        return Promise.resolve(data);
    },
    (error) => {
        console.warn(error);

        if (error.response.status === 403) {
            //window.location.replace("/users/login");
        }

        if ([404].indexOf(error.response.status) === -1 && typeof error.response.data !== 'undefined') {
            let title = `Something went wrong…`;
            let text = ``;
            title = title.concat(error.response.data.code ? `  [${error.response.data.code}]` : ``);
            text = text.concat(error.response.data.message ? error.response.data.message : ``);
            text = text.concat(error.response.data.error ? `\n ${JSON.stringify(error.response.data.errors)}` : ``);
            Vue.notify({
                group: 'main',
                title: title,
                text: text,
                type: 'error',
                duration: 4000
            });
        }

        if ([400, 401, 409, 422].indexOf(error.response.status) !== -1 && typeof error.response.data !== 'undefined') {
            return Promise.reject(error.response.data);
        }

        return Promise.reject(error.response);
    }
);

export default http;
