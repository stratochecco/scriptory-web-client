<template>
    <div v-if="widgetsBridge && layoutBridge">
        <grid-layout :layout.sync="layoutBridge"
                     :col-num="12"
                     :row-height="60"
                     :is-draggable="true"
                     :is-resizable="true"
                     :is-mirrored="false"
                     :vertical-compact="true"
                     :margin="[5, 5]"
                     :use-css-transforms="true"
                     :responsive="true"
                     :breakpoints="{ lg: 1440, md: 996, sm: 768, xs: 480, xxs: 0 }"
                     :cols="{ lg: 12, md: 8, sm: 6, xs: 4, xxs: 2 }"
                     @layout-updated="$emit('layout-updated', $event)"
        >
            <grid-item v-for="l in layoutBridge" :key="l.i" :id="`${l.i}-grid-item`" :x="l.x" :y="l.y" :w="l.w" :h="l.h" :i="l.i" :dragAllowFrom="`#${l.i}-handle`">
                <Widget :info.sync="widgetsBridge.find((w) => w.info.widget_uid === l.i).info" :bus="bus" :tryMode="tryMode" @update:info="wInfoUpdated"></Widget>
            </grid-item>
        </grid-layout>
    </div>
</template>

<script>

    import VueGridLayout from 'vue-grid-layout';

    import Widget from "../Widget";

    export default {
        name: "BoardGrid",
        components: {
            GridLayout: VueGridLayout.GridLayout,
            GridItem: VueGridLayout.GridItem,
            Widget
        },
        props: {
            widgets: Array,
            //layout: Array,
            bus: Object,
            tryMode: {
                type: Boolean,
                default: false
            }
        },
        data () {
            return {
                layoutBridge: null,
                widgetsBridge: null
            }
        },
        computed: {
            /*widgetsBridge: {
                set: function (newVal) {
                    this.$emit('update:widgets', newVal);
                },
                get: function () {
                    return _.cloneDeep(this.widgets);
                }
            },*/
            /*layoutBridge: {
                set: function () {
                },
                get: function () {
                    return this.widgets.map((w) => w.layout);
                }
            },*/
            /*widgetsBridge () {
                const ww = {};
                for (const w of this.widgets) {
                    ww[w.info.widget_uid] = _.cloneDeep(w);
                }

                return ww;
            }*/
        },
        methods: {
            wInfoUpdated () {
                this.$emit('update:widgets', this.widgetsBridge);
            }
        },
        watch: {
            /*layout: {
                handler: function (val) {
                    //this.layoutBridge = _.cloneDeep(val);
                    this.$set(this, 'layoutBridge', _.cloneDeep(val));
                    console.info(JSON.stringify(val));
                },
                deep: true
            },*/
            widgets: {
                handler: function (val) {
                    //this.widgetsBridge = _.cloneDeep(val);
                    //this.$set(this, 'widgetsBridge', val);
                    //this.$set(this, 'layoutBridge', val.map((w) => w.layout));

                    this.widgetsBridge = val;
                    this.layoutBridge = JSON.parse(JSON.stringify(val.map((w) => w.layout)));
                },
                deep: true
            }
        }
    }

</script>
