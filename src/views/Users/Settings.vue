<template>
    <b-container id="viewContainer">
        <h1>Settings - {{ username }}</h1>
        <b-row class="mb-4">
            <b-col>
                <b-card class="shadow">
                    <template slot="header">
                        <h5 class="m-0">Storage</h5>
                    </template>
                    <p>
                        Scriptory doesn't provide cloud storage for your widgets data.<br>
                        If you want your data to persist somewhere you must connect an account here below.
                    </p>
                    <hr>
                    <div>
                        <h5>Dropbox</h5>
                        <b-button v-if="!isDropboxAuthenticated" ref="connectDropboxButton" :disabled="loading" @click="connect('dropbox')" variant="outline-info" size="sm">Connect</b-button>
                        <b-button v-else ref="disconnectDropboxButton" :disabled="loading" @click="disconnect('dropbox')" variant="outline-danger" size="sm">Disconnect</b-button>
                        <b-button :disabled="defaultSP === 'dropbox' || loading" :variant="defaultSP === 'dropbox' ? 'info' : 'outline-info'" @click="makeDefault('dropbox')" size="sm">Default</b-button>
                    </div>
                    <hr>
                </b-card>
            </b-col>
        </b-row>
        <b-row class="mb-4">
            <b-col>
                <b-card class="shadow">
                    <template slot="header">
                        <h5 class="m-0">Account</h5>
                    </template>
                    <h5>Change email</h5>
                    <b-form @submit.prevent="submitChangeEmail">
                        <b-form-group id="newEmailFormGroup">
                            <b-form-input type="email" v-model="newEmail" :state="!$v.newEmail.$invalid" @input="checkEmailAvailable" size="sm" required placeholder="New email" autocomplete="email" class="mb-2"></b-form-input>
                            <b-form-invalid-feedback v-if="!$v.newEmail.emailAvailable">
                                Already in use. Sorry…
                            </b-form-invalid-feedback>
                        </b-form-group>
                        <b-button :disabled="$v.newEmail.$invalid || loading" type="submit" size="sm" variant="primary">Submit</b-button>
                    </b-form>
                    <hr>
                    <h5>Change password</h5>
                    <b-form @submit.prevent="submitChangePassword">
                        <b-form-input :value="username" autocomplete="username email" style="display: none;"></b-form-input>
                        <b-form-group id="currentPasswordFormGroup">
                            <b-form-input type="password" v-model="currentPassword" :state="!$v.currentPassword.$invalid" size="sm" required placeholder="Current password" autocomplete="password" class="mb-2"></b-form-input>
                        </b-form-group>
                        <b-form-group id="newPasswordFormGroup">
                            <b-form-input type="password" v-model="newPassword" :state="!$v.newPassword.$invalid" size="sm" required placeholder="New password" autocomplete="new-password" class="mb-2"></b-form-input>
                            <b-form-invalid-feedback v-if="!$v.newPassword.minLength">
                                Come on! At least 3 characters
                            </b-form-invalid-feedback>
                        </b-form-group>
                        <b-button :disabled="$v.newPassword.$invalid || loading" type="submit" size="sm" variant="primary">Submit</b-button>
                        <small class="ml-2 text-warning">Your current sessions will expire.</small>
                    </b-form>
                </b-card>
            </b-col>
        </b-row>
        <b-row class="mb-4">
            <b-col>
                <b-card class="shadow">
                    <template slot="header">
                        <h5 class="m-0">Keypairs</h5>
                    </template>
                    <b-table ref="keypairsTable" responsive hover show-empty :items="keypairsTableItemsProvider" :fields="keypairsTable.fields" :sort-by.sync="keypairsTable.sortBy" :sort-desc="false" tbody-tr-class="clickable-tr">
                        <template slot="type" slot-scope="row">
                            <code>{{ row.item.type }}</code>
                        </template>
                        <template slot="valid" slot-scope="row">
                            <font-awesome-icon v-if="row.item.valid" :icon="['fas', 'check']" />
                            <font-awesome-icon v-else :icon="['fas', 'times']" />
                        </template>
                        <template slot="pubKey" slot-scope="row">
                            <code>{{ row.item.pub_key }}</code>
                        </template>
                        <template slot="revCert" slot-scope="row">
                            <code>{{ row.item.rev_cert }}</code>
                        </template>
                        <template slot="encPrivKey" slot-scope="row">
                            <code>{{ row.item.enc_priv_key }}</code>
                        </template>
                        <template slot="salt" slot-scope="row">
                            <code>{{ row.item.salt }}</code>
                        </template>
                        <template slot="created" slot-scope="row">
                            {{ (new Date(row.item.created)).toISOString() | moment('YYYY.MM.DD') }}
                        </template>
                        <template slot="options" slot-scope="row">
                            -
                        </template>
                        <div slot="table-busy" class="text-center text-info my-2">
                            <strong>Loading…</strong>
                        </div>
                    </b-table>
                </b-card>
            </b-col>
        </b-row>
        <b-modal ref="checkMailModal" hide-footer title="Go check your mail!" lazy>
            <div class="d-block text-center">
                <h1>✉️</h1>
                <h5>You should receive an email at the address {{ newEmail }} within few minutes.</h5>
                <h5>Please go check for it and confirm your address!</h5>
            </div>
        </b-modal>
    </b-container>
</template>

<script>

    import { mapActions, mapState } from 'vuex';
    import { required, minLength, email } from 'vuelidate/lib/validators';
    import _ from 'lodash';
    import BContainer from "bootstrap-vue/src/components/layout/container";
    import BModal from "bootstrap-vue/src/components/modal/modal";
    import BButton from "bootstrap-vue/src/components/button/button";
    import BRow from "bootstrap-vue/src/components/layout/row";
    import BCol from "bootstrap-vue/src/components/layout/col";
    import BCard from "bootstrap-vue/src/components/card/card";
    import BTable from "bootstrap-vue/src/components/table/table";
    import BLink from "bootstrap-vue/src/components/link/link";
    import BForm from "bootstrap-vue/src/components/form/form";
    import BFormInput from "bootstrap-vue/src/components/form-input/form-input";
    import BFormInvalidFeedback from "bootstrap-vue/src/components/form/form-invalid-feedback";
    import BFormGroup from "bootstrap-vue/src/components/form-group/form-group";
    import userResource from "../../api/userResource";
    import Flag from "../../components/Flag";
    import { computeKeyPassword, getRandomSrpVerifier, reformatKey } from "../../sycrypto/sycrypto";

    export default {
        name: "Users_Settings_View",
        components: {
            BFormGroup,
            BFormInvalidFeedback,
            BFormInput, BForm, BLink, BTable, BCard, BCol, BRow, BButton, BModal, BContainer, Flag },
        data () {
            return {
                newEmail: '',
                emailAvailable: true,
                currentPassword: '',
                newPassword: '',
                loading: false,
                keypairsTable: {
                    sortBy: 'number',
                    fields: [
                        { key: 'number', sortable: true },
                        { key: 'type', sortable: true, class: 'text-center' },
                        { key: 'purpose', sortable: true, class: 'text-center' },
                        { key: 'valid', sortable: true, class: 'text-center' },
                        { key: 'created', class: 'text-center' },
                        { key: 'pubKey', label: 'Pub Key', class: 'text-center' },
                        { key: 'revCert', label: 'Revocation Cert', class: 'text-center' },
                        { key: 'encPrivKey', label: 'Enc Priv Key', class: 'text-center' },
                        { key: 'salt', label: 'Passphrase Salt', class: 'text-center' },
                        { key: 'options' }
                    ]
                }
            }
        },
        computed: {
            ...mapState('storageProviders', [
                'dropbox'
            ]),
            username () {
                return this.$store.getters['auth/username'];
            },
            defaultSP () {
                return this.$store.getters['auth/userConfig'].defaultSP;
            },
            isDropboxAuthenticated () {
                return !!this.dropbox.accessToken;

            }
        },
        validations: {
            newEmail: { required, email, emailAvailable (value) { return this.emailAvailable; } },
            currentPassword: { required, minLength: minLength(3) },
            newPassword: { required, minLength: minLength(3) }
        },
        methods: {
            ...mapActions([
                'fetchKeypairs'
            ]),
            keypairsTableItemsProvider () {
                const kk = this.$store.state.encKeypairs;
                const items = [];
                if (kk) {
                    kk.map(function (value) {
                        items.push(value);
                    })
                }
                return items;
            },
            submitChangeEmail () {
                this.$v.newEmail.$touch();
                if (this.$v.newEmail.$invalid) {
                    return false;
                }

                (async () => {
                    this.loading = true;
                    const email = this.newEmail;

                    try {
                        this.$notify({ group: 'main', clean: true });
                        this.$notify({
                            group: 'main',
                            title: 'Thank you!',
                            text: 'Hang on…',
                            type: 'info',
                            duration: -1
                        });

                        const res = await userResource.changeEmail({ NewEmail: email });

                        if (res.response === true) {
                            this.$refs.checkMailModal.show();
                        }

                        this.$notify({ group: 'main', clean: true });
                    } catch(e) {
                        this.$notify({ group: 'main', clean: true });
                        this.$notify({
                            group: 'main',
                            title: 'Something went wrong…',
                            text: e.message + (e.errors ? '\n' + JSON.stringify(e.errors) : ''),
                            type: 'error',
                            duration: -1
                        });
                        console.error(e);
                    }

                    this.loading = false;
                })();
            },
            submitChangePassword () {
                this.$v.newPassword.$touch();
                if (this.$v.newPassword.$invalid) {
                    return false;
                }

                (async () => {
                    this.loading = true;
                    const currentPassword = this.currentPassword;
                    const newPassword = this.newPassword;
                    this.currentPassword = '';
                    this.newPassword = '';
                    const username = this.$store.getters['auth/username'];

                    try {
                        this.$notify({
                            group: 'main',
                            title: 'Authenticating…',
                            text: null,
                            type: 'info',
                            duration: 4000
                        });

                        const loginInfo = await this.$store.dispatch('auth/loginInfo', this.$store.getters['auth/username']);
                        const salt = loginInfo.salt;
                        const tryAuth = await this.$store.dispatch('auth/getSrp', { loginString: username, password: currentPassword, options: { ChangePassword: true } });

                        this.$notify({
                            group: 'main',
                            title: 'Generating your new SRP verifier…',
                            text: '',
                            type: 'info',
                            duration: 4000
                        });

                        const verifier = await getRandomSrpVerifier(loginInfo.modulus, { username, password: newPassword, salt });
                        const newPHash = await computeKeyPassword(newPassword, verifier.salt);

                        this.$notify({
                            group: 'main',
                            title: 'Updating your private keys…',
                            text: 'Hang on…',
                            type: 'info',
                            duration: 4000
                        });

                        await this.$store.dispatch('fetchKeypairs', { username, widgets: [] });
                        let kk = await this.$store.dispatch('decryptKeypairs');
                        /*kk = kk.reduce(function (accumulator, k) {
                            return k && k.priv_key ? accumulator.push(k) : accumulator;
                        }, []);*/
                        const promises = _.cloneDeep(kk).map(function (k) {
                            return computeKeyPassword(newPHash, k.salt)
                                .then((privKeyEncKey) => {
                                    return reformatKey(
                                        k.priv_key,
                                        { name: k.priv_key.users[0].userId.name, email: k.priv_key.users[0].userId.email },
                                        privKeyEncKey
                                    )
                                })
                                .then((reformattedPrivKey) => {
                                    return _.assign(k, { reformattedPrivKey });
                                })
                                .catch((e) => {
                                    console.error(e);
                                    return e;
                                });
                        });

                        kk = await Promise.all(promises);

                        const changeRes = await userResource.changePassword({
                            ChangePasswordAuth: tryAuth.data.Options.PasswordChangeAuth,
                            Verifier: verifier.verifier,
                            Salt: verifier.salt,
                            Keypairs: kk.map(function (k) {
                                return !k.reformattedPrivKey ? null : {
                                    number: k.number,
                                    enc_priv_key: k.reformattedPrivKey
                                };
                            })
                        });

                        if (changeRes.Response === true) {
                            await this.$store.commit('auth/setPasswordHash', newPHash);
                            this.$notify({
                                group: 'main',
                                title: 'Password changed',
                                text: null,
                                type: 'success',
                                duration: 4000
                            });
                        }
                    } catch (e) {
                        console.error(e);
                    }

                    this.loading = false;
                })();
            },
            connect (id) {
                this.$store.dispatch('storageProviders/requestAccessUrl', id)
                    .then((url) => {
                        window.open(url, '_blank');
                    });
            },
            disconnect (id) {
                this.$store.dispatch('storageProviders/revokeAccess', id);
            },
            makeDefault (id) {
                this.$store.dispatch('storageProviders/makeDefault', id);
            }
        },
        created () {
            // Check if the router pushed to here after an oauth redirect
            if (this.dropbox.authResponse) {
                this.$store.dispatch('storageProviders/consumeAuthResponse', 'dropbox');
            }

            // Prepare a debounced email check function
            this.checkEmailAvailable = _.debounce(() => {
                if (this.newEmail === '') { this.emailAvailable = true; return; }
                this.$store.dispatch('auth/emailAvailable', this.newEmail).then((data) => {
                    this.emailAvailable = data.available;
                }).catch((data) => {
                    this.emailAvailable = true;
                    console.log(data);
                });
            }, 1000);
        },
        mounted () {
            document.title = `Settings - ${ this.username } - ${ this.$store.getters.appTitle }`;

            this.fetchKeypairs({ username: this.username, widgets: [] }).catch((e) => {
                this.$notify({
                    group: 'main',
                    title: 'Something went wrong…',
                    text: e,
                    type: 'error',
                    duration: 4000
                });
                console.warn(e);
            }).finally(() => {
                this.$refs.keypairsTable.refresh();
            });
        }
    }

</script>

<style lang="scss" scoped>

    code {
        word-break: normal;
    }

</style>
