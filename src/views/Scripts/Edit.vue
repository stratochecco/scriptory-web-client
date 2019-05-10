<template>
    <b-container id="viewContainer">
        <b-card no-body>
            <b-tabs v-if="scriptData" card>
                <b-tab title="Info" id="info-tab">
                    <b-input-group prepend="Name" class="mb-4">
                        <b-form-input v-model="scriptData.name" :state="!$v.scriptData.name.$invalid" type="text" placeholder=""></b-form-input>
                        <b-form-invalid-feedback v-if="!$v.scriptData.name.required">
                            Give this script a name!
                        </b-form-invalid-feedback>
                        <b-form-invalid-feedback v-if="!$v.scriptData.name.maxLength">
                            The name cannot be longer than 256 characters.
                        </b-form-invalid-feedback>
                        <b-form-invalid-feedback v-if="!$v.scriptData.name.minLength">
                            The name cannot be shorter than 3 characters.
                        </b-form-invalid-feedback>
                    </b-input-group>
                    <p>This widget needs: <a href="https://www.w3schools.com/tags/att_iframe_sandbox.asp" target="_blank"><em style="opacity: 0.6;">(sandbox attributes)</em></a></p>
                    <b-button-group vertical size="sm" class="mb-4">
                        <b-button v-for="btn in sandboxBtns" :pressed.sync="scriptData.sandbox[btn.key]" :variant="btn.variant" :key="btn.key">
                            {{ btn.caption }}
                        </b-button>
                    </b-button-group>
                    <p>Do you wish this script to be available for everyone?</p>
                    <b-button :pressed.sync="scriptData.public" variant="outline-warning" class="mb-4">Public</b-button>
                    <b-input-group prepend="Tags" class="mb-4">
                        <b-form-input v-model="scriptData.tags_string" :state="!$v.scriptData.tags_string.$invalid" type="text" placeholder="comma,separated,tags"></b-form-input>
                        <b-form-invalid-feedback v-if="!$v.scriptData.tags_string.maxLength">
                            The tags string cannot be longer than 200 characters.
                        </b-form-invalid-feedback>
                    </b-input-group>
                    <p>Description:</p>
                    <DescMarkdown v-model="scriptData.desc"></DescMarkdown>
                </b-tab>
                <b-tab no-body title="Code">
                    <codemirror v-model="scriptData.code" :options="cmCodeOptions"></codemirror>
                    <b-card-footer>
                        <b-row>
                            <b-col cols="9">
                                <b-button-toolbar>
                                    <b-button-group size="sm" class="mx-1">
                                        <b-button variant="outline-light" @click="beautify">Beautify</b-button>
                                    </b-button-group>
                                </b-button-toolbar>
                            </b-col>
                            <b-col>
                                <span class="float-right"><em>ctrl</em> shows hints</span>
                            </b-col>
                        </b-row>
                    </b-card-footer>
                </b-tab>
                <b-tab no-body id="preview-tab" title="Preview" class="pt-2" @click="() => { if (!testWidget) { reloadTest(); } }">
                    <b-button id="reload-button" variant="outline-success" @click="reloadTest" class="position-absolute ml-2"><font-awesome-icon :icon="['fas', 'sync']" /></b-button>
                    <Board v-if="testWidget" :key="testBoardKey" :test-widget="testWidget" mode="try" @layout-updated="layoutUpdated"></Board>
                    <b-card-footer>
                        <b-row>
                            <b-col>
                                <span class="float-left"><em>The widget dimension you set here will be the default</em></span>
                            </b-col>
                        </b-row>
                    </b-card-footer>
                </b-tab>
                <template slot="tabs">
                    <b-nav-item disabled><b-badge :variant="autosaveText === 'Saved' ? 'success' : 'danger'">{{ autosaveText }}</b-badge></b-nav-item>
                </template>
            </b-tabs>
        </b-card>
    </b-container>
</template>

<script>

    import _ from 'lodash';
    import { maxLength, minLength, required } from 'vuelidate/lib/validators';
    import { codemirror } from 'vue-codemirror'
    import 'codemirror/keymap/sublime.js'
    import 'codemirror/mode/htmlmixed/htmlmixed.js'
    import 'codemirror/theme/3024-night.css'
    import 'codemirror/addon/edit/matchbrackets.js'
    import 'codemirror/addon/edit/closebrackets.js'
    import 'codemirror/addon/edit/matchtags.js'
    import 'codemirror/addon/edit/closetag.js'
    import 'codemirror/addon/fold/foldgutter.css'
    import 'codemirror/addon/fold/brace-fold.js'
    import 'codemirror/addon/fold/comment-fold.js'
    import 'codemirror/addon/fold/foldcode.js'
    import 'codemirror/addon/fold/foldgutter.js'
    import 'codemirror/addon/fold/indent-fold.js'
    import 'codemirror/addon/fold/markdown-fold.js'
    import 'codemirror/addon/fold/xml-fold.js'
    import 'codemirror/addon/runmode/colorize.js'
    import 'codemirror/addon/hint/show-hint.css'
    import 'codemirror/addon/hint/show-hint.js'
    import 'codemirror/addon/hint/javascript-hint.js'
    import 'codemirror/addon/hint/html-hint.js'
    import 'codemirror/addon/hint/css-hint.js'
    import 'codemirror/addon/selection/mark-selection.js'
    import 'codemirror/addon/selection/active-line.js'
    import 'codemirror/addon/scroll/annotatescrollbar.js'
    import 'codemirror/addon/search/matchesonscrollbar.js'
    import 'codemirror/addon/search/searchcursor.js'
    import 'codemirror/addon/search/match-highlighter.js'
    import 'codemirror/addon/search/search.js'
    import 'codemirror/mode/clike/clike.js'
    import 'codemirror/addon/edit/matchbrackets.js'
    import 'codemirror/addon/comment/comment.js'
    import 'codemirror/addon/dialog/dialog.js'
    import 'codemirror/addon/dialog/dialog.css'
    //import 'codemirror/addon/lint/lint.js'
    //import 'codemirror/addon/lint/lint.css'
    import BContainer from "bootstrap-vue/src/components/layout/container";
    import BCard from "bootstrap-vue/src/components/card/card";
    import BTab from "bootstrap-vue/src/components/tabs/tab";
    import BTabs from "bootstrap-vue/src/components/tabs/tabs";
    import BInputGroup from "bootstrap-vue/src/components/input-group/input-group";
    import BFormInvalidFeedback from "bootstrap-vue/src/components/form/form-invalid-feedback";
    import BFormInput from "bootstrap-vue/src/components/form-input/form-input";
    import BButtonGroup from "bootstrap-vue/src/components/button-group/button-group";
    import BButton from "bootstrap-vue/src/components/button/button";
    import BCardFooter from "bootstrap-vue/src/components/card/card-footer";
    import BRow from "bootstrap-vue/src/components/layout/row";
    import BCol from "bootstrap-vue/src/components/layout/col";
    import BButtonToolbar from "bootstrap-vue/src/components/button-toolbar/button-toolbar";
    import BBadge from "bootstrap-vue/src/components/badge/badge";
    import BNavItem from "bootstrap-vue/src/components/nav/nav-item";
    const beautify = require('js-beautify').html;
    import { CODEMIRROR_CODE_OPTIONS } from "../../constants";
    import contentResource from '../../api/contentResource';
    import DescMarkdown from "../../components/DescMarkdown";
    import Board from '../../components/board/Board';

    export default {
        name: "Scripts_Edit_View",
        components: {
            BNavItem,
            BBadge,
            BButtonToolbar,
            BCol,
            BRow,
            BCardFooter,
            BButton,
            BButtonGroup,
            BFormInput,
            BFormInvalidFeedback,
            BInputGroup,
            BTabs,
            BTab,
            BCard,
            BContainer,
            codemirror,
            Board,
            DescMarkdown
        },
        data () {
            return {
                sandboxBtns: [
                    { variant: 'outline-success', caption: 'scripts', state: false, key: 1 },
                    { variant: 'outline-success', caption: 'forms', state: false, key: 2 },
                    { variant: 'outline-success', caption: 'modals', state: false, key: 3 },
                    { variant: 'outline-success', caption: 'popups', state: false, key: 4 },
                    { variant: 'outline-warning', caption: 'popups-to-escape-sandbox', state: false, key: 5 },
                    { variant: 'outline-warning', caption: 'presentation', state: false, key: 6 },
                    { variant: 'outline-warning', caption: 'pointer-lock', state: false, key: 7 },
                    { variant: 'outline-warning', caption: 'orientation-lock', state: false, key: 8 },
                    { variant: 'outline-danger', caption: 'same-origin', state: false, key: 9 },
                    { variant: 'outline-danger', caption: 'top-navigation', state: false, key: 10 },
                    { variant: 'outline-danger', caption: 'storage-access-by-user-activation', state: false, key: 11 }
                ],
                cmCodeOptions: CODEMIRROR_CODE_OPTIONS,

                autosaveText: '',
                testWidget: null,
                testBoardKey: 0,
                scriptData: null
            }
        },
        validations: {
            scriptData: {
                name: { required, maxLength: maxLength(256), minLength: minLength(3) },
                tags_string: { maxLength: maxLength(200) }
            }
        },
        methods: {
            beautify: function (evt) {
                this.scriptData.code = beautify(this.scriptData.code, { indent_size: 4 });
            },
            fetchScriptData: function () {
                contentResource.getScriptEdit(this.$route.params.uid)
                    .then(res => {
                        this.scriptData = res.data;
                        document.title = this.scriptData.name + ' - ' + this.$store.getters.appTitle;
                    });
            },
            sendData: _.debounce(function () {
                if (this.$v.scriptData.$invalid) {
                    return false;
                }

                const data = {
                    uid: this.$route.params.uid,
                    name: this.scriptData.name,
                    tags_string: this.scriptData.tags_string,
                    public: this.scriptData.public,
                    sandbox: this.scriptData.sandbox,
                    dimensions: this.scriptData.dimensions,
                    desc: this.scriptData.desc,
                    code: this.scriptData.code
                };
                this.autosaveText = 'Saving…';
                const th1s = this;
                contentResource.saveScriptEdit(data)
                    .then(function (res) {
                        th1s.autosaveText = 'Saved';
                        document.title = th1s.scriptData.name + ' - ' + th1s.$store.getters.appTitle;
                    })
                    .catch(function (e) {
                        th1s.autosaveText = 'Error: ' + e.message;
                    });
            }, 2000),
            reloadTest: function () {
                this.testWidget = this.$route.params.uid;
                this.testBoardKey += 1;
            },
            layoutUpdated: function (newLayout) {
                this.scriptData.dimensions.w = newLayout[0].w;
                this.scriptData.dimensions.h = newLayout[0].h;
            }
        },
        beforeRouteEnter (to, from, next) {
            if (!to.params.uid) {
                // No script id given. We create a new one.
                contentResource.getScriptEdit('')
                    .then(res => {
                        next('/s/edit/' + res.data.uid);
                    });
            } else {
                next();
            }
        },
        created () {
            this.fetchScriptData();
        },
        watch: {
            '$route': 'fetchScriptData',
            scriptData: {
                handler: function (val, oldVal) {
                    if (oldVal !== null) {
                        this.autosaveText = 'Not saved yet';
                        this.sendData();
                    }
                },
                deep: true
            }
        }
    }

</script>

<style scoped lang="scss">

    @import "../../sass/_config/variables";

    #viewContainer {
        max-width: 100%;
    }

    #preview-tab {
        background-color: darken($SecondaryColor, 5%);
    }

    #reload-button {
        z-index: 1;
    }

</style>

<style lang="css">

    @import '../../../node_modules/codemirror/lib/codemirror.css';

    .CodeMirror {
        height: auto;
    }

    .CodeMirror-scroll {
        max-height: 80vh;
        min-height: 30vh;
    }

</style>
