<template>
	<b-container id="viewContainer">
		<b-modal ref="checkMailModal" hide-footer title="Go check your mail!">
			<div class="d-block text-center">
				<h1>✉️</h1>
				<h5>You should receive a confirm email at the address {{ signup.email }} within few minutes.</h5>
				<h5>Please go check for it and activate your account!</h5>
			</div>
		</b-modal>
		<b-card-group deck>
			<b-card class="shadow">
				<h1>Welcome to Scriptory!</h1>
				<em>(Even more if you sign up)</em>
				<b-form ref="signupForm" @submit.prevent="signupSubmit" class="mt-4">
					<b-form-group id="signupUsernameFormGroup" description="How should others call you?">
						<b-form-input id="signupUsernameInput" type="text" name="username" v-model="signup.username" :state="!$v.signup.username.$invalid" @input="checkUsernameAvailable" required placeholder="Username" autocomplete="username"></b-form-input>
						<b-form-invalid-feedback v-if="!$v.signup.username.usernameAvailable">
							Already in use. Sorry…
						</b-form-invalid-feedback>
						<b-form-invalid-feedback v-if="!$v.signup.username.validFormat">
							3 to 30 chars long,<br>
							a-z, A-Z and 0-9,<br>
							'_' and '.' separated and between others.
						</b-form-invalid-feedback>
					</b-form-group>
					<b-form-group id="signupEmailFormGroup" description="Other users will not see your email. Just for communications, you know…">
						<b-form-input id="signupEmailInput" type="email" name="email" v-model="signup.email" :state="!$v.signup.email.$invalid" @input="checkEmailAvailable" required placeholder="Email" autocomplete="email"></b-form-input>
						<b-form-invalid-feedback v-if="!$v.signup.email.email">
							Enter a valid email
						</b-form-invalid-feedback>
						<b-form-invalid-feedback v-if="!$v.signup.email.emailAvailable">
							Already in use. Sorry…
						</b-form-invalid-feedback>
					</b-form-group>
					<b-form-group id="signupPasswordFormGroup">
                        <template slot="description">
                            May it be safe. By the way <span style="color: #dc3545;">if you forget it you will lose your encrypted data</span>.
                        </template>
						<b-form-input id="signupPasswordInput" type="password" name="password" v-model="signup.password" :state="!$v.signup.password.$invalid" required placeholder="Password" autocomplete="new-password"></b-form-input>
						<b-form-invalid-feedback v-if="!$v.signup.password.minLength">
							Come on! At least 3 characters
						</b-form-invalid-feedback>
					</b-form-group>
					<p style="font-size: 12px;">By clicking “Sign Up” below, you agree to the <b-link to="/docs/terms">terms of service</b-link> and <b-link to="/docs/privacy">privacy statement</b-link>.</p>
					<b-button type="submit" variant="primary" :disabled="signupLoading || $v.signup.$invalid"><b-spinner v-if="signupLoading" small></b-spinner> Sign Up</b-button>
				</b-form>
			</b-card>
			<b-card class="shadow">
				<h1>Login</h1>
				<em>Happy scripts!</em>
				<b-form ref="loginForm" @submit.prevent="loginSubmit" class="mt-4">
					<b-form-group id="loginUsernameFormGroup" description="Remind me who you are">
						<b-form-input id="loginLoginInput" type="text" name="username" v-model="login.loginString" :state="!$v.login.loginString.$invalid" required placeholder="Username or email" :autofocus="true" autocomplete="username"></b-form-input>
					</b-form-group>
					<b-form-group id="loginPasswordFormGroup" description="Hope it's strong and kept safe">
						<b-form-input id="loginPasswordInput" type="password" name="password" v-model="login.password" :state="!$v.login.password.$invalid" required placeholder="Password" autocomplete="current-password"></b-form-input>
					</b-form-group>
					<b-form-group id="loginRemindMeFormGroup">
						<p>Remind me: <a href="/docs/under-the-hood#login" target="_blank" rel="noopener noreferrer" style="font-size: 0.8rem; opacity: 0.8;"><em>(Why two options?)</em></a></p>
						<b-form-radio-group buttons v-model="login.rm">
							<b-form-radio value="session" button-variant="outline-success">Session</b-form-radio>
							<b-form-radio value="local" button-variant="outline-warning">Local</b-form-radio>
						</b-form-radio-group>
					</b-form-group>
					<b-button type="submit" variant="primary" :disabled="loginLoading || $v.login.$invalid"><b-spinner v-if="loginLoading" small></b-spinner> Login</b-button>
					<b-button to="/u/lost-password" variant="outline-light" class="float-right">I lost my password</b-button>
				</b-form>
			</b-card>
		</b-card-group>
	</b-container>
</template>

<script>

	import { required, maxLength, minLength, email } from 'vuelidate/lib/validators';
    import _ from 'lodash';
    import BFormGroup from "bootstrap-vue/src/components/form-group/form-group";
    import BFormInvalidFeedback from "bootstrap-vue/src/components/form/form-invalid-feedback";
    import BFormInput from "bootstrap-vue/src/components/form-input/form-input";
    import BButton from "bootstrap-vue/src/components/button/button";
    import BCard from "bootstrap-vue/src/components/card/card";
    import BCardGroup from "bootstrap-vue/src/components/card/card-group";
    import BContainer from "bootstrap-vue/src/components/layout/container";
    import BModal from "bootstrap-vue/src/components/modal/modal";
    import BLink from "bootstrap-vue/src/components/link/link";
    import BFormRadioGroup from "bootstrap-vue/src/components/form-radio/form-radio-group";
    import BFormRadio from "bootstrap-vue/src/components/form-radio/form-radio";
    import BForm from "bootstrap-vue/src/components/form/form";
    import BSpinner from "bootstrap-vue/src/components/spinner/spinner";

	import { RM_STORAGE, VALID_USERNAME_REGEX } from "../../constants";
	import { computeKeyPassword, deArmor, generateKeySalt, generateKeypair, getRandomSrpVerifier } from "../../sycrypto/sycrypto.js";

	export default {
		name: "Users_Login_View",
        components: {
            BSpinner,
            BForm,
            BFormRadio,
            BFormRadioGroup,
            BLink, BModal, BContainer, BCardGroup, BCard, BButton, BFormInput, BFormInvalidFeedback, BFormGroup
        },
        created () {
			this.checkUsernameAvailable = _.debounce(() => {
				if (this.signup.username === '') { this.signup.usernameAvailable = true; return; }
				this.$store.dispatch('auth/usernameAvailable', this.signup.username).then((data) => {
					this.signup.usernameAvailable = data.available;
				}).catch((data) => {
					this.signup.usernameAvailable = true;
					console.log(data);
				});
			}, 1000);
			this.checkEmailAvailable = _.debounce(() => {
				if (this.signup.email === '') { this.signup.emailAvailable = true; return; }
				this.$store.dispatch('auth/emailAvailable', this.signup.email).then((data) => {
					this.signup.emailAvailable = data.available;
				}).catch((data) => {
					this.signup.emailAvailable = true;
					console.log(data);
				});
			}, 1000);
		},
		data () {
			return {
				signup: {
					username: '',
					email: '',
					password: '',
					usernameAvailable: true,
					emailAvailable: true
				},
				login: {
					loginString: '',
					password: '',
					rm: RM_STORAGE.LOCAL,
				},
                signupLoading: false,
				loginLoading: false
			}
		},
		validations: {
			signup: {
				username: { required, validFormat(value) { return value ? VALID_USERNAME_REGEX.test(value) : true; }, usernameAvailable(value) { return this.signup.usernameAvailable; } },
				email: { required, email, emailAvailable(value) { return this.signup.emailAvailable; } },
				password: { required, minLength: minLength(3) }
			},
			login: {
				loginString: {required, maxLength: maxLength(254), minLength: minLength(2)},
				password: {required, minLength: minLength(3)}
			}
		},
		methods: {
			signupSubmit() {
                const th1s = this;
                Object.keys(this.$refs.signupForm.getElementsByTagName('input')).map((k) => { th1s.$refs.signupForm.getElementsByTagName('input')[k].blur(); });
				this.$v.signup.$touch();
				if (this.$v.signup.$invalid) {
					return false;
				}

				(async () => {
					this.signupLoading = true;
                    const email = this.signup.email;
                    const username = this.signup.username;
                    const password = this.signup.password;
                    this.signup.password = '';

                    try {
						this.$notify({
							group: 'main',
							title: 'Thank you!',
							text: 'Hang on…',
							type: 'info',
							duration: 4000
						});

						this.$notify({
                            group: 'main',
                            title: 'Generating your SRP verifier…',
                            text: '',
                            type: 'info',
                            duration: 4000
                        });

                        await this.$store.dispatch('auth/signupInfo');
                        const verifier = await getRandomSrpVerifier(this.$store.state.auth.authInfo.modulus, { username, password });

                        this.$notify({
                            group: 'main',
                            title: 'Generating your ed25519 keypair…',
                            text: '',
                            type: 'info',
                            duration: 4000
                        });

                        const privKeySalt = await generateKeySalt();
                        const privKeyEncKey = await computeKeyPassword(await computeKeyPassword(password, verifier.salt), privKeySalt);
                        const keypair = await generateKeypair({ username, passphrase: privKeyEncKey });

                        await this.$store.dispatch('auth/signup', {
                            username,
                            email,
	                        pw_v: verifier.version,
                            salt: verifier.salt,
	                        modulus_uuid: this.$store.state.auth.authInfo.modulusUuid,
	                        verifier: verifier.verifier,
                            keypairs: [
                                {
                                    pub_key: keypair.publicKeyArmored,
                                    rev_cert: keypair.revocationCertificate,
                                    enc_priv_key: keypair.privateKeyArmored,
                                    salt: privKeySalt
                                }
                            ]
                        });

						this.signup.password = '';

						this.showCheckMailModal();
					} catch(e) {
                        console.error(e);
					} finally {
                        this.signupLoading = false;
                    }
				})();
			},
			loginSubmit() {
			    const th1s = this;
			    Object.keys(this.$refs.loginForm.getElementsByTagName('input')).map((k) => { th1s.$refs.loginForm.getElementsByTagName('input')[k].blur(); });
				this.$v.login.$touch();
				if (this.$v.login.$invalid) {
					return false;
				}

				(async () => {
					this.loginLoading = true;
                    const loginString = this.login.loginString;
					const password = this.login.password;
                    this.login.password = '';

					try {
						this.$notify({ group: 'main', clean: true });
						this.$notify({
							group: 'main',
							title: 'Logging in…',
							text: 'Hang on…',
							type: 'info',
							duration: 4000
						});

						await this.$store.commit('auth/setRMStorage', this.login.rm);
                        const loginInfo = await this.$store.dispatch('auth/loginInfo', loginString);
                        const salt = loginInfo.salt;
						await this.$store.dispatch('auth/getSrp', { loginString, password });

						await this.$store.commit('auth/setPasswordHash', await computeKeyPassword(password, salt));

						this.$notify({
							group: 'main',
							title: 'Welcome!',
							text: null,
							type: 'success',
							duration: 4000
						});

						this.$router.push(await this.$store.dispatch('consumeLoginRedirect') || '/');
					} catch(e) {
                        console.error(e);
					} finally {
                        this.loginLoading = false;
                    }
				})();
			},
			showCheckMailModal() {
				this.$refs.checkMailModal.show();
			}
		}
	}

</script>
