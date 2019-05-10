<template>
    <b-container v-if="scriptData" id="viewContainer">
        <b-card class="mb-4 shadow header-card">
            <b-row>
                <b-col md="8" class="mb-2">
                    <h3>{{ scriptData.name }}</h3>
                    <Flag width="40px" :quarters="scriptData.user.flag" class="float-left mr-1"></Flag>
                    <h5 style="opacity: 0.4;">by <b-link :to="`/u/profile/${scriptData.user.username}`">{{ scriptData.user.username }}</b-link></h5>
                    <hr class="mt-4">
                    <template v-if="scriptData['tags'].length">
                        <div class="mt-1">
                            <span v-for="t in scriptData['tags']" :key="t.text" class="tag-string mr-2">#{{ t.text }}</span>
                        </div>
                        <hr>
                    </template>
                    <span>This script needs: </span>
                    <b-badge v-for="b in sandboxBadges" :key="b.key" :variant="b.variant" class="mr-1">{{ b.text }}</b-badge>
                    <hr>
                    <b-button :to="`/s/try/${scriptData.uid}`" variant="success" >Try <font-awesome-icon :icon="['fas', 'play']" /></b-button>
                    <b-button ref="copyBtn" @click="clone" :disabled="cloning" variant="outline-light" >Clone <font-awesome-icon :icon="['fas', 'code-branch']" /></b-button>
                </b-col>
                <b-col md="4">
                    <template>
                        <hr>
                        <h1>{{ scriptData.popularity }}</h1>
                        <p>widget{{ +scriptData.popularity !== 1 ? 's' : '' }} out there {{ +scriptData.popularity !== 1 ? 'are' : 'is' }} rocking this script</p>
                        <hr>
                        <p>created on {{ scriptData.created | moment("YYYY.MM.DD") }}</p>
                    </template>
                </b-col>
            </b-row>
        </b-card>
        <b-card class="shadow mb-4">
            <b-row>
                <b-col><div v-html="markedDesc"></div></b-col>
            </b-row>
        </b-card>
        <b-button v-if="!codeShown" @click="showCode" variant="dark">Show code <font-awesome-icon :icon="['fas', 'file-code']" /></b-button>
        <codemirror v-else v-model="scriptData.code" :options="cmCodeOptions"></codemirror>
    </b-container>
</template>

<script>

    import _ from 'lodash';
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
    import BContainer from "bootstrap-vue/src/components/layout/container";
    import BCard from "bootstrap-vue/src/components/card/card";
    import BRow from "bootstrap-vue/src/components/layout/row";
    import BCol from "bootstrap-vue/src/components/layout/col";
    import BButton from "bootstrap-vue/src/components/button/button";
    import BLink from "bootstrap-vue/src/components/link/link";
    import BBadge from "bootstrap-vue/src/components/badge/badge";
    const marked = require('marked');
    import contentResource from '../../api/contentResource';
    import Flag from "../../components/Flag";
    import { CODEMIRROR_CODE_OPTIONS, SANDBOX_TOKENS } from '../../constants';

    export default {
        name: "Scripts_View_View",
        components: { BBadge, BLink, BButton, BCol, BRow, BCard, BContainer, Flag, codemirror },
        data () {
            return {
                scriptData: null,
                cloning: false,
                codeShown: false,
                cmCodeOptions: _.merge(_.cloneDeep(CODEMIRROR_CODE_OPTIONS), { readOnly: true })
            }
        },
        computed: {
            sandboxBadges () {
                const bb = [];
                for (const [key, s] of Object.entries(this.scriptData.sandbox)) {
                    if (s) {
                        bb.push({ key: key, text: SANDBOX_TOKENS[key], variant: key <= 4 ? 'success' : (key <= 8 ? 'warning' : 'danger') });
                    }
                }

                return bb;
            },
            markedDesc () {
                return marked(this.scriptData.desc, {
                    "headerIds": false,
                    "langPrefix": "language-",
                    "sanitize": true
                });
            }
        },
        methods: {
            clone () {
                this.cloning = true;
                const th1s = this;
                contentResource.cloneScript(this.$route.params.uid)
                    .then((res) => {
                        th1s.$notify({
                            group: 'main',
                            title: res.Message,
                            text: null,
                            type: res.Code === 1000 ? 'success' : 'warn',
                            duration: 4000
                        });
                    })
                    .catch((e) => {
                        console.error(e);
                    })
                    .finally(() => {
                        th1s.cloning = false;
                    });
            },
            showCode () {
                this.codeShown = true;
            }
        },
        beforeRouteEnter (to, from, next) {
            contentResource.getScriptReference(to.params.uid)
                .then(res => {
                    next(vm => {
                        vm.scriptData = res.script;
                    });
                })
                .catch((e) => {
                    next(`/explore`);
                });
        },
        watch: {
            scriptData: function () {
                document.title = this.scriptData.name + ' - ' + this.$store.getters.appTitle;
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

    .tag-string {
        font-weight: 600;
        opacity: 0.8;
    }

</style>

<style lang="css">

    @import '../../../node_modules/codemirror/lib/codemirror.css';

    .CodeMirror {
        border-radius: 0.25rem;
        height: auto;
    }

    .CodeMirror-scroll {
        max-height: 80vh;
        min-height: 30vh;
    }

</style>
