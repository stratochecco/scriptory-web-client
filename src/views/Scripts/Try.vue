<template>
	<b-container id="viewContainer">
		<Board v-if="testWidget" :key="testBoardKey" :test-widget="testWidget" mode="try"></Board>
	</b-container>
</template>

<script>

	import Board from '../../components/board/Board';

	export default {
		name: "Scripts_Try_View",
		components: {
			Board
		},
		data () {
			return {
				testWidget: null,
                testBoardKey: 0
			}
		},
		computed: {

		},
		mounted: function () {
            document.title = this.$route.params.uid + ' - ' + this.$store.getters.appTitle;
            this.testWidget = this.$route.params.uid;
        }
	}

</script>

<style scoped lang="scss">

	@import "../../sass/_config/variables";

	#viewContainer {
		max-width: 100%;
	}

</style>
