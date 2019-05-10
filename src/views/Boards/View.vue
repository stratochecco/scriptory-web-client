<template>
    <b-container v-if="boardData" id="viewContainer">
        <b-card v-if="own" class="mb-4 shadow">
            <b-button :disabled="!unsaved || $v.boardData.$invalid" variant="outline-info" @click="save">Save</b-button>
            <hr>
            <b-input-group prepend="Name" class="mb-4">
                <b-form-input v-model="boardData.name" :state="!$v.boardData.name.$invalid" type="text" placeholder=""></b-form-input>
                <b-form-invalid-feedback v-if="!$v.boardData.name.required">
                    Give this board a name!
                </b-form-invalid-feedback>
                <b-form-invalid-feedback v-if="!$v.boardData.name.maxLength">
                    The name cannot be longer than 256 characters.
                </b-form-invalid-feedback>
            </b-input-group>
            <b-form-textarea v-model="boardData.description" :state="!$v.boardData.description.$invalid" rows="3" max-rows="3" placeholder="Description…" class="mb-4"></b-form-textarea>
            <b-form-invalid-feedback v-if="!$v.boardData.description.maxLength">
                The description cannot be longer than 2048 characters.
            </b-form-invalid-feedback>
            <p>Do you wish this board to be available for everyone?</p>
            <b-button :pressed.sync="boardData.public" variant="outline-warning">Public</b-button>
        </b-card>
        <b-card class="shadow header-card">
            <b-row>
                <b-col md="8" class="mb-2">
                    <h3>{{ boardData.name }}</h3>
                    <Flag width="40px" :quarters="boardData.user.flag" class="float-left mr-1"></Flag>
                    <h5 style="opacity: 0.4;">by <b-link :to="`/u/profile/${boardData.user.username}`">{{ boardData.user.username }}</b-link></h5>
                    <hr class="mt-4">
                    <b-button :to="`/b/try/${boardData.uid}`" variant="success">Try <font-awesome-icon :icon="['fas', 'play']" /></b-button>
                    <b-button v-if="own" :to="`/b/run/${boardData.uid}`" variant="success">Run <font-awesome-icon :icon="['fas', 'play']" /></b-button>
                </b-col>
                <b-col md="4">
                    <template>
                        <p>created on {{ boardData.created | moment("YYYY.MM.DD") }}</p>
                    </template>
                </b-col>
            </b-row>
            <template v-if="boardData.description.length">
                <hr>
                <b-row>
                    <b-col>
                        <span>{{ boardData.description }}</span>
                    </b-col>
                </b-row>
            </template>
        </b-card>
    </b-container>
</template>

<script>

    import { maxLength, required } from 'vuelidate/lib/validators';
    import BContainer from "bootstrap-vue/src/components/layout/container";
    import BCard from "bootstrap-vue/src/components/card/card";
    import BRow from "bootstrap-vue/src/components/layout/row";
    import BCol from "bootstrap-vue/src/components/layout/col";
    import BButton from "bootstrap-vue/src/components/button/button";
    import BLink from "bootstrap-vue/src/components/link/link";
    import BBadge from "bootstrap-vue/src/components/badge/badge";
    import BInputGroup from "bootstrap-vue/src/components/input-group/input-group";
    import BFormInput from "bootstrap-vue/src/components/form-input/form-input";
    import BFormInvalidFeedback from "bootstrap-vue/src/components/form/form-invalid-feedback";
    import BFormTextarea from "bootstrap-vue/src/components/form-textarea/form-textarea";
    import Flag from "../../components/Flag";
    import contentResource from '../../api/contentResource';

    export default {
        name: "Boards_View_View",
        components: { BBadge, BLink, BButton, BCol, BRow, BCard, BContainer, BInputGroup, BFormInput, BFormInvalidFeedback, BFormTextarea, Flag },
        data () {
            return {
                boardData: null,
                unsaved: false
            }
        },
        validations: {
            boardData: {
                name: { required, maxLength: maxLength(256) },
                description: { maxLength: maxLength(2048) }
            }
        },
        computed: {
            own () {
                return this.boardData ? this.boardData.user.username === this.$store.getters['auth/username'] : false;
            }
        },
        methods: {
            save () {
                this.unsaved = false;
                const th1s = this;
                contentResource.saveBoardEdit({ Info: this.boardData }).catch(() => {
                    th1s.unsaved = true;
                });
            }
        },
        beforeRouteEnter (to, from, next) {
            contentResource.getBoardReference(to.params.uid)
                .then(res => {
                    next(vm => {
                        vm.boardData = res.board;
                    });
                })
                .catch((e) => {
                    next(`/explore`);
                });
        },
        watch: {
            boardData: {
                handler: function (val, oldVal) {
                    document.title = `${this.boardData.name} - ${this.$store.getters.appTitle}`;

                    if (oldVal !== null) {
                        this.unsaved = true;
                    }
                },
                deep: true
            }
        }
    }

</script>

<style scoped lang="scss">

    @import "../../sass/_config/variables";

    .header-card {
        border: 1px solid rgba($LightColor, .12);
        border-radius: 0.25rem;
    }

</style>
