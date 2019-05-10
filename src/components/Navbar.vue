><template>
	<b-navbar fixed="top" type="dark" toggleable="md">
		<b-navbar-brand to="/">Scriptory <sup><em style="font-size: 10px;">BETA</em></sup></b-navbar-brand>
		<b-navbar-toggle target="defaultNavbarCollapse"></b-navbar-toggle>
		<b-collapse is-nav id="defaultNavbarCollapse">
			<b-navbar-nav>
				<!--<b-nav-item v-if="$route.path === '/'" v-scroll-to="'#what-is-it'">What is it?</b-nav-item>-->
				<b-nav-item to="/b/try/bdemo">Demo</b-nav-item>
                <b-nav-item to="/explore">Find Something</b-nav-item>
				<b-nav-item-dropdown right>
					<template slot="text">
						Create
					</template>
					<b-dropdown-item to="/b/new">Board</b-dropdown-item>
					<b-dropdown-item to="/s/edit">Script</b-dropdown-item>
				</b-nav-item-dropdown>
			</b-navbar-nav>
			<b-navbar-nav class="ml-auto">
				<b-nav-item v-if="isAuthenticated" to="/u/profile">{{ username }}</b-nav-item>
				<b-nav-item v-if="!isAuthenticated" to="/u/login">Sign Up!</b-nav-item>
				<b-nav-item-dropdown right>
					<template slot="text">
						<font-awesome-icon :icon="['fas', 'user']" />
					</template>
					<b-dropdown-item v-if="!isAuthenticated" to="/u/login">Login</b-dropdown-item>
					<b-dropdown-item v-if="isAuthenticated" to="/u/profile">Profile</b-dropdown-item>
					<b-dropdown-item v-if="isAuthenticated" to="/u/settings">Settings</b-dropdown-item>
					<b-dropdown-item v-if="isAuthenticated" to="/u/logout">Logout</b-dropdown-item>
				</b-nav-item-dropdown>
			</b-navbar-nav>
		</b-collapse>
	</b-navbar>
</template>

<script>

	import { mapGetters } from 'vuex';
    import BNavbar from "bootstrap-vue/src/components/navbar/navbar";
    import BNavbarBrand from "bootstrap-vue/src/components/navbar/navbar-brand";
    import BNavbarToggle from "bootstrap-vue/src/components/navbar/navbar-toggle";
    import BCollapse from "bootstrap-vue/src/components/collapse/collapse";
    import BNavbarNav from "bootstrap-vue/src/components/navbar/navbar-nav";
    import BNavItem from "bootstrap-vue/src/components/nav/nav-item";
    import BNavItemDropdown from "bootstrap-vue/src/components/nav/nav-item-dropdown";
    import BDropdownItem from "bootstrap-vue/src/components/dropdown/dropdown-item";

	export default {
		name: "AppNavbar",
        components: {
            BDropdownItem,
            BNavItemDropdown, BNavItem, BNavbarNav, BCollapse, BNavbarToggle, BNavbarBrand, BNavbar },
        computed: {
			...mapGetters('auth', [
				'user'
			]),
			isAuthenticated () {
				return this.$store.getters['auth/isAuthenticated']();
			},
			username () {
				return this.user.username;
			}
		}
	}

</script>

<style scoped lang="scss">

	@import "../sass/_config/variables";

	.navbar {
		background-color: rgba($DarkerBackgroundColor, .8);
		border-bottom: 1px solid $PrimaryColor;
		font-weight: 400;
	}

</style>
