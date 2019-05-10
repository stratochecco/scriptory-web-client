//import '@babel/polyfill';

import Vue from 'vue';

import Vuelidate from 'vuelidate';
Vue.use(Vuelidate);

import VueMoment from 'vue-moment';
import moment from 'moment-timezone';
moment.tz.guess();
Vue.use(VueMoment, { moment });

import VueCookies from 'vue-cookies';
Vue.use(VueCookies);

const VueScrollTo = require('vue-scrollto');
Vue.use(VueScrollTo, {
    duration: 375,
    offset: -100
});

import BootstrapVue from 'bootstrap-vue';
Vue.use(BootstrapVue);

import { library } from '@fortawesome/fontawesome-svg-core';
import {
    faArrowAltCircleRight,
    faArrowsAlt,
    faBars,
    faBook,
    faCheck,
    faCodeBranch,
    faEdit,
    faFileCode,
    faLock,
    faPlay,
    faQuestionCircle,
    faSearch,
    faSync,
    faTimes,
    faTrash,
    faUser
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
library.add(
    faArrowAltCircleRight,
    faArrowsAlt,
    faBars,
    faBook,
    faCheck,
    faCodeBranch,
    faEdit,
    faFileCode,
    faLock,
    faPlay,
    faQuestionCircle,
    faSearch,
    faSync,
    faTimes,
    faTrash,
    faUser
);
Vue.component('font-awesome-icon', FontAwesomeIcon);

import Notifications from 'vue-notification';
Vue.use(Notifications);

import { sync } from 'vuex-router-sync';
import store from './store';
import router from './router';
sync(store, router);

import App from './components/App.vue';

/*
 * Vue app init
 */
const app = new Vue({
    store: store,
    router: router,
    render: (h) => h(App)
});

router.app = app;

const appContainer = document.querySelector('#vueApp');
if (appContainer !== null) {
    app.$mount('#vueApp');
}
