<template>
	<b-container id="viewContainer">
		<b-card class="shadow">
			<h2>Thank you!</h2>
			<h1 v-if="loading">Verifying Email. Hang on… 😐</h1>
			<h1 v-if="!loading && verified">Email verified 😄</h1>
			<h1 v-if="!loading && error">Something went wrong 😟</h1>
			<p v-if="!loading">{{ message }}</p>
			<b-button v-if="!loading && verified" to="/u/login" variant="outline-light">Login</b-button>
		</b-card>
		<br><br>
		<div>
			<p v-if="!verified">Lost your Password? → <router-link to="/u/lost-password">Reset</router-link></p>
			<p v-if="!verified">Not a member? → <router-link to="/u/login">Sign up now</router-link></p>
		</div>
	</b-container>
</template>

<script>

	import BContainer from "bootstrap-vue/src/components/layout/container";
    import BCard from "bootstrap-vue/src/components/card/card";
    import BButton from "bootstrap-vue/src/components/button/button";

    export default {
		name: 'Users_VerifyEmail_View',
        components: {BButton, BCard, BContainer},
        data() {
			return {
				error: false,
				loading: true,
				verified: false,
			}
		},

		mounted: function () {
			setTimeout(() => {
				const routeToken = this.$route.params.token;

				this.$store.dispatch('auth/verifyEmail', routeToken)
					.then((data) => {
						this.verified = true;
						this.message = data.message;
					})
					.catch((data) => {
						this.error = true;
						this.message = data.message;
					})
					.finally(() => {
						this.loading = false;
					})
			}, 1000);
		}
	};
</script>
