<template>
	<b-container id="viewContainer">
		<b-modal ref="checkMailModal" hide-footer title="Go check your mail!">
			<div class="d-block text-center">
				<h5>You should receive an email within few minutes.</h5>
				<h5>Please go check for it and reset your password!</h5>
			</div>
		</b-modal>
		<b-card class="mx-auto shadow">
			<h1>Lost Password</h1>
            <h5>If you need this page you have probably lost access to your encrypted data. 😫️</h5>
            <h5>Resetting the password will only give you back access to your account.</h5>
			<b-form @submit.prevent="validateBeforeSubmit" class="mt-4">
				<b-form-input id="loginLoginInput" type="text" v-model="loginString" :state="!$v.loginString.$invalid" required placeholder="Username or email" :autofocus="true"></b-form-input>
				<b-button :disabled="$v.$invalid || loading"  type="submit" variant="primary" class="mt-4">Submit</b-button>
			</b-form>
		</b-card>
	</b-container>
</template>

<script>

	import { required, maxLength, minLength } from 'vuelidate/lib/validators';
    import BContainer from "bootstrap-vue/src/components/layout/container";
    import BModal from "bootstrap-vue/src/components/modal/modal";
    import BCard from "bootstrap-vue/src/components/card/card";
    import BFormInput from "bootstrap-vue/src/components/form-input/form-input";
    import BForm from "bootstrap-vue/src/components/form/form";
    import BButton from "bootstrap-vue/src/components/button/button";

	export default {
		name: 'Users_LostPassword_View',
        components: { BButton, BForm, BFormInput, BCard, BModal, BContainer },
        data() {
			return {
				loading: false,
				loginString: ''
			}
		},

		validations: {
            loginString: { required, maxLength: maxLength(254), minLength: minLength(3) },
		},

		methods: {
			validateBeforeSubmit() {
				this.$v.$touch();
				if (this.$v.$invalid) {
				} else {
					this.loading = true;
					this.submit().finally(() => {
						this.loading = false;
					});
				}
			},
			submit () {
				return this.$store.dispatch('lostPassword', {
                    LoginString: this.loginString
				}).then(() => {
                    this.$refs.checkMailModal.show();
				}).catch((e) => {
				    if (e.data.code === 404) {
                        this.$notify({
                            group: 'main',
                            title: 'User not found!',
                            type: 'error',
                            duration: 4000
                        });
                    }
                });
			}
		}
	}

</script>
