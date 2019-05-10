<template>
    <b-card v-if="!isOkToRun" bg-variant="light" text-variant="danger" class="text-center shadow">
        <h4>• {{ info.name }} •</h4>
        <b-button :to="`/s/view/${info.script_uid}`" target="_blank" size="sm" variant="outline-info">Reference</b-button>
        <b-button @click="confirmRun" size="sm" variant="outline-danger">Run it</b-button>
        <p>This script needs potentially dangerous permissions. Please read its reference page and make sure it doesn't contain harmful code before run it.</p>
    </b-card>
    <b-card v-else :class="{ special: special === 'ctl' }" @click="showOptions = false" no-body class="shadow">
        <b-spinner v-if="loading" class="loading-spinner" label="Loading…" variant="danger"></b-spinner>
        <div class="iframe-box"><iframe :id="'frame-' + info.widget_uid" ref="iframe" :name="info.widget_uid" :sandbox="special === 'ctl' ? false : sandbox" @load="iframeLoaded"></iframe></div>
        <div slot="footer">
            <span><span>{{ info.name }}</span></span>

            <span class="float-right">
                <span class="mr-1" style="font-size: 0.8rem; opacity: 0.6;">{{ info.widget_uid }}</span>
                <span :id="`${info.widget_uid}-options-button`" @click="showOptions = !showOptions" class="mr-1" style="cursor: pointer;"><font-awesome-icon :icon="['fas', 'bars']" /></span>
                <span :id="`${info.widget_uid}-handle`"><font-awesome-icon :icon="['fas', 'arrows-alt']" /></span>
            </span>

            <div class="data-lights-container position-absolute">
                <div ref="inputLight" :class="{ invisible: !lights.input.on }" class="light" style="background-color: aquamarine;"></div>
                <div ref="outputLight" :class="{ invisible: !lights.output.on }" class="light" style="background-color: orange;"></div>
            </div>
        </div>

        <b-popover :container="`viewContainer`" :target="`${info.widget_uid}-options-button`" placement="auto">
            <b-list-group>
                <b-list-group-item :href="`/s/view/${info.script_uid}`" target="_blank" variant="info">Reference</b-list-group-item>
                <b-list-group-item v-if="!tryMode && !special" :id="`storage-${info.widget_uid}-button`" button variant="info">Storage…</b-list-group-item>
                <b-list-group-item v-if="!special" :id="`delete-${info.widget_uid}-button`" button variant="danger">Delete…</b-list-group-item>
            </b-list-group>
        </b-popover>
        <b-popover v-if="!tryMode && !special" :container="`viewContainer`" :target="`storage-${info.widget_uid}-button`" placement="auto">
            <b-list-group>
                <b-list-group-item :active="!info.config.sP" :disabled="!info.config.sP" @click="setSP(null)" button variant="info">Default</b-list-group-item>
                <b-list-group-item v-for="(s, key) in availableStorages" :key="key" :active="key === info.config.sP" :disabled="key === info.config.sP" @click="setSP(key)" button variant="info">{{ s.name }}</b-list-group-item>
            </b-list-group>
        </b-popover>
        <b-popover v-if="!special" :container="`viewContainer`" :target="`delete-${info.widget_uid}-button`" placement="auto">
            <p>Delete <code>{{ info.name }} @ {{ info.widget_uid }}</code>?
                You will lose eventual saved data.</p>
            <b-button @click="deleteWidget(info.widget_uid)" variant="danger">Yes</b-button>
        </b-popover>

    </b-card>
</template>

<script>

    import _ from 'lodash';
    import contentResource from '../api/contentResource';
    import BSpinner from "bootstrap-vue/src/components/spinner/spinner";
    import BPopover from "bootstrap-vue/src/components/popover/popover";
    import BListGroup from "bootstrap-vue/src/components/list-group/list-group";
    import BListGroupItem from "bootstrap-vue/src/components/list-group/list-group-item";
    import BCard from "bootstrap-vue/src/components/card/card";
    import BButton from "bootstrap-vue/src/components/button/button";
    import { BOARD_CTL_SCRIPT_UID, SANDBOX_TOKENS } from '../constants';

    export default {
        name: "Widget",
        components: { BButton, BCard, BListGroupItem, BListGroup, BPopover, BSpinner },
        props: {
            info: Object,
            bus: Object,
            tryMode: {
                type: Boolean,
                default: false
            }
        },
        data () {
            return {
                runDangerous: false,
                channel: null,
                lights: {
                    input: { on: false, debounceOff: null },
                    output: { on: false, debounceOff: null }
                },
                loading: false,
                showOptions: false
            }
        },
        computed: {
            special () {
                return this.info.script_uid === BOARD_CTL_SCRIPT_UID ? 'ctl' : false;
            },
            sandbox () {
                let sand = '';
                for (const s in this.info.sandbox) {
                    sand += (this.info.sandbox[s] ? (SANDBOX_TOKENS[s] + ' ') : '');
                }
                return sand;
            },
            dangerous () {
                for (const s in this.info.sandbox) {
                    if (s > 4 && this.info.sandbox[s]) {
                        return true;
                    }
                }
                return false;
            },
            isOkToRun () {
                return !this.dangerous || this.info.runDangerous || this.runDangerous || this.info.config.okToRun === true;
            },
            availableStorages () {
                return this.$store.getters['storageProviders/available'];
            }
        },
        methods: {
            confirmRun () {
                this.runDangerous = true;
                this.getHtml();

                if (/^w/.exec(this.info.widget_uid) && !this.tryMode && !this.info.config.okToRun) {
                    this.info.config.okToRun = true;
                    this.$root.$emit('saveWidgetsConfigs', [this.info.widget_uid]);
                }
            },
            getHtml () {
                this.loading = true;

                const th1s = this;
                contentResource.getHtml({ uid: this.info.script_uid, type: 'code' })
                    .then(function (data) {
                        th1s.$refs.iframe.src = URL.createObjectURL(new Blob([data], { type: 'text/html' }));
                    })
                    .catch(function (e) {
                        th1s.$refs.iframe.src = URL.createObjectURL(new Blob([JSON.stringify(e)], { type: 'text/html' }));
                    });
            },
            iframeLoaded () {
                window.URL.revokeObjectURL(this.$refs.iframe.src);

                this.channel = new MessageChannel();
                this.channel.port1.onmessage = this.messageFromFrame;
                this.$refs.iframe.contentWindow.postMessage({ type: 'initPort' }, '*', [this.channel.port2]);

                this.bus.$off(`>${ this.info.widget_uid }`);
                this.bus.$on(`>${ this.info.widget_uid }`, this.messageToFrame);

                this.loading = false;
            },
            messageFromFrame (evt) {
                const th1s = this;
                switch (evt.data.type) {
                    case 'output':
                        this.bus.$emit('widgetOutput', { source: { script: this.info.script_uid, widget: this.info.widget_uid }, content: evt.data.content });
                        break;
                    case 'fetchStorage':
                        if (!/^w/.exec(this.info.widget_uid) || this.tryMode) {
                            break;
                        }

                        const sP = this.info.config.sP || this.$store.getters['auth/defaultSP'];
                        if (this.availableStorages[sP]) {
                            this.$store.dispatch('storageProviders/fetchStorage', { wInfo: this.info })
                                .then((decr) => {
                                    const data = { code: 3000, data: decr };
                                    th1s.$refs.iframe.contentWindow.postMessage({ type: 'storage', content: data }, '*');
                                })
                                .catch((e) => {
                                    console.warn(e);

                                    const data = { code: 4000, error: JSON.parse(JSON.stringify(e)) };
                                    th1s.$refs.iframe.contentWindow.postMessage({ type: 'storage', content: data }, '*');
                                });
                        }
                        break;
                    case 'saveStorage':
                        if (!/^w/.exec(this.info.widget_uid) || this.tryMode) {
                            break;
                        }

                        if (_.isEmpty(this.availableStorages)) {
                            this.$notify({
                                group: 'main',
                                title: 'It seems you have not set up a storage provider yet.',
                                text: 'You can fix this in your settings.',
                                type: 'warn',
                                duration: 10000
                            });
                        } else {
                            this.$store.dispatch('storageProviders/saveStorage', {
                                wInfo: this.info,
                                data: evt.data.content
                            });
                        }
                        break;
                    default: break;
                }
                this.lights.output.on = true;
                this.lights.output.debounceOff();
            },
            messageToFrame ({ source, content = null }) {
                this.channel.port1.postMessage({ source, content });
                this.lights.input.on = true;
                this.lights.input.debounceOff();
            },
            setSP (id) {
                this.$set(this.info.config, 'sP', id);
                this.$emit('update:info', this.info);
                this.$root.$emit('saveWidgetsConfigs', [this.info.widget_uid]);
            },
            deleteWidget (uid) {
                this.showOptions = false;
                if (/^w/.exec(this.info.widget_uid) && !this.tryMode) {
                    this.$store.dispatch('storageProviders/deleteWidgetStore', this.info)
                        .catch((e) => {
                            // Just handle the exception gracefully. Dropbox throws errors even if the file is not found
                            console.warn(e);
                        })
                        .then(() => {
                            this.$root.$emit('deleteWidget', uid);
                        });
                } else {
                    this.$root.$emit('deleteWidget', uid);
                }
            }
        },
        created: function () {
            _.forIn(this.lights, (value) => {
                value.debounceOff = _.debounce(() => {
                    value.on = false;
                }, 150);
            });
        },
        mounted: function () {
            if (this.isOkToRun) {
                this.getHtml();
            }
        },
        beforeDestroy: function () {
            this.bus.$off(`>${this.info.widget_uid}`);
        }
    }

</script>

<style scoped lang="scss">

    @import "../sass/_config/variables";

    .card {
        height: 100%;
        overflow: hidden;
        width: 100%;

        &.special {
            background-color: $DarkColor;
            .card-footer {
                background-color: darken($DarkColor, 5%);
            }
        }

        .data-lights-container {
            bottom: 0;
            display: flex;
            left: 0;
            right: 0;
            .light {
                height: 2px;
                width: 50%;
            }
        }

        .loading-spinner {
            bottom: 0;
            height: 6rem;
            left: 0;
            margin: auto;
            position: absolute;
            right: 0;
            top: 0;
            width: 6rem;
        }
    }

    iframe {
        border: none;
        height: 100%;
        max-height: 100%;
        max-width: 100%;
        min-height: 0;
        min-width: 0;
        width: 100%;
        position: absolute;
    }

    .iframe-box {
        overflow: auto;
        overflow-x: hidden;
        -webkit-overflow-scrolling: touch;
        width: 100%;
        height: 100%;
        position: relative;
    }

</style>
