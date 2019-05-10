<template>
    <div>
        <BoardGrid :widgets.sync="widgets" :bus="bus" :tryMode="!!testWidget || mode === 'try'" @layout-updated="layoutUpdated"></BoardGrid>

        <AddWidgetModal ref="addWidgetModal" @addWidget="addWidget" title="Add widget" lazy hide-footer size="lg" scrollable></AddWidgetModal>
        <RoutingModal ref="routingModal" :widgets="widgets" :routes.sync="routes" @update:routes="saveRoutes" title="Routes" lazy hide-footer size="lg" scrollable></RoutingModal>

    </div>
</template>

<script>

    import _ from 'lodash';
    import Vue from 'vue';
    import BoardGrid from "./BoardGrid";
    import contentResource from "../../api/contentResource";
    import { BOARD_CTL_SCRIPT_UID } from "../../constants";
    import AddWidgetModal from './AddWidgetModal';
    import RoutingModal from './RoutingModal';

    function cleanRoutes (rr, ww) {
        const uids = ww.map((w) => w.info.widget_uid);
        return rr.reduce((accumulator, r) => {
            if (_.includes(uids, r.source)) {
                accumulator.push({ source: r.source, destinations: r.destinations.filter((r) => _.includes(uids, r)) });
            }

            return accumulator;
        }, []);
    }

    export default {
        name: "Board",
        components: {
            BoardGrid,
            AddWidgetModal,
            RoutingModal
        },
        props: {
            mode: String,
            uid: String,
            testWidget: {
                type: String,
                default: null
            }
        },
        data () {
            return {
                info: null,
                widgets: [],
                routes: [],
                bus: new Vue()
            }
        },
        computed: {
            own () {
                return this.info ? this.info.user.username === this.$store.getters['auth/username'] : false;
            }
        },
        methods: {
            setWidgets (widgets, overwrite = true) {
                let ww = widgets;
                if (!overwrite) {
                    ww = ww.filter((w) => !this.widgets.find((w1) => w1.info.widget_uid  === w.info.widget_uid));
                }
                const mappedWidgets = ww.map((w) => {
                    if (_.isEmpty(w.layout)) {
                        w.layout = _.assign(_.clone(w.info.dimensions), { x: 0, y: 0 });
                    }
                    w.layout.i = w.info.widget_uid;

                    return w;
                });
                if (overwrite) {
                    this.widgets = mappedWidgets;
                } else {
                    this.widgets = this.widgets.concat(mappedWidgets);
                }
            },
            fetchTestWidget (uid) {
                const th1s = this;
                contentResource.getTestWidget(uid)
                    .then((data) => {
                    th1s.setWidgets([data.widget], false);
                })
                    .catch((e) => {
                        th1s.$notify({
                            group: 'main',
                            title: `Could not fetch \`${uid}\`.`,
                            text: e.data.message || e.data.code || 'Unknown error.',
                            type: 'warn',
                            duration: 4000
                        });
                    });
            },
            fetchWidgets (boardUid, overwrite = true) {
                const th1s = this;
                contentResource.boardWidgets(boardUid)
                    .then((data) => {
                        document.title = data.board.name + ' - ' + th1s.$store.getters.appTitle;

                        if (/\/run\//.exec(th1s.$route.path) && data.board.user.username !== th1s.$store.getters['auth/username']) {
                            this.$router.push(`/b/try/${boardUid}`);

                            return;
                        }
                        th1s.info = data.board;
                        th1s.routes = cleanRoutes(data.board.config.routes || [], data.widgets);
                        th1s.setWidgets(data.widgets, overwrite);
                    })
                    .catch(() => {
                        this.$router.push(`/`);
                    });
            },
            saveEdit () {
                contentResource.saveBoardEdit({ Info: this.info });
            },
            reload () {
                if (this.testWidget) {
                    this.fetchTestWidget(this.testWidget);
                } else if (this.uid) {
                    this.fetchWidgets(this.uid);
                }
            },
            layoutUpdated (newLayout) {
                if (this.testWidget) {
                    this.$emit('layout-updated', newLayout);
                } else if (this.uid && this.mode === 'run') {
                    contentResource.saveBoardEdit({ Info: { uid: this.info.uid }, WidgetsData: newLayout.map((l) => ({ uid: l.i, layout: _.pick(l, ['x',  'y', 'w', 'h']) })) });
                }
            },
            outputFromWidget ({ source, content = null }) {
                if (source.script === BOARD_CTL_SCRIPT_UID) {
                    switch (content.action) {
                        case 'getInfo':
                            const info = _.assign(_.pickBy(this.info, (val, key) => {
                                return _.includes(['name', 'description', 'user'], key);
                            }), { own: this.own });
                            this.bus.$emit(`>${ source.widget }`, { source: 'root', content: info });
                            break;
                        case 'setInfo':
                            this.info = _.assign({ uid: this.info.uid }, content.data);
                            document.title = this.info.name + ' - ' + this.$store.getters.appTitle;
                            this.saveEdit();
                            break;
                        case 'openAddWidget':
                            this.openAddWidget();
                            break;
                        case 'openRouting':
                            this.openRouting();
                            break;
                        default: break;
                    }
                } else {
                    this.doRouting({ source, content });
                }
            },
            doRouting ({ source, content }) {
                // If there are no bugs `filter` should always return only one element, but who knows
                for (const r of this.routes.filter((r) => r.source === source.widget)) {
                    for (const d of r.destinations) {
                        this.bus.$emit(`>${d}`, { source, content });
                    }
                }
            },
            openAddWidget () {
                this.$refs.addWidgetModal.show();
            },
            openRouting () {
                this.$refs.routingModal.show();
            },
            addWidget (uid) {
                this.$refs.addWidgetModal.hide();
                switch (this.mode) {
                    case 'try':
                        this.fetchTestWidget(uid);
                        break;
                    case 'run':
                        const th1s = this;
                        contentResource.saveBoardEdit({ Info: { uid: this.info.uid }, Add: [uid] })
                            .then(() => {
                                this.fetchWidgets(th1s.info.uid, false);
                            });
                        break;
                    default: break;
                }
            },
            deleteWidget (uid) {
                this.widgets = _.clone(this.widgets).filter((w) => w.info.widget_uid !== uid);
                //this.layout = _.clone(this.layout).filter((l) => l.i !== uid);
                this.routes = cleanRoutes(this.routes, this.widgets)

                switch (this.mode) {
                    case 'run':
                        contentResource.saveBoardEdit({ Info: { uid: this.info.uid, config: { routes: this.routes } }, Delete: [uid] });
                        break;
                    default: break;
                }
            },
            saveRoutes () {
                switch (this.mode) {
                    case 'run':
                        this.debouncedSaveRoutes();
                        break;
                    default: break;
                }
            },
            saveConfigs (list = []) {
                switch (this.mode) {
                    case 'run':
                        contentResource.saveBoardEdit({ Info: { uid: this.info.uid }, WidgetsData: this.widgets.filter((w) => _.isEmpty(list) || _.includes(list, w.info.widget_uid)).map((w) => ({ uid: w.info.widget_uid, config: w.info.config })) });
                        break;
                    default: break;
                }
            }
        },
        watch: {
            '$route' (to, from) {
                this.reload();
            }
        },
        created: function () {
            const th1s = this;
            this.debouncedSaveRoutes = _.debounce(() => {
                contentResource.saveBoardEdit({ Info: { uid: th1s.info.uid, config: { routes: cleanRoutes(th1s.routes, th1s.widgets) } } });
            }, 4000);
        },
        mounted: function () {
            this.reload();

            this.bus.$on('widgetOutput', this.outputFromWidget);

            this.$root.$on('deleteWidget', this.deleteWidget);
            this.$root.$on('saveWidgetsConfigs', this.saveConfigs);
        },
        beforeDestroy: function () {
            this.bus.$off('widgetOutput');

            this.$root.$off('deleteWidget', this.deleteWidget);
            this.$root.$off('saveWidgetsConfigs', this.saveConfigs);
        }
    }

</script>
