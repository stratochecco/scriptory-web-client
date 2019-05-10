<template>
    <b-container id="viewContainer">
        <b-row>
            <b-col class="d-none d-lg-block col-lg-2">
                <div class="sidebar">
                    <nav
                            v-if="toc.toc && toc.toc.length > 0"
                            aria-label="Page table of contents"
                    >
                        <b-nav v-b-scrollspy.100 vertical class="m-toc section-nav">
                            <b-nav-item
                                    v-if="toc.title && toc.top"
                                    :href="toc.top"
                                    class="toc-entry font-weight-bold mb-2"
                            >
                                <span v-html="toc.title"></span>
                            </b-nav-item>

                            <template v-for="(h2, index) in toc.toc">
                                <b-nav
                                        v-if="isArray(h2) && h2.length > 0"
                                        :key="index"
                                        vertical
                                        class="mb-1"
                                >
                                    <b-nav-item
                                            v-for="h3 in h2"
                                            :key="h3.href"
                                            vertical
                                            pills
                                            :href="h3.href"
                                            v-scroll-to="`${h3.href}`"
                                            class="toc-entry toc-h3 mb-2"
                                    >
                                        <span v-html="h3.label"></span>
                                    </b-nav-item>
                                </b-nav>

                                <b-nav-item
                                        v-else
                                        :key="h2.href"
                                        :href="h2.href"
                                        v-scroll-to="`${h2.href}`"
                                        class="toc-entry toc-h2 mb-2"
                                >
                                    <span v-html="h2.label"></span>
                                </b-nav-item>
                            </template>
                        </b-nav>
                    </nav>
                </div>
            </b-col>
            <b-col class="col-12 col-lg-10">
                <div v-html="markedText"></div>
            </b-col>
        </b-row>
    </b-container>
</template>

<script>

    import BContainer from "bootstrap-vue/src/components/layout/container";
    import BRow from "bootstrap-vue/src/components/layout/row";
    import BNavbar from "bootstrap-vue/src/components/navbar/navbar";
    import BNavbarBrand from "bootstrap-vue/src/components/navbar/navbar-brand";
    import BNav from "bootstrap-vue/src/components/nav/nav";
    import BNavItem from "bootstrap-vue/src/components/nav/nav-item";
    const marked = require('marked');
    import contentResource from "../api/contentResource";

    // Remove any HTML tags, but leave entities alone
    const stripHTML = (str = '') => str.replace(/<[^>]+>/g, '')

    // Remove any double quotes from a string
    const stripQuotes = (str = '') => str.replace(/"/g, '')

    // Process an HTML readme and create a page TOC array
    // IDs are the only attribute on auto generated heading tags, so we take
    // advantage of that when using our RegExpr matches
    // Note IDs may not have quotes when the README's are parsed in production mode !?!?
    // Expected format: <h(1|2|3) id="?id-string"?>heading content</h(1|2|3)>
    const makeTOC = (readme) => {
        if (!readme) {
            return {}
        }
        const toc = []
        let top = ''
        let title = ''

        // Grab the first H1 tag with ID from readme
        const h1 = readme.match(/<h1 id=([^> ]+)>(.+?)<\/h1>/) || []
        if (h1) {
            top = `#${stripQuotes(h1[1])}`
            title = stripHTML(h1[2])
        }

        // Grab all the H2 and H3 headings with ID's from readme
        const headings = readme.match(/<h([23]) id=[^> ]+>.+?<\/h\1>/g) || []

        let idx = 0
        // Process the h2 and h3 headings into a TOC structure
        headings.forEach(heading => {
            // Pass the link, label and heading level
            const h2h3 = heading.match(/^<(h[23]) id=([^> ]+)>(.+?)<\/\1>$/)
            if (h2h3) {
                const tag = h2h3[1]
                const href = `#${stripQuotes(h2h3[2])}`
                const label = stripHTML(h2h3[3])
                if (tag === 'h2') {
                    toc.push({ href, label })
                    idx = toc.length
                } else if (tag === 'h3') {
                    // We nest h3 tags as a sub array
                    toc[idx] = toc[idx] || []
                    toc[idx].push({ href, label })
                }
            }
        })

        return { toc, title, top }
    }

    export default {
        name: "Docs_View",
        components: { BNavItem, BNav, BNavbarBrand, BNavbar, BRow, BContainer },
        data () {
            return {
                rawText: ''
            }
        },
        computed: {
            toc () {
                return makeTOC(this.markedText)
            },
            markedText () {
                return marked(this.rawText, {
                    sanitize: false
                });
            }
        },
        methods: {
            isArray (value) {
                return Array.isArray(value);
            }
        },
        beforeRouteEnter (to, from, next) {
            // Sad client side rendering. I'll fix that one day
            contentResource.fetchDoc(to.params.name)
                .then((text) => {
                    next((vm) => {
                        vm.rawText = text;
                    });
                })
                .catch((e) => {
                    if (e.data.code === 404) {
                        next('/not-found');
                    } else {
                        next('/');
                    }
                });
        },
        beforeRouteUpdate (to, from, next) {
            const th1s = this;
            contentResource.fetchDoc(to.params.name)
                .then((text) => {
                    th1s.rawText = text;
                    next();
                })
                .catch((e) => {
                    if (e.data.code === 404) {
                        next('/not-found');
                    } else {
                        next('/');
                    }
                });
        },
        watch: {
            markedText: {
                handler () {
                    if (this.$route.hash) {
                        const th1s = this;
                        // TODO: think of a good way
                        this.$nextTick(() => {
                            th1s.$nextTick(() => {
                                th1s.$scrollTo(th1s.$route.hash);
                            });
                        });
                    }
                },
                immediate: true
            }
        }
    }

</script>

<style scoped lang="scss">

    @import "../sass/_config/variables";

    .sidebar {
        border-right: 1px solid darken($PrimaryColor, 10%);
        font-size: 0.875rem;
        position: -webkit-sticky;
        position: sticky;
        top: 6rem;
        z-index: 1000;
    }

    .m-toc.section-nav ul {
        padding-left: 1rem;
    }

    .m-toc.section-nav .nav-link {
        line-height: 1.2;
    }

    .m-toc.section-nav .toc-entry a {
    }

    .m-toc.section-nav .nav-link.active {
        color: darken($PrimaryColor, 5%);
        background: transparent;
        font-weight: 600;
    }

    .m-toc.section-nav > .nav-item + .nav,
    .m-toc.section-nav > .nav-link + .nav {
        display: none;
    }

    .m-toc.section-nav > .nav-item.active + .nav,
    .m-toc.section-nav > .nav-link.active + .nav {
        display: flex !important;
    }

</style>
