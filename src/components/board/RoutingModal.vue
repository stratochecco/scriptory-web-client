<template>
    <b-modal ref="bModal" v-bind="$props">
        <b-input-group prepend="Source" size="sm" class="mb-3">
            <!--
            I think there is a bug in Bootstrap Vue as of v2.0.0rc14. v-model on b-form-select won't act as expected.
            <b-form-select v-model="routesBridge.source" :options="availableSources">
                <template slot="first">
                    <option :value="null" disabled>Select a widget…</option>
                </template>
            </b-form-select>
            -->
            <select v-model="routesBridge.source" class="custom-select">
                <option :value="null" disabled>Select a widget…</option>
                <option v-for="s in availableSources" :value="s.value">{{ s.text }}</option>
            </select>
        </b-input-group>
        <b-table ref="table" :fields="tableData.fields" :items="tableProvider" :responsive="responsiveTable" hover striped>
            <template slot="HEAD_source">
                Source <font-awesome-icon :icon="['fas', 'arrow-alt-circle-right']" />
            </template>
            <template slot="HEAD_destinations">
                <font-awesome-icon :icon="['fas', 'arrow-alt-circle-right']" /> Destinations
            </template>
            <template slot="source" slot-scope="row">
                <b-link @click="deleteRoute([row.item.source.uid])" class="delete-route-button mr-1"><font-awesome-icon :icon="['fas', 'times']" /></b-link>
                <code>{{ row.item.source.text }}</code>
            </template>
            <template slot="destinations" slot-scope="row">
                <b-list-group class="mb-2">
                    <b-list-group-item v-for="(r, index) in row.item.destinations" :key="index">
                        <code>{{ r.text }}</code>
                        <b-link @click="deleteRoute([row.item.source.uid, r.uid])" class="delete-route-button float-right"><font-awesome-icon :icon="['fas', 'times']" /></b-link>
                    </b-list-group-item>
                </b-list-group>
                <b-input-group prepend="Destination" size="sm">
                    <!--
                    <b-form-select v-model="destinationsSelectsValues[row.item.source.uid]" :options="availableDestinations(row.item.source.uid)" @input.native="addDestination([row.item.source.uid, $event])">
                        <template slot="first">
                            <option :value="null" disabled>Select a widget…</option>
                        </template>
                    </b-form-select>
                    -->
                    <select v-model="routesBridge.destinations[row.item.source.uid]" class="custom-select">
                        <option :value="null" disabled>Select a widget…</option>
                        <option v-for="d in availableDestinations(row.item.source.uid)" :value="d.value">{{ d.text }}</option>
                    </select>
                </b-input-group>
            </template>
        </b-table>
    </b-modal>
</template>

<script>

    import _ from 'lodash';

    import BTable from "bootstrap-vue/src/components/table/table";
    import BInputGroup from "bootstrap-vue/src/components/input-group/input-group";
    import BInputGroupText from "bootstrap-vue/src/components/input-group/input-group-text";
    import BListGroup from "bootstrap-vue/src/components/list-group/list-group";
    import BListGroupItem from "bootstrap-vue/src/components/list-group/list-group-item";
    import BFormSelect from "bootstrap-vue/src/components/form-select/form-select";
    import BModal from "bootstrap-vue/src/components/modal/modal";
    import BLink from "bootstrap-vue/src/components/link/link";
    import BFormInput from "bootstrap-vue/src/components/form-input/form-input";

    export default {
        name: "RoutingModal",
        extends: BModal,
        components: {
            BModal,
            BFormInput,
            BLink,
            BFormSelect,
            BListGroupItem,
            BListGroup,
            BInputGroupText,
            BInputGroup,
            BTable
        },
        props: {
            widgets: Array,
            routes: Array
        },
        data () {
            return {
                tableData: {
                    fields: ['source', 'destinations']
                }
            }
        },
        computed: {
            responsiveTable: () => !/(?=.*iPad|iPhone|iPod)(?=.*WebKit)/.test(window.navigator.userAgent) /* fu*k WebKit. I think there's a bug with the overflow in Bootstrap */,
            availableSources () {
                let src = [];
                for (const w of this.widgets) {
                    if (!this.routes.find((r) => r.source === w.info.widget_uid)) {
                        src.push({
                            value: w.info.widget_uid,
                            text: `${ w.info.name } @ ${ w.info.widget_uid }`
                        });
                    }
                }

                return src;
            },
            routesBridge () {
                const th1s = this;
                const o = { destinations: {} };
                Object.defineProperty(o, 'source', {
                    get () {
                        return null;
                    },
                    set (v) {
                        th1s.addSource(v);
                    }
                });
                for (const r of this.routes) {
                    Object.defineProperty(o.destinations, r.source, {
                        get () {
                            return null;
                        },
                        set (v) {
                            th1s.addDestination(r.source, v);
                        }
                    });
                }

                return o;
            }
        },
        methods: {
            // [show, hide] As of 2019 I don't know how to inherit methods from the parent
            show () {
                this.$refs.bModal.show();
            },
            hide () {
                this.$refs.bModal.show();
            },
            availableDestinations (src) {
                let dest = [];
                for (const w of this.widgets) {
                    const route = this.routes.find((r) => r.source === src);
                    if (route && !route.destinations.includes(w.info.widget_uid)) {
                        dest = _.concat(dest, {
                            value: w.info.widget_uid,
                            text: `${ w.info.name } @ ${ w.info.widget_uid }`
                        });
                    }
                }

                return dest;
            },
            tableProvider () {
                let rows = [];
                const th1s = this;
                for (const route of this.routes) {
                    const sourceName = th1s.widgets.find((w) => w.info.widget_uid === route.source).info.name;
                    const destinations = _.map(route.destinations, (uid) => {
                        return {
                            uid: uid,
                            text: th1s.widgets.find(function (w) {
                                return w.info.widget_uid === uid;
                            }).info.name + ' @ ' + uid
                        };
                    });
                    rows.push({ source: { uid: route.source, text: `${sourceName} @ ${route.source}` }, destinations: destinations });
                }

                return rows;
            },
            deleteRoute (evt) {
                if (evt.length === 1) {
                    this.$emit('update:routes', this.routes.filter((r) => r.source !== evt[0]));
                } else if (evt.length === 2) {
                    const routes = _.clone(this.routes);
                    const route = routes.find((r) => r.source === evt[0]);
                    const i = routes.indexOf(route);
                    route.destinations = _.pull(route.destinations, evt[1]);
                    routes[i] = route;
                    this.$emit('update:routes', routes);
                }
            },
            addSource (evt) {
                if (typeof evt === 'string' && evt.length) {
                    this.$emit('update:routes', this.routes.concat({
                        source: evt,
                        destinations: []
                    }));
                }
            },
            addDestination (src, dest) {
                if (typeof src === 'string' && src.length && typeof dest === 'string' && dest.length) {
                    const routes = _.clone(this.routes);
                    const route = routes.find((r) => r.source === src);
                    const i = routes.indexOf(route);
                    route.destinations = route.destinations.concat(dest);
                    routes[i] = route;
                    this.$emit('update:routes', routes);
                }
            }
        },
        watch: {
            routes () {
                if (this.$refs.table) {
                    this.$refs.table.refresh();
                }
            }
        }
    }

</script>

<style lang="scss">

    @import "../../sass/_config/variables";

    .delete-route-button {
        color: $PrimaryColor;
    }

</style>
