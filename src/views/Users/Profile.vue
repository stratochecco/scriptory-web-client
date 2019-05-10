<template>
	<b-container id="viewContainer">
		<b-row class="mb-4">
			<b-col lg="4">
				<b-card v-if="userData" class="shadow">
					<h3><Flag width="40px" :quarters="userData.flag"></Flag> {{ userData.username }}</h3>
					<em style="opacity: 0.4;">est. {{ userData.created | moment('YYYY.MM.DD') }}</em>
                    <template v-if="own">
                        <hr class="my-1">
                        <p class="my-0" style="opacity: 0.4;">{{ userData.email }}</p>
                    </template>
				</b-card>
			</b-col>
		</b-row>
		<b-row class="mb-4">
			<b-col>
				<b-card class="shadow">
					<template slot="header">
						<h5 class="m-0">Boards</h5>
					</template>
					<b-table ref="boardsTable" responsive hover show-empty :items="boardsTableItemsProvider" :fields="boardsTable.fields" :sort-by.sync="boardsTable.sortBy" :sort-desc="true" @row-clicked="runBoard" tbody-tr-class="clickable-tr">
                        <template slot="name" slot-scope="row">
                            <b-link :to="`/b/view/${row.item.uid}`" class="name-string">{{ row.item.name }}</b-link>
                            <span v-if="!row.item.public" class="private-lock ml-1" v-b-tooltip.hover title="Private"><font-awesome-icon :icon="['fas', 'lock']" /></span>
                        </template>
						<template slot="created" slot-scope="row">
							{{ (new Date(row.item.created)).toISOString() | moment('YYYY.MM.DD') }}
						</template>
                        <template slot="options" slot-scope="row">
                            <template v-if="own">
                                <div class="d-inline-flex">
                                    <b-button :disabled="loading" @click="askDeleteBoard(row.item)" size="sm" variant="danger">
                                        <font-awesome-icon :icon="['fas', 'trash']" />
                                    </b-button>
                                </div>
                            </template>
                            <template v-else>-</template>
                        </template>
						<div slot="empty" style="text-align: center;">
							<b-link v-if="own" :disabled="loading" to="/b/new">Create a new board!</b-link>
                            <em v-else>{{ emptyTableString }}</em>
						</div>
                        <div slot="table-busy" class="text-center text-info my-2">
                            <strong>Loading…</strong>
                        </div>
					</b-table>
				</b-card>
			</b-col>
		</b-row>
		<b-row class="mb-4">
			<b-col>
				<b-card header="Scripts" class="shadow">
					<template slot="header">
						<h5 class="m-0">Scripts</h5>
					</template>
					<b-table ref="scriptsTable" responsive hover show-empty :items="scriptsTableItemsProvider" :fields="scriptsTable.fields" :sort-by.sync="scriptsTable.sortBy" :sort-desc="true" @row-clicked="tryWidget" tbody-tr-class="clickable-tr">
						<template slot="name" slot-scope="row">
							<b-link :to="`/s/view/${row.item.uid}`" class="name-string">{{ row.item.name }}</b-link>
                            <span v-if="!row.item.public" class="private-lock ml-1" v-b-tooltip.hover title="Private"><font-awesome-icon :icon="['fas', 'lock']" /></span>
                        </template>
						<template slot="created" slot-scope="row">
							{{ (new Date(row.item.created)).toISOString() | moment('YYYY.MM.DD') }}
						</template>
						<template slot="options" slot-scope="row">
							<template v-if="own">
								<div class="d-inline-flex">
									<b-link :to="`/s/edit/${row.item.uid}`">
										<b-button size="sm" variant="light" class="mr-2">
											<font-awesome-icon :icon="['fas', 'edit']" />
										</b-button>
									</b-link>
									<b-button :disabled="loading" @click="askDeleteScript(row.item)" size="sm" variant="danger">
										<font-awesome-icon :icon="['fas', 'trash']" />
									</b-button>
								</div>
							</template>
							<template v-else>-</template>
						</template>
						<div slot="empty" style="text-align: center;">
							<b-link v-if="own" :disabled="loading" to="/s/edit/">Create a new script!</b-link>
                            <em v-else>{{ emptyTableString }}</em>
						</div>
                        <div slot="table-busy" class="text-center text-info my-2">
                            <strong>Loading…</strong>
                        </div>
					</b-table>
				</b-card>
			</b-col>
		</b-row>
        <b-modal ref="confirmDeleteBoardModal" lazy hide-footer header-bg-variant="danger" headerTextVariant="light" title="Warning">
            <template v-if="boardToDelete !== null">
                <div class="d-block text-center">
                    <h3>You are going to delete <code>{{ boardToDelete.name }}</code>.</h3>
                    <h4>Confirm?</h4>
                </div>
                <b-button class="mt-3" variant="outline-danger" block @click="deleteBoard(boardToDelete.uid)">Yes</b-button>
            </template>
        </b-modal>
        <b-modal ref="confirmDeleteScriptModal" lazy hide-footer header-bg-variant="danger" headerTextVariant="light" title="Warning">
            <template v-if="scriptToDelete !== null">
                <div class="d-block text-center">
                    <h3>You are going to delete <code>{{ scriptToDelete.name }}</code>.</h3>
                    <h4>Relative widgets store files must be deleted manually for safety.</h4>
                    <h4>Confirm?</h4>
                </div>
                <b-button class="mt-3" variant="outline-danger" block @click="deleteScript(scriptToDelete.uid)">Yes</b-button>
            </template>
        </b-modal>
	</b-container>
</template>

<script>

    import { mapState, mapActions } from 'vuex';
    import Flag from "../../components/Flag";
    import BContainer from "bootstrap-vue/src/components/layout/container";
    import BModal from "bootstrap-vue/src/components/modal/modal";
    import BButton from "bootstrap-vue/src/components/button/button";
    import BRow from "bootstrap-vue/src/components/layout/row";
    import BCol from "bootstrap-vue/src/components/layout/col";
    import BCard from "bootstrap-vue/src/components/card/card";
    import BTable from "bootstrap-vue/src/components/table/table";
    import BLink from "bootstrap-vue/src/components/link/link";
    import store from '../../store';
    import { EMPTY_RESULTS_STRING } from "../../constants";

    export default {
		name: "Users_Profile_View",
		components: { BLink, BTable, BCard, BCol, BRow, BButton, BModal, BContainer, Flag },
		data () {
			return {
				boardsTable: {
					sortBy: 'created',
					fields: [
						{ key: 'name', sortable: true },
						{ key: 'created', sortable: true, class: 'text-center' },
                        { key: 'options' }
					]
				},
				scriptsTable: {
					sortBy: 'created',
					fields: [
						{ key: 'name', sortable: true },
						{ key: 'created', sortable: true, class: 'text-center' },
						{ key: 'entities', sortable: true, label: 'Entities' },
						{ key: 'options' }
					]
				},
                boardToDelete: null,
                scriptToDelete: null,
                loading: false
			}
		},
		computed: {
			...mapState('profile', [
				'userData',
				'boards',
				'scripts'
			]),
            own () {
			    return this.userData.username === this.$store.getters['auth/username'] ? this.$store.getters['auth/user'] : false;
            },
            emptyTableString: () => EMPTY_RESULTS_STRING
        },
		methods: {
			...mapActions('profile', [
				'fetchBoards',
				'fetchScripts'
			]),
			...mapActions('profile', {
			    dispatchDeleteBoard: 'deleteBoard',
				dispatchDeleteScript: 'deleteScript'
			}),
			boardsTableItemsProvider () {
				return this.fetchBoards(this.userData.username)
					.then(function (data) {
						const items = [];
						if (data) {
							data.map(function (value) {
								items.push(value);
							})
						}
						return items;
					})
					.catch(() => {
						return [];
					});
			},
			scriptsTableItemsProvider () {
				return this.fetchScripts(this.userData.username)
					.then(function (data) {
						const items = [];
						if (data) {
							data.map(function (value) {
								items.push(value);
							})
						}
						return items;
					})
					.catch(() => {
						return [];
					});
			},
			runBoard: function (evt) {
                if (this.loading) {
                    return;
                }
                this.$router.push({ path: `/b/${ this.own ? `run` : `try` }/${evt.uid}` });
			},
			tryWidget: function (evt) {
			    if (this.loading) {
			        return;
                }
			    this.$router.push({ path: `/s/try/${evt.uid}` });
			},
            askDeleteBoard: function (item) {
                this.boardToDelete = item;
                this.$refs.confirmDeleteBoardModal.show();
            },
            deleteBoard: function (uid) {
			    this.loading = true;
                this.$refs.confirmDeleteBoardModal.hide();
                this.boardToDelete = null;
                const th1s = this;
                this.dispatchDeleteBoard(uid)
                    .then(function () {
                        th1s.$notify({
                            group: 'main',
                            title: 'Deleted',
                            text: '',
                            type: 'info',
                            duration: 4000
                        });
                        th1s.$refs.boardsTable.refresh();
                    })
                    .catch(function (e) {
                        console.warn(e);
                        th1s.$refs.boardsTable.refresh();
                    })
                    .finally(() => {
                        th1s.loading = false;
                    });
            },
			askDeleteScript: function (item) {
				this.scriptToDelete = item;
				this.$refs.confirmDeleteScriptModal.show();
			},
			deleteScript: function (uid) {
			    this.loading = true;
				this.$refs.confirmDeleteScriptModal.hide();
				this.scriptToDelete = null;
				const th1s = this;
				this.dispatchDeleteScript(uid)
					.then(function () {
						th1s.$notify({
							group: 'main',
							title: 'Deleted',
							text: '',
							type: 'info',
							duration: 4000
						});
						th1s.$refs.scriptsTable.refresh();
					})
					.catch(function (e) {
                        console.warn(e);
						th1s.$refs.scriptsTable.refresh();
					})
                    .finally(() => {
                        th1s.loading = false;
                    });
			}
		},
        beforeRouteEnter (to, from, next) {
            store.dispatch('profile/fetchUserData', to.params.username)
                .then(() => {
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
        beforeRouteUpdate (to, from, next) {
            const th1s = this;
            this.$store.dispatch('profile/fetchUserData', to.params.username)
                .then(() => {
                    document.title = th1s.userData.username + ' - ' + th1s.$store.getters.appTitle;
                    th1s.$refs.boardsTable.refresh();
                    th1s.$refs.scriptsTable.refresh();
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
		mounted: function () {
			document.title = this.userData.username + ' - ' + this.$store.getters.appTitle;
		}
	}

</script>

<style scoped lang="scss">

	@import "../../sass/_config/variables";

	code {
		color: $LightColor;
		word-break: normal;
	}

    .name-string {
        font-weight: 600;
    }

</style>

<style lang="scss">

    .clickable-tr {
        cursor: pointer;
    }

    .private-lock {
        color: gold;
    }

</style>
