<template>
	<b-container id="viewContainer">
		<b-row>
			<b-col>
				<b-jumbotron header-level="4" class="shadow" style="padding-bottom: 70px;">
					<template slot="header">
						Create, share and enjoy useful scripts!
					</template>
					<template slot="lead">
                        <b-button to="/b/try/bdemo" size="sm" variant="outline-light">Demo</b-button> to see how this thing works.
					</template>
				</b-jumbotron>
                <b-img src="/img/logo/Scriptory-S-icon-256.png" alt="Scriptory logo" fluid center class="big-logo"></b-img>
                </b-col>
            </b-row>
            <b-card no-body class="mt-3 shadow bg-light">
                <b-button :to="`/explore?cat=scripts`" class="btn-secondary m-2">Try new Scripts</b-button>
                <b-row>
                    <b-col md="6">
                        <b-card no-body class="m-2" header="New">
                            <b-list-group flush>
                                <b-list-group-item v-for="s in newAndPopular.new" :key="s.uid" :to="'/s/view/' + s.uid">
                                    <p class="mb-0">{{ s.name }}</p>
                                    <span class="float-left by-username">by <b-link :to="`/u/profile/${s.username}`" class="by-username">{{ s.username }}</b-link></span>
                                    <b-button :to="'/s/try/' + s.uid" class="float-right ml-1" size="sm" variant="success" >Try <font-awesome-icon :icon="['fas', 'play']" /></b-button>
                                </b-list-group-item>
                            </b-list-group>
                        </b-card>
                    </b-col>
                    <b-col md="6">
                        <b-card no-body class="m-2" header="Most Used">
                            <b-list-group flush>
                                <b-list-group-item v-for="s in newAndPopular.popular" :key="s.uid" :to="`/s/view/${s.uid}`">
                                    <p class="mb-0">{{ s.name }}</p>
                                    <span class="float-left by-username">by <b-link :to="'/u/profile/' + s.username" class="by-username">{{ s.username }}</b-link></span>
                                    <b-button :to="'/s/try/' + s.uid" class="float-right ml-1" size="sm" variant="success" >Try <font-awesome-icon :icon="['fas', 'play']" /></b-button>
                                </b-list-group-item>
                            </b-list-group>
                        </b-card>
                    </b-col>
                </b-row>
            </b-card>
            <b-card no-body class="mt-3 shadow bg-light">
                <b-button :to="`/explore?cat=boards`" class="btn-secondary m-2">Try new Boards</b-button>
                <b-row>
                    <b-col>
                        <b-card no-body class="m-2" header="New">
                            <b-list-group flush>
                                <b-list-group-item v-for="b in newBoards" :key="b.uid" :to="`/b/view/${b.uid}`">
                                    <p class="mb-0">{{ b.name }}</p>
                                    <p class="mb-0 new-board-description">{{ b.description }}</p>
                                    <span class="float-left by-username">by <b-link :to="`/u/profile/${b.user.username}`" class="by-username">{{ b.user.username }}</b-link></span>
                                    <b-button :to="`/b/try/${b.uid}`" class="float-right ml-1" size="sm" variant="success" >Try <font-awesome-icon :icon="['fas', 'play']" /></b-button>
                                </b-list-group-item>
                            </b-list-group>
					</b-card>
				</b-col>
			</b-row>
		</b-card>
		<b-card class="mt-3 shadow">
			<h2 id="what-is-it"><i>Welcome,</i></h2>
			<p><i>
				This is the place where you can create, keep and share any kind of simple application you need, at any moment.<br>
				Here, JavaScript scripts run as widgets inside boards.<br>
				Who doesn't even know what HTML means is also welcome. Everybody can enjoy all public scripts!<br><br>
				Scriptory is still in the beta stage so any suggestion or bug report is appreciated.<br><br>
				F.C.
			</i></p>
		</b-card>
	</b-container>
</template>

<script>

    import contentResource from '../../api/contentResource';
    import BLink from "bootstrap-vue/src/components/link/link";
    import BContainer from "bootstrap-vue/src/components/layout/container";
    import BRow from "bootstrap-vue/src/components/layout/row";
    import BCol from "bootstrap-vue/src/components/layout/col";
    import BJumbotron from "bootstrap-vue/src/components/jumbotron/jumbotron";
    import BButton from "bootstrap-vue/src/components/button/button";
    import BCard from "bootstrap-vue/src/components/card/card";
    import BImg from "bootstrap-vue/src/components/image/img";
    import BListGroup from "bootstrap-vue/src/components/list-group/list-group";
    import BListGroupItem from "bootstrap-vue/src/components/list-group/list-group-item";

	export default {
		name: "Pages_Home_View",
        components: { BListGroupItem, BListGroup, BImg, BCard, BButton, BJumbotron, BCol, BRow, BContainer, BLink },
        data () {
            return {
                newAndPopular: [],
                newBoards: []
            }
        },
        methods: {
		    isSafe (sandbox) {
		        for (const s in sandbox) {
		            if (s > 4 && sandbox[s]) {
		                return false;
                    }
                }

		        return true;
            }
        },
        mounted: function () {
		    const th1s = this;
            contentResource.newAndPopularScripts()
                .then((data) => {
                    th1s.newAndPopular = data.list;
                })
                .catch(() => {
                    th1s.newAndPopular = [];
                });
            contentResource.search({ searchString: '', categories: ['boards'], page: 1, order: 'recent', options: { private: false } })
                .then((res) => {
                    th1s.newBoards = res.results.boards;
                })
                .catch(() => {
                    th1s.newBoards = [];
                });
        }
	}

</script>

<style scoped lang="scss">

	@import "../../sass/_config/variables";

	.jumbotron {
		background-color: $SecondaryColor;
	}

    .by-username {
        color: darken($LightColor, 30%);
    }

    .new-board-description {
        color: darken($LightColor, 20%);
        font-size: 0.8rem;
    }

    .big-logo {
        height: 256px;
        margin: -160px auto -50px;
    }

</style>
