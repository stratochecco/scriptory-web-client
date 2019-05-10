<template>
    <b-container id="viewContainer">
        <b-row class="mb-4">
            <b-col>
                <b-card class="shadow mb-2">
                    <b-row>
                        <b-col sm="9" class="mb-2 mb-sm-0">
                            <b-input-group>
                                <b-input-group-text slot="prepend"><font-awesome-icon :icon="['fas', 'search']" /></b-input-group-text>
                                <b-form-input ref="searchInput" v-model="searchString" @input="search" @keyup.enter="$event.target.blur()" type="search" placeholder="Search something…"></b-form-input>
                            </b-input-group>
                        </b-col>
                        <b-col sm="3">
                            <b-form-radio-group
                                    v-model="cat"
                                    :options="['scripts', 'boards']"
                                    @input="search"
                                    buttons
                                    button-variant="outline-info"
                                    name="categoryRadioButton"
                                    class="w-100"
                            />
                        </b-col>
                    </b-row>
                </b-card>
                <hr>
                <b-card v-for="(r, index) in results" :key="index" class="shadow mb-2">
                    <span v-if="!r.public" class="private-lock" v-b-tooltip.hover title="Private"><font-awesome-icon :icon="['fas', 'lock']" /></span>
                    <h5>{{ r.name }}</h5>
                    <Flag width="24px" :quarters="r.user.flag" class="float-left mr-1"></Flag>
                    <em style="opacity: 0.4;">by <b-link :to="`/u/profile/${r.user.username}`">{{ r.user.username }}</b-link></em>
                    <div class="mt-1">
                        <span v-for="t in r['tags']" :key="t.text" class="tag-string mr-2">#{{ t.text }}</span>
                    </div>
                    <hr class="mt-1">
                    <template v-if="/^s/.test(r.uid)">
                        <b-button :to="`/s/try/${r.uid}`" variant="success" >Try <font-awesome-icon :icon="['fas', 'play']" /></b-button>
                        <b-button :to="`/s/view/${r.uid}`" variant="outline-info" >Doc <font-awesome-icon :icon="['fas', 'book']" /></b-button>
                    </template>
                    <template v-else-if="/^b/.test(r.uid)">
                        <b-button :to="`/b/try/${r.uid}`" variant="success" >Try <font-awesome-icon :icon="['fas', 'play']" /></b-button>
                        <b-button v-if="username === r.user.username" :to="`/b/run/${r.uid}`" variant="success" >Run <font-awesome-icon :icon="['fas', 'play']" /></b-button>
                        <b-button :to="`/b/view/${r.uid}`" variant="outline-info" >Info <font-awesome-icon :icon="['fas', 'book']" /></b-button>
                    </template>
                </b-card>
                <template v-if="!results.length && !loading">
                    <h3 class="empty-results-text text-center">{{ emptyTableString }}</h3>
                </template>
                <div style="text-align: center;"><b-spinner v-if="loading" class="loading-spinner" label="Loading…" variant="danger"></b-spinner></div>
            </b-col>
        </b-row>
    </b-container>
</template>

<script>

    import BContainer from "bootstrap-vue/src/components/layout/container";
    import BModal from "bootstrap-vue/src/components/modal/modal";
    import BButton from "bootstrap-vue/src/components/button/button";
    import BRow from "bootstrap-vue/src/components/layout/row";
    import BCol from "bootstrap-vue/src/components/layout/col";
    import BCard from "bootstrap-vue/src/components/card/card";
    import BTable from "bootstrap-vue/src/components/table/table";
    import BLink from "bootstrap-vue/src/components/link/link";
    import BInputGroup from "bootstrap-vue/src/components/input-group/input-group";
    import BInputGroupText from "bootstrap-vue/src/components/input-group/input-group-text";
    import BFormInput from "bootstrap-vue/src/components/form-input/form-input";
    import BFormRadioGroup from "bootstrap-vue/src/components/form-radio/form-radio-group";
    import BSpinner from "bootstrap-vue/src/components/spinner/spinner";
    import Flag from "../components/Flag";
    import contentResource from "../api/contentResource";
    import { EMPTY_RESULTS_STRING } from "../constants";

    export default {
        name: "Explore_View",
        components: {
            BSpinner,
            BFormRadioGroup,
            BFormInput,
            BInputGroupText, BInputGroup, BLink, BTable, BCard, BCol, BRow, BButton, BModal, BContainer, Flag },
        data () {
            return {
                searchString: '',
                cat: 'scripts',
                page: 1,
                endOfResults: false,
                resultsPerPage: 20,
                results: [],
                loading: false
            }
        },
        computed: {
            emptyTableString: () => EMPTY_RESULTS_STRING,
            username () {
                return this.$store.getters['auth/username'];
            }
        },
        methods: {
            fetchResults () {
                this.loading = true;
                document.title = this.searchString.length ? this.searchString : 'Explore' + ' - ' + this.$store.getters.appTitle;

                const cat = this.cat;
                contentResource.search({ searchString: this.searchString, categories: [cat], page: this.page })
                    .then((res) => {
                        const results = res.results[cat] || [];
                        this.results = this.results.concat(results);
                        this.page++;
                        if (res.results[cat].length < this.resultsPerPage) {
                            this.endOfResults = true;
                        }
                    })
                    .catch(() => {
                        this.results = [];
                        this.page = 1;
                    })
                    .finally(() => {
                        this.loading = false;

                        if (window.innerHeight > document.getElementById('viewContainer').offsetHeight) {
                            this.onScroll();
                        }
                    });
            },
            updateRoute () {
                this.results = [];
                this.page = 1;
                this.endOfResults = false;
                this.$router.push({ name: 'explore', query: { cat: this.cat, s: this.searchString }});
            },
            search () {
                this.debouncedSearch();
            },
            onScroll () {
                if (!this.results.length || this.loading || this.endOfResults) {
                    return;
                }
                let scrolledEnough = document.documentElement.scrollTop + window.innerHeight > document.getElementById('viewContainer').offsetHeight ||
                    window.innerHeight > document.getElementById('viewContainer').offsetHeight;
                if (scrolledEnough) {
                    this.throttledFetch();
                }
            }
        },
        created () {
            this.cat = this.$route.query.cat || 'scripts';
            this.searchString = this.$route.query.s || '';

            this.throttledFetch = _.throttle(this.fetchResults, 2000);
            this.debouncedSearch = _.debounce(this.updateRoute, 500);
        },
        mounted () {
            window.addEventListener('scroll', this.onScroll);

            this.fetchResults();
        },
        beforeRouteUpdate (to, from, next) {
            this.fetchResults();
            next();
        },
        beforeDestroy () {
            window.removeEventListener('scroll', this.onScroll);
        }
    }

</script>

<style scoped lang="scss">

    @import "../sass/_config/variables";

    code {
        color: $LightColor;
        word-break: normal;
    }

</style>

<style lang="scss" scoped>

    .tag-string {
        font-weight: 600;
        opacity: 0.8;
    }

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

    .private-lock {
        color: gold;
        font-size: 0.8rem;
        left: 0.4rem;
        position: absolute;
        top: 0.2rem;
    }

</style>
