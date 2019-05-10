<template>
	<b-container id="viewContainer">
        <b-card>
            <h1>Reset Password</h1>
            <b-form @submit.prevent="validateBeforeSubmit">
                <b-form-input type="password" v-model="newPassword" :state="!$v.newPassword.$invalid" :autofocus="true" required placeholder="New password" autocomplete="new-password" class="mb-2"></b-form-input>
                <b-button :disabled="$v.$invalid" type="submit" variant="primary">Submit</b-button>
            </b-form>
        </b-card>
	</b-container>
</template>

<script>

    import { required, maxLength, minLength } from 'vuelidate/lib/validators';
	import BContainer from "bootstrap-vue/src/components/layout/container";
    import BCard from "bootstrap-vue/src/components/card/card";
    import BButton from "bootstrap-vue/src/components/button/button";
    import BForm from "bootstrap-vue/src/components/form/form";
    import BFormInput from "bootstrap-vue/src/components/form-input/form-input";

    import { computeKeyPassword, deArmor, generateKeySalt, generateKeypair, getRandomSrpVerifier } from "../../sycrypto/sycrypto.js";

    export default {
		name: 'Users_ResetPassword_View',
        components: { BFormInput, BForm, BButton, BCard, BContainer },
        data() {
            return {
                newPassword: ''
            }
        },
        validations: {
            newPassword: { required, maxLength: maxLength(254), minLength: minLength(3) },
        },
        methods: {
            validateBeforeSubmit() {
                this.$v.$touch();
                if (this.$v.$invalid) {
                } else {
                    this.loading = true;
                    this.submit();
                }
            },
            submit () {
                const token = this.$route.params.token;

                this.$v.newPassword.$touch();
                if (this.$v.newPassword.$invalid) {
                    return false;
                }

                (async () => {
                    this.loading = true;
                    const password = this.newPassword;
                    this.newPassword = '';

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
                            title: 'Generating your new SRP verifier…',
                            text: '',
                            type: 'info',
                            duration: 4000
                        });

                        const info = await this.$store.dispatch('resetPasswordInfo', {
                            Token: token
                        });
                        if (!info.Username || !info.ModulusUUID || !info.Modulus || !info.Salt) {
                            this.$notify({
                                group: 'main',
                                title: 'Could not retrieve user info.',
                                text: null,
                                type: 'error',
                                duration: 4000
                            });
                            console.error(info);
                        }

                        const username = info.Username;
                        const verifier = await getRandomSrpVerifier(info.Modulus, { username, password, salt: info.Salt });

                        this.$notify({
                            group: 'main',
                            title: 'Generating your new ed25519 keypair…',
                            text: '',
                            type: 'info',
                            duration: 4000
                        });

                        const privKeySalt = await generateKeySalt();
                        const privKeyEncKey = await computeKeyPassword(await computeKeyPassword(password, verifier.salt), privKeySalt);
                        const keypair = await generateKeypair({ username, passphrase: privKeyEncKey });

                        await this.$store.dispatch('resetPassword', {
                            Token: token,
                            Username: username,
                            PwV: verifier.version,
                            Salt: verifier.salt,
                            ModulusUUID: info.ModulusUUID,
                            Verifier: verifier.verifier,
                            Keypairs: [
                                {
                                    pub_key: keypair.publicKeyArmored,
                                    rev_cert: keypair.revocationCertificate,
                                    enc_priv_key: keypair.privateKeyArmored,
                                    salt: privKeySalt
                                }
                            ]
                        });

                        this.$notify({
                            group: 'main',
                            title: 'Password changed',
                            text: null,
                            type: 'success',
                            duration: 4000
                        });
                        this.$router.push({ path: `/u/login` });
                    } catch(e) {
                        console.error(e);
                    }

                    this.loading = false;
                })();
            }
        }
	};

</script>
