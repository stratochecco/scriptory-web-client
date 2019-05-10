<template>
	<div>
		<app-navbar></app-navbar>
		<notifications group="main" position="top center" classes="vue-notification custom-vue-notification" />
		<keep-alive include="Explore_View" max="1"><router-view></router-view></keep-alive>
		<app-footer></app-footer>
        <cookie-banner v-if="!euCookieAccepted" @agree="acceptEUCookie"></cookie-banner>
	</div>

</template>

<script>

    import BModal from "bootstrap-vue/src/components/modal/modal";
    import BButton from "bootstrap-vue/src/components/button/button";
    import AppNavbar from './Navbar.vue'
	import AppFooter from "./Footer.vue";
    import CookieBanner from './CookieBanner';

	export default {
		name: "App",
		components: {
            BButton,
            BModal,
			AppNavbar,
			AppFooter,
            CookieBanner
		},
		data () {
			return {
				loading: true,
				euCookieAccepted: this.$cookies.get("euCookieAccept") > 0
			}
		},
		methods: {
			acceptEUCookie () {
				this.$cookies.set("euCookieAccept", "1", "10y");
				this.euCookieAccepted = true;
			}
		}
	}

</script>

<style lang="scss">

	@import "../sass/main";

	#viewContainer {
		margin-top: 75px;
		min-height: 90vh;
	}

</style>
