<template>
    <b-modal id="addWidgetModal" ref="bModal" v-bind="$props" @shown="bModalShown">
        <b-input-group class="mb-2">
            <b-input-group-text slot="prepend"><font-awesome-icon :icon="['fas', 'search']" /></b-input-group-text>
            <b-form-input ref="searchInput" v-model="searchString" @input="search" @keyup.enter="$event.target.blur()" type="search" placeholder="Search…"></b-form-input>
        </b-input-group>

        <b-table ref="table" :fields="fields" :items="searchResults" @row-clicked="addWidget" :responsive="responsiveTable" show-empty hover>
            <template slot="name" slot-scope="row">
                {{ row.item.name }}
            </template>
            <template slot="user" slot-scope="row">
                <b-link :to="`/u/profile/${row.item.user.username}`">{{ row.item.user.username }}</b-link>
            </template>
            <div slot="empty" style="text-align: center;">
                <em>{{ emptyTableString }}</em>
            </div>
            <div slot="table-busy" class="text-center text-info my-2">
                <strong>Loading…</strong>
            </div>
        </b-table>
        <div style="text-align: center;"><b-spinner v-if="loading" class="loading-spinner" label="Loading…" variant="danger"></b-spinner></div>
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
    import BSpinner from "bootstrap-vue/src/components/spinner/spinner";
    import contentResource from "../../api/contentResource";
    import { EMPTY_RESULTS_STRING } from "../../constants";

    export default {
        name: "AddWidgetModal",
        extends: BModal,
        components: {
            BSpinner,
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
                searchString: '',
                searchResults: [],
                page: 1,
                endOfResults: false,
                resultsPerPage: 20,
                loading: false,
                fields: ['name', { 'key': 'user', 'label': 'By' }]
            }
        },
        computed: {
            emptyTableString: () => EMPTY_RESULTS_STRING,
            responsiveTable: () => !/(?=.*iPad|iPhone|iPod)(?=.*WebKit)/.test(window.navigator.userAgent) /* fu*k WebKit. I think there's a bug with the overflow in Bootstrap */
        },
        methods: {
            show () {
                this.$refs.bModal.show();
                this.$nextTick(function () {
                    document.getElementById('addWidgetModal___BV_modal_body_').addEventListener('scroll', this.onScroll);
                });
            },
            hide () {
                document.getElementById('addWidgetModal___BV_modal_body_').removeEventListener('scroll', this.onScroll);
                this.$refs.bModal.show();
            },
            bModalShown () {
                this.$refs.searchInput.focus();

                this.throttledFetch();
            },
            fetchResults () {
                this.loading = true;

                contentResource.search({ searchString: this.searchString, categories: ['scripts'], page: this.page })
                    .then((res) => {
                        const results = res.results.scripts || [];
                        this.searchResults = this.searchResults.concat(results);
                        this.page++;
                        if (res.results.scripts.length < this.resultsPerPage) {
                            this.endOfResults = true;
                        }
                    })
                    .catch(() => {
                        this.searchResults = [];
                        this.page = 1;
                        this.endOfResults = false;
                    })
                    .finally(() => {
                        this.loading = false;
                        if (this.$refs.table) {
                            this.$refs.table.refresh();
                        }

                        this.$nextTick(function () {
                            // I should think of a better way to do that. This is ugly and a BootstrapVue update may break this if id changes
                            if (window.innerHeight > document.getElementById('addWidgetModal___BV_modal_body_').scrollHeight) {
                                this.onScroll();
                            }
                        });
                    });
            },
            search () {
                this.searchResults = [];
                this.page = 1;
                this.endOfResults = false;
                this.debouncedSearch();
            },
            onScroll () {
                if (!this.searchResults.length || this.loading || this.endOfResults) {
                    return;
                }
                const modalScroll = document.getElementById('addWidgetModal___BV_modal_body_');
                let scrolledEnough =
                    modalScroll.scrollTop + window.innerHeight > modalScroll.scrollHeight ||
                    window.innerHeight > modalScroll.scrollHeight;
                if (scrolledEnough) {
                    this.throttledFetch();
                }
            },
            addWidget (evt) {
                this.$emit('addWidget', evt.uid);
            }
        },
        created () {
            this.throttledFetch = _.throttle(this.fetchResults, 1000);
            this.debouncedSearch = _.debounce(this.fetchResults, 500);
        }
    }

</script>

<style lang="scss" scoped>

    .empty-results-text {
        font-size: 2rem;
        margin-top: 10%;
        opacity: 0.8;
    }

    .loading-spinner {
        height: 4rem;
        margin: auto;
        width: 4rem;
    }

</style>
