import Vue from 'vue';
import VueRouter from 'vue-router';

import store from './store';

Vue.use(VueRouter);

const baseUrl = global.window.appConfig.appBaseUrl;

import contentResource from './api/contentResource';
import { CODES } from "./constants";

const routes = [
    {
        path: '/',
        //name: 'home',
        component: () => import(/* webpackChunkName: "pages_home" */ './views/Pages/Home.vue')
    },
    {
        path: '/explore',
        name: 'explore',
        component: () => import(/* webpackChunkName: "explore" */ './views/Explore.vue')
    },
    {
        path: '/pages',
        component: { template: '<router-view></router-view>' },
        children: [
        ]
    },
    {
        path: '/docs/:name',
        name: 'docs',
        component: () => import(/* webpackChunkName: "docs" */ './views/Docs.vue')
    },
    {
        path: '/u',
        component: { template: '<router-view></router-view>' },
        children: [
            {
                path: 'login',
                beforeEnter: (to, from, next) => {
                    if (store.getters['auth/user']) {
                        next('/u/profile');
                    }
                    next();
                },
                component: () => import(/* webpackChunkName: "users_login" */ './views/Users/Login.vue'),
                meta: { title: 'Login' }
            },
            {
                path: 'logout',
                beforeEnter: (to, from, next) => {
                    store.dispatch('auth/logout').finally(() => {
                        next('/u/login');
                    });
                },
                meta: { title: 'Logout', auth: true }
            },
            {
                path: 'verify-email/:token',
                component: () => import(/* webpackChunkName: "users_verify-email" */ './views/Users/VerifyEmail.vue'),
                meta: { title: 'Verify email' }
            },
            {
                path: 'lost-password',
                beforeEnter: (to, from, next) => {
                    if (store.getters['auth/isAuthenticated']()) {
                        next(`/u/profile`);
                    } else {
                        next();
                    }
                },
                component: () => import(/* webpackChunkName: "users_lost-password" */ './views/Users/LostPassword.vue'),
                meta: { title: 'Lost Password' }
            },
            {
                path: 'reset-password/:token',
                component: () =>
                    import(/* webpackChunkName: "users_reset-password" */ './views/Users/ResetPassword.vue'),
                meta: { title: 'Reset Password' }
            },
            {
                path: 'profile',
                beforeEnter: (to, from, next) => {
                    next('/u/profile/' + store.getters['auth/user'].username);
                },
                meta: { auth: true }
            },
            {
                path: 'profile/:username',
                component: () => import(/* webpackChunkName: "users_profile" */ './views/Users/Profile.vue')
            },
            {
                path: 'settings',
                beforeEnter: (to, from, next) => {
                    next('/u/settings/' + store.getters['auth/user'].username);
                },
                meta: { title: 'Settings', auth: true }
            },
            {
                path: 'settings/:username',
                component: () => import(/* webpackChunkName: "users_settings" */ './views/Users/Settings.vue'),
                meta: { auth: true }
            },
            {
                path: 'verify-change-email/:token',
                component: () =>
                    import(/* webpackChunkName: "users_verify-change-email" */ './views/Users/VerifyChangeEmail.vue'),
                meta: { title: 'Verify email' }
            },
            {
                path: 'oauth/dropbox',
                beforeEnter: (to, from, next) => {
                    store.commit('storageProviders/mergeToState', { dropbox: { authResponse: to.hash } });
                    next(`/u/settings/${store.getters['auth/user'].username}`);
                },
                meta: { auth: true }
            }
        ],
        alias: ['/users']
    },
    {
        path: '/b',
        component: { template: '<router-view></router-view>' },
        children: [
            {
                path: 'view/:uid',
                component: () => import(/* webpackChunkName: "boards_view" */ './views/Boards/View.vue'),
                alias: ['view/:name/:uid'],
                meta: { title: 'View' }
            },
            {
                path: 'new',
                beforeEnter: (to, from, next) => {
                    contentResource.createBoard().then((res) => {
                        next(`/b/run/${res.board.name}/${res.board.uid}`);
                    });
                },
                meta: { auth: true }
            },
            {
                path: 'try/:uid',
                component: () => import(/* webpackChunkName: "boards_try" */ './views/Boards/Try.vue'),
                alias: ['try/:name/:uid'],
                meta: { title: 'Try' }
            },
            {
                path: 'run/:uid',
                component: () => import(/* webpackChunkName: "boards_run" */ './views/Boards/Run.vue'),
                alias: ['run/:name/:uid'],
                meta: { title: 'Run' }
            }
        ],
        alias: ['/boards']
    },
    {
        path: '/s',
        component: { template: '<router-view></router-view>' },
        children: [
            {
                path: 'view/:uid',
                component: () => import(/* webpackChunkName: "scripts_view" */ './views/Scripts/View.vue'),
                alias: ['view/:name/:uid'],
                meta: { title: 'View' }
            },
            {
                path: 'edit',
                component: () => import(/* webpackChunkName: "scripts_edit" */ './views/Scripts/Edit.vue'),
                meta: { auth: true }
            },
            {
                path: 'edit/:uid',
                component: () => import(/* webpackChunkName: "scripts_edit" */ './views/Scripts/Edit.vue'),
                meta: { title: 'Edit', auth: true },
                alias: ['edit/:name/:uid']
            },
            {
                path: 'try/:uid',
                component: () => import(/* webpackChunkName: "scripts_try" */ './views/Scripts/Try.vue'),
                alias: ['try/:name/:uid'],
                meta: { title: 'Try' }
            }
        ],
        alias: ['/scripts']
    },
    {
        path: '*',
        component: () => import(/* webpackChunkName: "pages_not-found" */ './views/Pages/NotFound.vue'),
        meta: { title: '404' }
    }
];

const router = new VueRouter({
    routes,
    base: baseUrl,
    mode: 'history',
    scrollBehavior(to, from, savedPosition) {
        if (to.hash) {
            return { selector: to.hash };
        } else if (savedPosition) {
            return savedPosition;
        } else {
            return { x: 0, y: 0 };
        }
    }
});

router.beforeEach((to, from, next) => {
    const authRequired = to.matched.some((route) => route.meta.auth);
    const authToken = store.getters['auth/authToken']();
    const tokenPresent = authToken !== null;
    const authenticated = store.getters['auth/isAuthenticated']();

    document.title = (to.meta.title ? to.meta.title + ' - ' : '') + store.getters.appTitle;

    if (authRequired && !tokenPresent) {
        store.dispatch('auth/resetUser').then(() => {
            store.dispatch('loginRedirect', { to, next });
        });
    } else if (!authenticated && tokenPresent) {
        store
            .dispatch('fetchUserInfo')
            .then(() => {
                next();
            })
            .catch((e) => {
                if (_.includes(CODES, e)) {
                    console.warn(e);
                    Vue.notify({
                        group: 'main',
                        title: `Error ${e.code}`,
                        text: e.message,
                        type: 'warn',
                        duration: 4000
                    });

                    next();
                } else {
                    if (tokenPresent) {
                        store.dispatch('auth/logout');
                    }
                    store.dispatch('auth/resetUser').then(() => {
                        store.dispatch('loginRedirect', { to, next });
                    });
                    console.error(e);
                }
            });
    } else if (!authRequired || (authRequired && tokenPresent)) {
        next();
    }
});

export default router;
